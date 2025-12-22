// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- 1. MIDDLEWARE: BẢO VỆ (PROTECT) ---
// Kiểm tra user đã đăng nhập (có token hợp lệ) hay chưa
const protect = async (req, res, next) => {
  let token;

  // 1. Lấy token từ header Authorization: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Tìm user theo id trong token, bỏ password
      req.user = await User.findById(decoded.id).select('-password');

      // 4. Cho đi tiếp
      return next();
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ message: 'Không có quyền truy cập, token không hợp lệ' });
    }
  }

  // 5. Không có token
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Không có quyền truy cập, không tìm thấy token' });
  }
};

// --- 2. MIDDLEWARE: PHÂN QUYỀN (AUTHORIZE) ---
// ...roles là danh sách role được phép, ví dụ: 'admin'
const authorize = (...roles) => {
  return (req, res, next) => {
    // Middleware này phải chạy SAU protect
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Lỗi không xác định được người dùng' });
    }

    // Kiểm tra role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Vai trò '${req.user.role}' không có quyền thực hiện chức năng này`,
      });
    }

    // OK
    next();
  };
};

module.exports = { protect, authorize };