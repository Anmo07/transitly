const mongoose = require('mongoose');

const proofOfDeliverySchema = new mongoose.Schema({
  shipmentId: {
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
  recipientName: {
    type: String,
    required: true
  },
  recipientPhone: {
    type: String,
    required: true
  },
  otpVerified: {
    type: Boolean,
    required: true
  },
  qrSealVerified: {
    type: Boolean,
    required: true
  },
  qrSealCode: {
    type: String,
    required: true
  },
  signatureUrl: String,
  photoUrl: String,
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  geofenceValidated: {
    type: Boolean,
    default: true
  },
  distanceFromDeliveryPointMeters: Number,
  deliveredBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    role: String
  },
  deliveredAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ProofOfDelivery', proofOfDeliverySchema);
