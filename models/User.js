const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const profileSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  avatar: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  profile: profileSchema,

  // References
  orders:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  reviews:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  wishlist:  { type: mongoose.Schema.Types.ObjectId, ref: 'Wishlist' },  // 1-1
  cart:      { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }       // 1-1
}, { timestamps: true });

// virtual: không trả hash ra API
userSchema.methods.toJSONSafe = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

userSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
