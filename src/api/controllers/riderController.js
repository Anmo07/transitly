const DeliveryPartner = require('../../models/DeliveryPartner');
const ShipmentLeg = require('../../models/ShipmentLeg');

class RiderController {
  async getProfile(req, res) {
    try {
      // In a real app, riderId would come from req.user.id after auth middleware
      const riderId = req.user ? req.user.id : parseInt(req.headers['x-rider-id'] || '11', 10);
      
      const profile = await DeliveryPartner.getProfile(riderId);
      if (!profile) {
        return res.status(404).json({ status: 'error', message: 'Rider profile not found.' });
      }

      res.status(200).json({ status: 'success', data: profile });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
  }

  async setStatus(req, res) {
    try {
      const riderId = req.user ? req.user.id : parseInt(req.headers['x-rider-id'] || '11', 10);
      const { status } = req.body; // e.g., 'ONLINE', 'OFFLINE'
      
      if (!['ONLINE', 'OFFLINE'].includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Invalid status.' });
      }

      const updated = await DeliveryPartner.setStatus(riderId, status);
      res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
  }

  async updateLocation(req, res) {
    try {
      const riderId = req.user ? req.user.id : parseInt(req.headers['x-rider-id'] || '11', 10);
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ status: 'error', message: 'Coordinates are required.' });
      }

      const updated = await DeliveryPartner.updateLocation(riderId, latitude, longitude);
      res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
  }

  async getAssignedTasks(req, res) {
    try {
      const riderId = req.user ? req.user.id : parseInt(req.headers['x-rider-id'] || '11', 10);
      const tasks = await ShipmentLeg.findAssignedLegs(riderId);
      
      res.status(200).json({ status: 'success', data: tasks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
  }

  async updateTaskStatus(req, res) {
    try {
      const legId = parseInt(req.params.id, 10);
      const { status } = req.body;
      
      // Typical flow: PENDING -> DISPATCHED -> COLLECTED -> IN_TRANSIT -> COMPLETED
      const validStatuses = ['DISPATCHED', 'COLLECTED', 'IN_TRANSIT', 'COMPLETED', 'EXCEPTION'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Invalid task status.' });
      }

      const updatedLeg = await ShipmentLeg.updateStatus(legId, status);
      if (!updatedLeg) {
        return res.status(404).json({ status: 'error', message: 'Task not found.' });
      }
      
      res.status(200).json({ status: 'success', data: updatedLeg });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
  }
}

module.exports = new RiderController();
