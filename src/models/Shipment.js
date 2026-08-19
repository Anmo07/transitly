const mongoose = require('mongoose');
const { TransactionStates } = require('../modules/bookings/stateMachine');

/**
 * Master Shipment Transaction Aggregate Root
 * Designed as a lean summary aggregate. High-frequency tracking pings,
 * custody handoffs, and ledger journal entries live in separate append-only collections.
 */
const shipmentSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true
  },
  version: {
    type: Number,
    default: 1,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(TransactionStates),
    default: TransactionStates.OPEN,
    index: true,
    required: true
  },
  sender: {
    name: { type: String, required: true },
    email: String,
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  recipient: {
    name: { type: String, required: true },
    email: String,
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  weight: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },

  // Capacity Slot reservation reference
  capacitySlotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CapacitySlot',
    index: true
  },
  assignedVehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  assignedRouteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RouteTransaction'
  },

  // Security & Custody Overview (Summary Only)
  qrSeal: {
    currentSealCode: { type: String, index: true },
    initialSealCode: String,
    isTampered: { type: Boolean, default: false }
  },
  deliveryOtp: {
    codeHash: String,
    salt: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    verifiedAt: Date
  },
  currentCustodian: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    name: String,
    assignedAt: Date
  },

  // Geofence constraints
  pickupGeofence: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, default: 100 },
    address: String
  },
  deliveryGeofence: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, default: 100 },
    address: String
  },

  // Closure, Ledger & Audit Trail
  closedAt: Date,
  isSnapshotCreated: { type: Boolean, default: false },
  
  // Linked Adjustments & Disputes (For post-closure adjustments)
  parentTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'
  },
  linkedAdjustmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'
  },
  isAdjustment: {
    type: Boolean,
    default: false
  },
  disputeReason: String,
  cancellationReason: String
}, {
  timestamps: true
});

// Compound index for Optimistic Concurrency Control queries
shipmentSchema.index({ _id: 1, status: 1, version: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
