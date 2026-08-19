const { capacityService } = require('../../modules/capacity/capacityService');
const CapacitySlot = require('../../models/CapacitySlot');

/**
 * Capacity Management REST Controller
 */
class CapacityController {
  /**
   * List or Search Route Capacity Slots
   */
  async listSlots(req, res) {
    try {
      const { routeId, date } = req.query;
      const filter = {};
      if (routeId) filter.routeTransactionId = routeId;
      if (date) filter.slotDate = new Date(date);

      const slots = await CapacitySlot.find(filter).lean();
      return res.status(200).json({
        status: 'success',
        count: slots.length,
        data: slots
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  /**
   * Reserve Capacity Slot using OCC
   */
  async reserveCapacity(req, res) {
    try {
      const { slotId, weightKg, expectedVersion } = req.body;
      const reservation = await capacityService.reserveCapacity(slotId, parseFloat(weightKg), expectedVersion);
      return res.status(200).json({
        status: 'success',
        message: 'Capacity slot reserved successfully.',
        data: reservation
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new CapacityController();
