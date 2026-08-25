const crypto = require('crypto');

/**
 * Creates a standardized, versioned event envelope.
 * @param {string} eventType - The versioned event name (e.g. 'shipment.booked.v1')
 * @param {Object} payload - Domain event data
 * @param {Object} [meta] - Metadata (operatorId, correlationId, causationId, userId)
 * @returns {Object} Standardized event envelope
 */
const createEventEnvelope = (eventType, payload, meta = {}) => {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    version: meta.version || 1,
    timestamp: new Date().toISOString(),
    operatorId: meta.operatorId || null,
    correlationId: meta.correlationId || crypto.randomUUID(),
    causationId: meta.causationId || null,
    userId: meta.userId || null,
    payload
  };
};

module.exports = {
  createEventEnvelope
};
