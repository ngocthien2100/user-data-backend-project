// models/User.js
const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Tên đăng nhập không được để trống.'],
    unique: true,
    trim: true,
    minlength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự.'],
    maxlength: [30, 'Tên đăng nhập không được quá 30 ký tự.']
  },
  // passwordHash: {
  // type: String,
  // required: [true, 'Mật khẩu là bắt buộc (passwordHash).'],
  // minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự.'],
  // trim: true
  // },
  password:{
    type: String,
    required: [true, 'Mật khẩu là bắt buộc.'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự.'],
    select: false
  },

  profile: {
    fullName: { 
      type: String,
      default: '', 
      trim: true, 
    }, // tùy chọn cho bước UPDATE trong lab
    phone:{
      type: String,
      default: '',
      trim: true
    },
    // Avatar URL
    avatarUrl:{
      type: String,
      default: '',
      trim: true
    }
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
  },
  cart:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  },
  orders:[
    {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
    }
  ],
  wishlist:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wishlist'
  },

  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: Date,

}, { timestamps: true });


userSchema.pre('save', async function (next) {

  if (!this.isModified('password')) {
    return next();
  }
  
  try {

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.getResetPasswordToken = function () {
 // 1. Tạo chuỗi ngẫu nhiên (20 byte)
 const resetToken = crypto.randomBytes(20).toString('hex');
 // 2. Hash token và lưu vào Database (để bảo mật, không lưu token gốc)
 this.resetPasswordToken = crypto
 .createHash('sha256')
 .update(resetToken)
 .digest('hex');
 // 3. Token hết hạn sau 10 phút
 this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
 return resetToken; // Trả về token gốc (chưa hash) để gửi qua email
};

module.exports = mongoose.model('User', userSchema);