const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['CARD', 'UPI', 'WALLET'], default: 'CARD' },
  brand: { type: String, default: 'VISA' },
  cardNumber: { type: String },
  expiry: { type: String },
  upiId: { type: String },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
