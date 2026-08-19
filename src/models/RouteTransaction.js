const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  stopName: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  sequenceOrder: { type: Number, required: true }
});

const routeTransactionSchema = new mongoose.Schema({
  // Logical ID that groups all versions of the same route together
  logicalRouteId: { type: String, required: true, index: true }, 
  version: { type: Number, required: true, default: 1 },
  
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  
  // Embedding stops for this specific route version
  stops: [stopSchema],
  
  // OCP implementation fields
  effectiveFrom: { type: Date, required: true, default: Date.now },
  effectiveTo: { type: Date, default: null }, // Null means currently active
  isLatest: { type: Boolean, default: true },
  status: { type: String, enum: ['ACTIVE', 'SUPERSEDED', 'CANCELLED'], default: 'ACTIVE' }
}, { timestamps: true });

// Compound index to quickly find the currently active version of a route
routeTransactionSchema.index({ logicalRouteId: 1, isLatest: 1 });

module.exports = mongoose.model('RouteTransaction', routeTransactionSchema);
