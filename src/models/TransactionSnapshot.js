const mongoose = require('mongoose');

/**
 * Immutable Transaction Snapshot
 * Captured upon transition to CLOSED state. No modifications allowed.
 */
const transactionSnapshotSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true,
    unique: true,
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
  finalVersion: {
    type: Number,
    required: true
  },
  finalStatus: {
    type: String,
    enum: ['CLOSED', 'CANCELLED'],
    required: true
  },
  snapshotData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  proofOfDelivery: {
    type: mongoose.Schema.Types.Mixed
  },
  totalHandoffCount: {
    type: Number,
    default: 0
  },
  snapshotHash: {
    type: String,
    required: true
  },
  closedAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Strictly append-only
});

module.exports = mongoose.model('TransactionSnapshot', transactionSnapshotSchema);
