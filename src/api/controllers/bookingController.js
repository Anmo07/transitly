const bookingSaga = require('../../sagas/bookingSaga');
const { bookingService } = require('../../modules/bookings/bookingService');
const Shipment = require('../../models/Shipment');
const ShipmentLeg = require('../../models/ShipmentLeg');

/**
 * Booking & Shipment REST Controller
 */
class BookingController {
  /**
   * Distributed Saga Booking Creation
   */
  async createBooking(req, res) {
    try {
      const result = await bookingSaga.execute(req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Shipment booking completed successfully via distributed saga.',
        data: result
      });
    } catch (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message,
        details: err.sagaContext || null
      });
    }
  }

  /**
   * Get Shipment Details by Tracking ID
   */
  async getShipment(req, res) {
    try {
      const { trackingId } = req.params;
      const shipment = await Shipment.findOne({ trackingId }).lean();
      if (!shipment) {
        return res.status(404).json({ status: 'error', message: `Shipment '${trackingId}' not found.` });
      }

      const legs = await ShipmentLeg.find({ shipmentId: shipment._id }).lean();
      return res.status(200).json({
        status: 'success',
        data: {
          ...shipment,
          legs
        }
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  /**
   * List Recent Shipments
   */
  async listShipments(req, res) {
    try {
      const limit = parseInt(req.query.limit || '20', 10);
      const { status, search } = req.query;
      
      let filter = {};
      if (status && status !== 'ALL') {
        filter.status = status;
      }
      if (search) {
        filter.$or = [
          { trackingId: { $regex: search, $options: 'i' } },
          { 'sender.name': { $regex: search, $options: 'i' } },
          { 'recipient.name': { $regex: search, $options: 'i' } }
        ];
      }

      const shipments = await Shipment.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
      return res.status(200).json({
        status: 'success',
        count: shipments.length,
        data: shipments
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  /**
   * Transition Status with OCC
   */
  async transitionStatus(req, res) {
    try {
      const { id } = req.params;
      const { newStatus, expectedVersion, updates, actor } = req.body;
      const updated = await bookingService.transitionStatus(id, newStatus, expectedVersion, updates, actor);
      return res.status(200).json({
        status: 'success',
        data: updated
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  /**
   * Close Transaction and Generate Tamper-evident Snapshot
   */
  async closeShipment(req, res) {
    try {
      const { id } = req.params;
      const { operatorId } = req.body;
      const snapshot = await bookingService.closeTransaction(id, operatorId);
      return res.status(200).json({
        status: 'success',
        message: 'Transaction closed and immutable snapshot recorded.',
        data: snapshot
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new BookingController();
