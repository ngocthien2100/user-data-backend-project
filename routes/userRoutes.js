// routes/userRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// --- helper bắt lỗi Mongoose ---
function sendMongooseError(err, res, next) {
  if (err?.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    return res
      .status(409)
      .json({ message: `Trùng dữ liệu ở trường: ${fields.join(', ')}` });
  }

  if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ message: 'Dữ liệu không hợp lệ', errors: details });
  }

  if (err?.name === 'CastError') {
    return res
      .status(400)
      .json({ message: `Giá trị không hợp lệ cho trường "${err.path}"` });
  }

  return next(err);
}

/**
 * 1. ADMIN: Lấy danh sách Users
 * GET /api/v1/users?page=&limit=&search=&role=
 */
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      const q = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { username: q },
        { email: q },
        { 'profile.fullName': q },
      ];
    }
    if (req.query.role) filter.role = req.query.role;

    const [items, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      message: 'OK',
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: items,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. USER: Lấy thông tin cá nhân
 * GET /api/v1/users/me
 */
router.get('/me', protect, async (req, res) => {
  res.status(200).json({
    message: 'Lấy thông tin cá nhân thành công',
    data: req.user,
  });
});

/**
 * 3. USER: Cập nhật hồ sơ cá nhân
 * PUT /api/v1/users/me
 * Chỉ cho phép sửa profile, bỏ qua role/password trong body
 */
router.put('/me', protect, async (req, res, next) => {
  try {
    const { profile } = req.body; // Cố ý chỉ lấy profile

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profile },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      message: 'Cập nhật thông tin cá nhân thành công',
      data: updatedUser,
    });
  } catch (err) {
    sendMongooseError(err, res, next);
  }
});

/**
 * 4. ADMIN: Lấy chi tiết 1 User
 * GET /api/v1/users/:id
 */
router.get('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'id không hợp lệ' });
    }

    const user = await User.findById(id).lean();
    if (!user) {
      return res
        .status(404)
        .json({ message: `Không tìm thấy user id ${id}` });
    }

    res.status(200).json({ message: 'OK', data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. ADMIN: Cập nhật User
 * PUT /api/v1/users/:id
 * - Cho phép đổi role, profile,...
 * - Nếu có gửi password mới -> dùng save() để chạy pre('save') (hash mật khẩu)
 */
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'id không hợp lệ' });
    }

    const { password, ...rest } = req.body;

    if (password !== undefined) {
      // Cần dùng doc.save() để trigger pre('save')
      const doc = await User.findById(id).select('+password');
      if (!doc) {
        return res
          .status(404)
          .json({ message: `Không tìm thấy user id ${id}` });
      }

      // cập nhật field khác
      Object.entries(rest).forEach(([k, v]) => {
        doc.set(k, v);
      });

      // đặt password mới -> sẽ được hash trong pre('save') (User model của bạn đã có)  
      doc.password = password;
      await doc.save();

      const obj = doc.toObject();
      delete obj.password;

      return res.status(200).json({ message: 'Updated', data: obj });
    }

    // Không đổi password -> dùng findByIdAndUpdate
    const allowed = [
      'username',
      'email',
      'age',
      'role',
      'profile',
      'cart',
      'orders',
      'wishlist',
    ];
    const update = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });

    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!user) {
      return res
        .status(404)
        .json({ message: `Không tìm thấy user id ${id}` });
    }

    res.status(200).json({ message: 'Updated', data: user });
  } catch (err) {
    sendMongooseError(err, res, next);
  }
});

/**
 * 6. ADMIN: Xóa User
 * DELETE /api/v1/users/:id
 * Theo slide Week10 nên trả về 200 + message.  [oai_citation:1‡Week 10 Bảo mật P.4 - Tuân thủ Pháp lý & Hoàn thiện CRUD.pdf](sediment://file_00000000b73071faa570b53cda27f258)
 */
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'id không hợp lệ' });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: `Không tìm thấy user id ${id}` });
    }

    return res.status(200).json({ message: 'Đã xóa User thành công' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;