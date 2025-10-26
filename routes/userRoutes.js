// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Demo data (in-memory)
let users = [
  { id: 1, username: 'Alice', email: 'alice@dev.com' },
  { id: 2, username: 'Bob',   email: 'bob@dev.com'  }
];

// Lấy danh sách người dùng
router.get('/', (_req, res) => {
  res.status(200).json({ message: 'OK', data: users });
});

// Tạo người dùng mới
router.post('/', (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).json({ message: 'username và email là bắt buộc' });
  }
  const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const newUser = { id, username, email };
  users.push(newUser);
  return res.status(201).json({ message: 'Created', data: newUser });
});

// Lấy chi tiết theo ID
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'id phải là số nguyên' });
  }
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ message: `Không tìm thấy user id ${id}` });
  return res.status(200).json({ message: 'OK', data: user });
});

// Cập nhật người dùng
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'id phải là số nguyên' });
  }
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ message: `Không tìm thấy user id ${id}` });
  users[idx] = { ...users[idx], ...req.body, id }; // giữ nguyên id
  return res.status(200).json({ message: 'Updated', data: users[idx] });
});

// Xoá người dùng
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'id phải là số nguyên' });
  }
  const before = users.length;
  users = users.filter(u => u.id !== id);
  if (users.length === before) {
    return res.status(404).json({ message: `Không tìm thấy user id ${id}` });
  }
  return res.status(204).send(); // xoá thành công
});

module.exports = router;
