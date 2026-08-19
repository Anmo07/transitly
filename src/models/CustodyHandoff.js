const mongoose = require('mongoose');

/**
 * Immutable Chain-of-Custody Transaction Log
 * Records every physical custody transfer of a shipment.
 */
const custodyHandoffSchema = new mongoose.Schema({
  shipmentId: {
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
  fromCustodian: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, required: true },
    name: String
  },
  toCustodian: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, required: true },
    name: String
  },
  qrSealCode: {
    type: String,
    required: true
  },
  sealStatus: {
    type: String,
    enum: ['INTACT', 'DAMAGED', 'TAMPERED', 'REPLACED'],
    default: 'INTACT'
  },
  handoffType: {
    type: String,
    enum: [
      'PICKUP_FROM_SENDER',
      'LOAD_TO_VEHICLE',
      'UNLOAD_AT_HUB',
      'TRANSFER_TO_PARTNER',
      'OUT_FOR_DELIVERY',
      'FINAL_DELIVERY'
    ],
    required: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracyMeters: Number
  },
  geofenceValidation: {
    isWithinGeofence: { type: Boolean, required: true },
    targetLocationType: { type: String, enum: ['PICKUP', 'ROUTE_STOP', 'HUB', 'DELIVERY_DESTINATION'] },
    distanceMeters: Number
  },
  signatureUrl: String,
  photoEvidenceUrl: String,
  notes: String,
  handoffTimestamp: {
    type: Date,
    default: Date.now,
    immutable: true,
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Immutable audit record
});

// Index to quickly query complete audit trail in chronological order
custodyHandoffSchema.index({ shipmentId: 1, handoffTimestamp: 1 });

module.exports = mongoose.model('CustodyHandoff', custodyHandoffSchema);
