/* FILE: ROUTES/ORDERROUTES.JS */

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/authMiddleware');

// =================================================================
// 1. TẠO ĐƠN HÀNG (User đã đăng nhập)
// =================================================================
router.post('/', protect, async (req, res) => {
  try {
    const { items, total, subtotal, shippingAddress } = req.body;

    // Ghi chú:
    // Thực tế cần kiểm tra tồn kho sản phẩm ở đây (Advanced)
    // Hiện tại chúng ta tin tưởng dữ liệu gửi lên để đơn giản hóa

const newOrder = await Order.create({
  user: req.user._id,
  items,
  subtotal,
  total,
  shippingAddress
});

    res.status(201).json({
      message: 'Đặt hàng thành công',
      data: newOrder
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// =================================================================
// 2. LẤY ĐƠN HÀNG CỦA TÔI (User xem lịch sử mua)
// =================================================================
router.get('/my-orders', protect, async (req, res) => {
  try {
    // Tìm order có user trùng với user đang đăng nhập
    // populate('user'): Lấy thông tin chi tiết user (username, email)
    // populate('items.product'): Lấy thông tin chi tiết sản phẩm (nâng cao)

    const orders = await Order.find({ user: req.user._id })
      .populate('user', 'username email')
      .sort('-createdAt');

    res.status(200).json({
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================================================================
// 3. LẤY TẤT CẢ ĐƠN HÀNG (Admin only)
// =================================================================
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username email')
      .sort('-createdAt');

    res.status(200).json({
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;