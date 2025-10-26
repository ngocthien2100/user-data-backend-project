const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true }, // 1-1
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] // Embed danh sách id
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
