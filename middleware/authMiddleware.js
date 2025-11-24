/*
 * ========================================
 * FILE: middleware/authMiddleware.js
 * MÔ TẢ: Middleware để kiểm tra Token (JWT) và Phân quyền
 * ========================================
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // cần model User

// --- 1. MIDDLEWARE: BẢO VỆ (PROTECT) ---
// Kiểm tra xem user đã đăng nhập (có token hợp lệ) hay chưa
exports.protect = async (req, res, next) => {
  let token;

  // 1. Kiểm tra header Authorization có dạng "Bearer <token>" không
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Lấy phần token sau chữ Bearer
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify token bằng JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Tìm user theo id trong payload, loại bỏ password
      req.user = await User.findById(decoded.id).select('-password');

      // 5. Cho đi tiếp
      return next();
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ message: 'Không có quyền truy cập, token không hợp lệ' });
    }
  }

  // 6. Không có token
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Không có quyền truy cập, không tìm thấy token' });
  }
};

// --- 2. MIDDLEWARE: PHÂN QUYỀN (AUTHORIZE) ---
// ...roles là danh sách vai trò được phép (vd: 'admin')
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Middleware này phải chạy SAU protect => đã có req.user
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Lỗi không xác định được người dùng' });
    }

    // Kiểm tra role của user có nằm trong roles cho phép không
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Vai trò '${req.user.role}' không có quyền thực hiện chức năng này`,
      });
    }

    // Ok thì cho đi tiếp
    next();
  };
};
