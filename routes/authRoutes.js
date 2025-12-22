const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Helper tạo JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// REGISTER -> POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, profile, role } = req.body;

    // (Khuyến nghị) Không cho tự set role = admin từ register
    // Nếu giảng viên yêu cầu vẫn cho set role thì bạn bỏ đoạn này
    const safeRole = role && role === 'admin' ? 'user' : (role || 'user');

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User đã tồn tại với email này' });
    }

    const newUser = await User.create({
      username,
      email,
      password,
      profile,
      role: safeRole,
    });

    return res.status(201).json({
      message: 'Tạo User thành công',
      data: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profile: newUser.profile,
        role: newUser.role,
      },
      token: generateToken(newUser._id),
    });
  } catch (err) {
    return res.status(400).json({ message: 'Tạo user thất bại', error: err.message });
  }
});

// LOGIN -> POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi Server', error: err.message });
  }
});

// FORGOT PASSWORD -> POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('Không tìm thấy Email này trong hệ thống');
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    const message =
      `Bạn vừa yêu cầu đổi mật khẩu.\n` +
      `Hãy gửi request PUT đến link sau để đặt lại mật khẩu:\n\n${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Token đổi mật khẩu (Hết hạn sau 10p)',
        message,
      });

      return res.status(200).json({ success: true, message: 'Đã gửi email hướng dẫn!' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new Error('Không thể gửi email, vui lòng thử lại'));
    }
  } catch (err) {
    next(err);
  }
});

// RESET PASSWORD -> PUT /api/v1/auth/reset-password/:token
router.put('/reset-password/:token', async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Thiếu password mới' });
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken'); // optional

    if (!user) {
      res.status(400);
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }

    user.password = password; // pre('save') sẽ tự hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;