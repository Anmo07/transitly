const { LastMileOrchestrator } = require('../../modules/lastMile/lastMileOrchestrator');

/**
 * Last-Mile Feasibility & Multi-Modal REST Controller
 */
class LastMileController {
  /**
   * Dual Geolocation Feasibility Check
   */
  async checkFeasibility(req, res) {
    try {
      const {
        senderAddress,
        receiverAddress,
        senderLocation,
        receiverLocation,
        originTerminal = { name: 'ISBT Delhi', latitude: 28.6675, longitude: 77.2285 },
        destinationTerminal = { name: 'ISBT Chandigarh', latitude: 30.7410, longitude: 76.7790 },
        parcel = { weightKg: 5 }
      } = req.body;

      const evaluation = await LastMileOrchestrator.evaluateFeasibility({
        senderLocation: senderLocation || senderAddress || { latitude: 28.6315, longitude: 77.2167 },
        receiverLocation: receiverLocation || receiverAddress || { latitude: 30.7410, longitude: 76.7790 },
        originTerminal,
        destinationTerminal,
        parcel
      });

      const customerMessage = evaluation.customerExperience === 'FULL_DOOR_TO_DOOR'
        ? 'Full door-to-door multi-modal delivery available via Uber Direct, Rapid Transit bus, and Rapido last-mile.'
        : evaluation.customerExperience === 'PICKUP_TO_TERMINAL'
        ? 'Pickup is available. Recipient collects from destination terminal.'
        : 'Terminal drop-off / collection active.';

      return res.status(200).json({
        status: 'success',
        data: {
          ...evaluation,
          customerMessage
        }
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  /**
   * Generate Quotes for Feasible Legs
   */
  async getQuotes(req, res) {
    try {
      const {
        senderAddress,
        receiverAddress,
        senderLocation,
        receiverLocation,
        originTerminal = { name: 'ISBT Delhi', latitude: 28.6675, longitude: 77.2285 },
        destinationTerminal = { name: 'ISBT Chandigarh', latitude: 30.7410, longitude: 76.7790 },
        parcel = { weightKg: 5 }
      } = req.body;

      const evaluation = await LastMileOrchestrator.evaluateFeasibility({
        senderLocation: senderLocation || senderAddress || { latitude: 28.6315, longitude: 77.2167 },
        receiverLocation: receiverLocation || receiverAddress || { latitude: 30.7410, longitude: 76.7790 },
        originTerminal,
        destinationTerminal,
        parcel
      });

      return res.status(200).json({
        status: 'success',
        data: {
          quotes: {
            pickupLeg: evaluation.pickupLeg?.quote || null,
            deliveryLeg: evaluation.deliveryLeg?.quote || null,
            totalLastMileFee: (evaluation.pickupLeg?.quote?.fee || 0) + (evaluation.deliveryLeg?.quote?.fee || 0)
          },
          evaluation
        }
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new LastMileController();
