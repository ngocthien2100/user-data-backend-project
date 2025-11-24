// routes/productRoutes.js
const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Tạo Product (truyền mảng categories là _id Category)
router.post('/', async (req, res, next) => {
  try {
    const { name, author, description, price, stockQuantity, categories, imageUrl } = req.body;
    const doc = await Product.create({ name, author, description, price, stockQuantity, categories, imageUrl });
    res.status(201).json({ message: 'Created', data: doc });
  } catch (e) { next(e); }
});

// List Product (populate categories)
router.get('/', async (_req, res, next) => {
  try {
    const list = await Product.find().populate('categories', 'name').lean();
    res.status(200).json({ message: 'OK', data: list });
  } catch (e) { next(e); }
});

module.exports = router;
