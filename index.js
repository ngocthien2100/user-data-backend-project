// index.js
const connectDB = require('./db'); // thêm dòng này ở đầu file

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware chung
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Kết nối tới MongoDB
connectDB();   

// Routes
const userRoutes = require('./routes/userRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes');  // <-- THÊM DÒNG NÀY
const productRoutes  = require('./routes/productRoutes');   // <-- THÊM DÒNG NÀY
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);  // <-- THÊM DÒNG NÀY
app.use('/api/v1/products',  productRoutes);    // <-- THÊM DÒNG NÀY


// Health check (gộp một route chính)
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'User Data API',
    version: '1.0',
    health: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found', path: req.originalUrl });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
