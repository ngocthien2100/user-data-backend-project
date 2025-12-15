const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

module.exports = router;