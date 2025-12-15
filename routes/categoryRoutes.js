// routes/categoryRoutes.js
const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

// Tạo Category
router.post('/', async (req, res, next) => {
  try {
    const doc = await Category.create({ name: req.body.name });
    res.status(201).json({ message: 'Created', data: doc });
  } catch (e) { next(e); }
});

// List Category
router.get('/', async (_req, res, next) => {
  try {
    const list = await Category.find().lean();
    res.status(200).json({ message: 'OK', data: list });
  } catch (e) { next(e); }
});

module.exports = router;
