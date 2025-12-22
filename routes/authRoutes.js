const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');


// Ghi chu: Tao mot ham helpers de tao token JWT
const generatoteToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

//-- 1. Endpoint: Tạo user mới (REGISTER) -> POST /api/v1/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, profile, role } = req.body;
        //1. Kiểm tra user đã tồn tại chưa
        const userExists = await User.findOne({ email });
        if(userExists){
            return res.status(400).json({ message: 'User đã tồn tại với email này' });
        }
        //2. Tạo user mới
        const newUser = await User.create({
            username,
            email,
            password,
            profile,
            role
        });
        //3. Trả về thông tin user (trừ password) và cấp token ngay
        if (newUser) {
            res.status(201).json({
                message:'Tạo User thành công',
                data: {
                    _id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    profile: newUser.profile,
                    role: newUser.role,
                },
                token: generatoteToken(newUser._id)
            });
        }
    } catch (err){
        res.status(400).json({message: "Tạo user thất bại", error: err.message});
    }
});

//-- 2. Endpoint: Đăng nhập (LOGIN) -> POST /api/v1/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        //1. Tìm user theo email
        const user = await User.findOne({ email }).select('+password');

        if(!user){
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
        //2. Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
        //3. Trả về thông tin user (trừ password) và cấp token
        res.status(200).json({
            message: 'Đăng nhập thành công',
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profile: user.profile,
                role: user.role,
            },
            token: generatoteToken(user._id)
        });
    } catch (err){
        res.status(500).json({message: "Lỗi Server", error: err.message});
    }
});

// 1. Quên mật khẩu - Gửi email đặt lại mật khẩu
router.post('/forgot-password', async (req, res, next) => {
 try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        res.status(404);
        throw new Error('Không tìm thấy Email này trong hệ thống');
    }
 // Tạo token
 const resetToken = user.getResetPasswordToken();
 await user.save({ validateBeforeSave: false }); // Lưu lại token vào DB

 // Tạo URL reset (Frontend sẽ dùng link này)
 const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
 const message = `Bạn vừa yêu cầu đổi mật khẩu. Hãy gửi request PUT đến link sau để đặt lại:\n\n${resetUrl}`;

 try {
    await sendEmail({
        email: user.email,
        subject: 'Token đổi mật khẩu (Hết hạn sau 10p)',
        message
    });
 res.status(200).json({ success: true, message: 'Đã gửi email hướng dẫn!' });
} catch (err) {
    // Nếu gửi mail lỗi thì xóa token trong DB đi
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new Error('Không thể gửi email, vui lòng thử lại'));
}
} catch (err) {
    next(err);
}
});
// 2. ĐẶT LẠI MẬT KHẨU (Reset Password)
router.put('/reset-password/:token', async (req, res, next) => {
 try {
 // Hash token từ URL để so sánh với token đã hash trong DB
 const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token) // Token lấy từ URL
    .digest('hex');
 // Tìm user có token đó VÀ chưa hết hạn ($gt: greater than now)
 const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
});
 if (!user) {
    res.status(400);
    throw new Error('Token không hợp lệ hoặc đã hết hạn');
}
// Đặt lại mật khẩu mới
user.password = req.body.password; //Hook pre 'save' trong model User sẽ tự động hash mật khẩu
// Xóa token và thời gian hết hạn
user.resetPasswordToken = undefined;
user.resetPasswordExpire = undefined;

await user.save(); // Lưu user với mật khẩu mới

res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.' });
} catch (err) {
    next(err);
}
});
 module.exports = router;