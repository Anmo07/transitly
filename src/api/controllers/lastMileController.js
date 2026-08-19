const { lastMileOrchestrator } = require('../../modules/lastMile/lastMileOrchestrator');

/**
 * Last-Mile Feasibility & Multi-Modal REST Controller
 */
class LastMileController {
  /**
   * Dual Geolocation Feasibility Check
   */
  async checkFeasibility(req, res) {
    try {
      const { senderAddress, receiverAddress, originTerminal, destinationTerminal, parcel } = req.body;
      const evaluation = await lastMileOrchestrator.evaluateDoorToDoorFeasibility({
        senderAddress,
        receiverAddress,
        originTerminal,
        destinationTerminal,
        parcel
      });

      return res.status(200).json({
        status: 'success',
        data: evaluation
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
      const { senderAddress, receiverAddress, originTerminal, destinationTerminal, parcel } = req.body;
      const quotes = await lastMileOrchestrator.generateQuotes({
        senderAddress,
        receiverAddress,
        originTerminal,
        destinationTerminal,
        parcel
      });

      return res.status(200).json({
        status: 'success',
        data: quotes
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new LastMileController();
