const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  category: { type: String, default: 'GENERAL' },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
