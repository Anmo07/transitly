const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registration: {
    type: String,
    required: true,
    unique: true
  },
  cargoCapacityKg: {
    type: Number,
    required: true
  },
  availableCapacityKg: {
    type: Number,
    required: true
  },
  lastLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
