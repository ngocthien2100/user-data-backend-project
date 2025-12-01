// routes/productRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// --- helper bắt lỗi Mongoose (giống userRoutes) ---
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
 * QUY TẮC THEO BÀI WEEK10:
 * - Ai cũng xem được: GET /, GET /:id  => KHÔNG cần login.
 * - Chỉ Admin mới được thêm / sửa / xóa: POST, PUT, DELETE => protect + authorize('admin')
 */

// -------------------- READ ALL (PUBLIC) --------------------
// GET /api/v1/products
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      const q = new RegExp(req.query.search.trim(), 'i');
      // tùy model Product của bạn, mình giả sử có field name và description
      filter.$or = [{ name: q }, { description: q }];
    }

    const [items, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
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

// -------------------- READ ONE (PUBLIC) --------------------
// GET /api/v1/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'id không hợp lệ' });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res
        .status(404)
        .json({ message: `Không tìm thấy product id ${id}` });
    }

    res.status(200).json({ message: 'OK', data: product });
  } catch (err) {
    next(err);
  }
});

// -------------------- CREATE (ADMIN) --------------------
// POST /api/v1/products
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    // body gửi gì thì lưu bấy nhiêu, Mongoose sẽ tự validate theo Product Schema
    const product = await Product.create(req.body);
    res.status(201).json({ message: 'Created', data: product });
  } catch (err) {
    sendMongooseError(err, res, next);
  }
});

// -------------------- UPDATE (ADMIN) --------------------
// PUT /api/v1/products/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'id không hợp lệ' });
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!product) {
      return res
        .status(404)
        .json({ message: `Không tìm thấy product id ${id}` });
    }

    res.status(200).json({ message: 'Updated', data: product });
  } catch (err) {
    sendMongooseError(err, res, next);
  }
});

// -------------------- DELETE (ADMIN) --------------------
// DELETE /api/v1/products/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'id không hợp lệ' });
    }

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: `Không tìm thấy product id ${id}` });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
