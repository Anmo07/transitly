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
    required: true,
    default: 'CUSTOMER'
  },
  avatarUrl: { 
    type: String, 
    default: 'https://ui-avatars.com/api/?name=Alex+Mitchell&background=0066FF&color=fff' 
  },
  settings: {
    pushNotifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: false },
    locationServices: { type: Boolean, default: true },
    language: { type: String, default: 'English (US)' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
