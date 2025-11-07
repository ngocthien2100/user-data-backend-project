// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Tên đăng nhập không được để trống.'],
    unique: true,
    trim: true,
    minlength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự.'],
    maxlength: [30, 'Tên đăng nhập không được quá 30 ký tự.']
    
  },
  passwordHash: {
  type: String,
  required: [true, 'Mật khẩu là bắt buộc (passwordHash).'],
  minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự.'],
  trim: true
  },

  profile: {
  fullName: { type: String, trim: true, maxlength: 80 }, // tùy chọn cho bước UPDATE trong lab
  },

  email: {
    type: String,
    required: [true, 'Email không được để trống.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/, 'Vui lòng nhập email hợp lệ.']
  },

  age: {
    type: Number,
    min: [18, 'Bạn phải đủ 18 tuổi.'],
    max: [120, 'Tuổi không hợp lệ.']
  },
  
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'moderator'],
      message: 'Vai trò "{VALUE}" không được hỗ trợ.'
    },
    default: 'user'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
