/* FILE: UTILS/CLOUDINARY.JS */
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// 1. Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Cấu hình Multer (Lưu file vào bộ nhớ tạm RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 3. Hàm upload lên Cloudinary từ Buffer
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'vlsc-shop' }, // Tên thư mục trên Cloudinary
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary };