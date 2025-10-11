// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// 1️⃣ GET - Lấy danh sách người dùng
router.get('/', (req, res) => {
  const userList = [
    { id: 1, username: "Alice" },
    { id: 2, username: "Bob" }
  ];
  res.status(200).json({
    message: "Lấy danh sách người dùng thành công (200 OK)",
    data: userList
  });
});

// 2️⃣ POST - Tạo người dùng mới
router.post('/', (req, res) => {
  const userData = req.body;
  res.status(201).json({
    message: "Người dùng đã được tạo thành công (201 Created)",
    receivedData: userData
  });
});

// 3️⃣ GET - Lấy chi tiết 1 người dùng theo ID
router.get('/:id', (req, res) => {
  const userId = req.params.id;
  if (userId === '1') {
    res.status(200).json({
      message: `GET: Chi tiết người dùng ID ${userId} thành công`,
      data: { id: 1, username: "Alice", email: "alice@dev.com" }
    });
  } else {
    res.status(404).json({
      message: `GET: Không tìm thấy người dùng có ID: ${userId}`
    });
  }
});

// 4️⃣ PUT - Cập nhật người dùng
router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const updateData = req.body;
  res.status(200).json({
    message: `PUT: Cập nhật người dùng ID ${userId} thành công (200 OK)`,
    updatedData: updateData
  });
});

// 5️⃣ DELETE - Xóa người dùng
router.delete('/:id', (req, res) => {
  const userId = req.params.id;
  res.status(204).send();
});

module.exports = router;