const mongoose = require('mongoose');

/**
 * Immutable Financial and Operational Ledger Entry
 * Double-entry style / journal entry for operator settlements, platform fees, and partner commissions.
 */
const ledgerEntrySchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true,
    index: true
  },
  trackingId: {
    type: String,
    required: true,
    index: true
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  entryType: {
    type: String,
    enum: [
      'SHIPMENT_REVENUE',
      'OPERATOR_EARNING',
      'PARTNER_COMMISSION',
      'PLATFORM_FEE',
      'REFUND',
      'DISPUTE_ADJUSTMENT'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  debitAccount: {
    type: String,
    required: true
  },
  creditAccount: {
    type: String,
    required: true
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  postedAt: {
    type: Date,
    default: Date.now,
    immutable: true,
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Immutable
});

ledgerEntrySchema.index({ operatorId: 1, postedAt: 1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
