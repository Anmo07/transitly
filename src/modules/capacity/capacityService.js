const CapacitySlot = require('../../models/CapacitySlot');
const { createEventEnvelope } = require('../../events/eventEnvelope');
const { EventContracts } = require('../../events/contracts');

/**
 * Capacity Domain Service
 * Manages bus route capacity reservation, release, and queries with Optimistic Concurrency Control (OCC).
 */
class CapacityService {
  /**
   * Optimistically reserves cargo capacity for a given slot.
   * @param {string} slotId 
   * @param {number} weightKg 
   * @param {number} expectedVersion 
   * @returns {Promise<Object>} Updated slot
   */
  async reserveCapacity(slotId, weightKg, expectedVersion) {
    const slot = await CapacitySlot.findOneAndUpdate(
      {
        _id: slotId,
        availableWeightKg: { $gte: weightKg },
        version: expectedVersion,
        status: 'AVAILABLE'
      },
      {
        $inc: {
          availableWeightKg: -weightKg,
          reservedWeightKg: weightKg,
          version: 1
        }
      },
      { new: true }
    );

    if (!slot) {
      throw new Error(`Capacity reservation failed: Insufficient capacity or concurrent modification conflict (Slot: ${slotId}).`);
    }

    const event = createEventEnvelope(EventContracts.CAPACITY_RESERVED, {
      slotId: slot._id,
      reservedWeightKg: weightKg,
      remainingWeightKg: slot.availableWeightKg,
      newVersion: slot.version
    }, { operatorId: slot.operatorId });

    return { slot, event };
  }

  /**
   * Compensating Action: Releases previously reserved capacity.
   * @param {string} slotId 
   * @param {number} weightKg 
   * @returns {Promise<Object>}
   */
  async releaseCapacity(slotId, weightKg) {
    const slot = await CapacitySlot.findByIdAndUpdate(
      slotId,
      {
        $inc: {
          availableWeightKg: weightKg,
          reservedWeightKg: -weightKg,
          version: 1
        }
      },
      { new: true }
    );

    if (!slot) {
      throw new Error(`Failed to release capacity for slot ${slotId}: Slot not found.`);
    }

    const event = createEventEnvelope(EventContracts.CAPACITY_RELEASED, {
      slotId: slot._id,
      releasedWeightKg: weightKg,
      remainingWeightKg: slot.availableWeightKg,
      newVersion: slot.version
    }, { operatorId: slot.operatorId });

    return { slot, event };
  }
}

module.exports = new CapacityService();
