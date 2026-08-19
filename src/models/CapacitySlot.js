const mongoose = require('mongoose');

/**
 * Capacity Slot with Optimistic Concurrency Control
 */
const capacitySlotSchema = new mongoose.Schema({
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RouteTransaction',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  totalCapacityKg: {
    type: Number,
    required: true
  },
  availableWeightKg: {
    type: Number,
    required: true
  },
  reservedWeightKg: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 1,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'FULL', 'DEPARTED', 'CANCELLED'],
    default: 'AVAILABLE'
  }
}, { timestamps: true });

capacitySlotSchema.index({ vehicleId: 1, date: 1, version: 1 });

module.exports = mongoose.model('CapacitySlot', capacitySlotSchema);
