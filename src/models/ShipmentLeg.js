const mongoose = require('mongoose');

/**
 * Child Shipment Leg Schema
 * Supports hierarchical parent-child structure for multi-modal routing:
 * Parent Shipment -> [Pickup Leg, Intercity Transit Leg, Delivery Leg]
 * Isolates leg failure without compromising the parent transaction.
 */
const shipmentLegSchema = new mongoose.Schema({
  parentShipmentId: {
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
  legType: {
    type: String,
    enum: ['PICKUP_LAST_MILE', 'TRANSIT', 'DELIVERY_LAST_MILE'],
    required: true
  },
  provider: {
    type: String,
    enum: [
      'UBER_DIRECT',
      'RAPIDO',
      'INDRIVE',
      'PUBLIC_TRANSIT',
      'REGIONAL_COURIER',
      'SELF_COLLECTION',
      'UNAVAILABLE'
    ],
    required: true
  },
  providerDispatchId: {
    type: String,
    index: true
  },
  status: {
    type: String,
    enum: [
      'PENDING',
      'QUOTED',
      'DISPATCHED',
      'COLLECTED',
      'IN_TRANSIT',
      'COMPLETED',
      'EXCEPTION',
      'CANCELLED'
    ],
    default: 'PENDING',
    index: true
  },
  pickupLocation: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  dropoffLocation: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  price: {
    type: Number,
    default: 0
  },
  estimatedDurationMinutes: Number,
  estimatedArrival: Date,
  isServiceable: {
    type: Boolean,
    default: true
  },
  quoteExpiresAt: Date,
  failureReason: String,
  proofOfDelivery: {
    signatureUrl: String,
    photoUrl: String,
    timestamp: Date,
    location: { latitude: Number, longitude: Number }
  }
}, {
  timestamps: true
});

shipmentLegSchema.index({ parentShipmentId: 1, legType: 1 });

module.exports = mongoose.model('ShipmentLeg', shipmentLegSchema);
