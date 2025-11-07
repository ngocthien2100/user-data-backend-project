const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // có thể chưa có Product model, vẫn để ref để mở rộng
  name: String,          // snapshot tên SP lúc đặt
  price: Number,         // snapshot giá lúc đặt
  quantity: { type: Number, default: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference
  items: [orderItemSchema], // Embed
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending','paid','shipped','completed','canceled'], default: 'pending' },
  address: {
    fullName: String,
    phone: String,
    line1: String,
    ward: String,
    district: String,
    city: String
  },
  payment: {
    method: { type: String, enum: ['cod','vnpay','momo','stripe'], default: 'cod' },
    paidAt: Date,
    transactionId: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
