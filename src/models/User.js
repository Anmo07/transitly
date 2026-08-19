const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  role: {
    type: String,
    enum: ['CUSTOMER', 'OPERATOR', 'OPERATIONS_MANAGER', 'DELIVERY_PARTNER'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
