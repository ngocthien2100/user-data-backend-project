// routes/userRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// --- helper bắt lỗi Mongoose ---
function sendMongooseError(err, res, next) {
  if (err?.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    return res.status(409).json({ message: `Trùng dữ liệu ở trường: ${fields.join(', ')}` });
  }
  if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: details });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ message: `Giá trị không hợp lệ cho trường "${err.path}"` });
  }
  return next(err);
}

// READ ALL  -> GET /api/v1/users?page=&limit=&search=&role=
router.get('/', async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      const q = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [{ username: q }, { email: q }, { 'profile.fullName': q }];
    }
    if (req.query.role) filter.role = req.query.role;

    const [items, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).lean(),
      User.countDocuments(filter)
    ]);

    res.status(200).json({ message: 'OK',
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: items
    });
  } catch (err) { next(err); }
});

// CREATE     -> POST /api/v1/users
// BẮT BUỘC: username, email, passwordHash (theo lab)
// CREATE  -> POST /api/v1/users
router.post('/', async (req, res, next) => {
  try {
    const { username, email, password, age, role, profile } = req.body;

    // ✅ yêu cầu đúng với model mới: password thay cho passwordHash
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, password là bắt buộc' });
    }

    // create -> trigger pre('save') => tự hash password
    const user = await User.create({ username, email, password, age, role, profile });

    // không trả password về client
    const { password: _pw, ...safe } = user.toObject();
    res.status(201).json({ message: 'Created', data: safe });
  } catch (err) {
    sendMongooseError(err, res, next);
  }
});

// READ ONE   -> GET /api/v1/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'id không hợp lệ' });

    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ message: `Không tìm thấy user id ${id}` });
    res.status(200).json({ message: 'OK', data: user });
  } catch (err) { next(err); }
});

// UPDATE     -> PUT /api/v1/users/:id
// Lab gợi ý ví dụ đổi profile.fullName
// UPDATE  -> PUT /api/v1/users/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'id không hợp lệ' });

    const { password, ...rest } = req.body;

    // Nếu có password -> phải save() để trigger pre('save')
    if (password !== undefined) {
      const doc = await User.findById(id).select('+password'); // chọn password vì select:false
      if (!doc) return res.status(404).json({ message: `Không tìm thấy user id ${id}` });

      // cập nhật các field khác
      Object.entries(rest).forEach(([k, v]) => { doc.set(k, v); });

      // đặt mật khẩu mới -> pre('save') sẽ tự hash
      doc.password = password;

      await doc.save(); // chạy validators + pre('save')

      const obj = doc.toObject();
      delete obj.password;
      return res.status(200).json({ message: 'Updated', data: obj });
    }

    // Không đổi password -> có thể dùng findByIdAndUpdate
    const allowed = ['username','email','age','role','profile','cart','orders','wishlist'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
    if (!user) return res.status(404).json({ message: `Không tìm thấy user id ${id}` });
    return res.status(200).json({ message: 'Updated', data: user });
  } catch (err) {
    sendMongooseError(err, res, next);
  }
});

// DELETE     -> DELETE /api/v1/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'id không hợp lệ' });

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: `Không tìm thấy user id ${id}` });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;