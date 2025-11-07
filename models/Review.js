const mongoose = require('mongoose');

const userSnapshotSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  username: String,
  avatar: String
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference
  user: userSnapshotSchema,  // Embed snapshot để hiển thị nhanh
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
