const RiderModel = require('../../models/RiderModel');
const ParcelOrderModel = require('../../models/ParcelOrderModel');
const WalletLedgerModel = require('../../models/WalletLedgerModel');
const dispatchEngine = require('../../services/dispatchEngine');

class DeliveryPartnerController {
  /**
   * 1. PATCH /api/v1/riders/duty
   * Toggle online/offline status and auto-accept settings
   */
  async toggleDuty(req, res) {
    try {
      const { isOnline, autoAccept } = req.body;
      const riderId = req.user?.riderId || req.user?.id || 1;

      const updated = await RiderModel.toggleDuty(riderId, { isOnline, autoAccept });

      return res.status(200).json({
        status: 'success',
        message: `Duty mode updated to ${updated.is_online ? 'ONLINE' : 'OFFLINE'}`,
        data: {
          isOnline: updated.is_online,
          autoAccept: updated.auto_accept
        }
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  /**
   * 2. GET /api/v1/riders/dashboard
   * Fetch shift time, daily earnings, performance stats, battery health, and next pickup task
   */
  async getDashboard(req, res) {
    try {
      const riderId = req.user?.riderId || req.user?.id || 1;
      const dashboard = await RiderModel.getDashboard(riderId);

      return res.status(200).json({
        status: 'success',
        data: dashboard
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  /**
   * 3. GET /api/v1/dispatch/queue
   * Fetch filterable available nearby parcel pool (high_payout, short_distance, all)
   * Also returns active priority offer if any exists
   */
  async getDispatchQueue(req, res) {
    try {
      const filter = req.query.filter || 'all';
      const riderId = req.user?.riderId || req.user?.id || 1;

      const priorityOffer = await dispatchEngine.getActiveOffer(riderId);
      const queue = await ParcelOrderModel.getAvailableQueue({ filter });

      return res.status(200).json({
        status: 'success',
        data: {
          priorityOffer,
          availableCount: queue.length,
          filter,
          queue
        }
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  /**
   * 4. POST /api/v1/dispatch/orders/:id/respond
   * Accept or Decline a priority parcel offer
   */
  async respondToDispatchOffer(req, res) {
    try {
      const { id } = req.params;
      const { decision } = req.body; // 'ACCEPT' or 'DECLINE'
      const riderId = req.user?.riderId || req.user?.id || 1;

      if (!decision || !['ACCEPT', 'DECLINE'].includes(decision.toUpperCase())) {
        return res.status(400).json({ status: 'error', message: 'decision must be either ACCEPT or DECLINE.' });
      }

      const outcome = await dispatchEngine.respondToOffer(id, riderId, decision.toUpperCase());
      return res.status(200).json({
        status: 'success',
        data: outcome
      });
    } catch (err) {
      return res.status(409).json({ status: 'error', message: err.message });
    }
  }

  /**
   * 5. POST /api/v1/orders/:id/verify-otp
   * Verify 4-digit dropoff PIN and settle the ride atomically
   */
  async verifyOrderOtp(req, res) {
    try {
      const { id } = req.params;
      const { otp, latitude, longitude, supervisorBypass } = req.body;
      const riderId = req.user?.riderId || req.user?.id || 1;

      if (!otp) {
        return res.status(400).json({ status: 'error', message: '4-digit recipient verification OTP is required.' });
      }

      const result = await ParcelOrderModel.verifyOtpAndDeliver(id, otp, {
        riderId,
        riderLat: latitude,
        riderLng: longitude,
        supervisorBypass: Boolean(supervisorBypass)
      });

      return res.status(200).json({
        status: 'success',
        message: 'Parcel handoff verified and delivered successfully.',
        data: result
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  /**
   * 6. GET /api/v1/riders/earnings
   * Summary of available balance, weekly trends bar data, breakdown split, and ledger
   */
  async getEarnings(req, res) {
    try {
      const riderId = req.user?.riderId || req.user?.id || 1;
      const earnings = await WalletLedgerModel.getEarningsSummary(riderId);

      return res.status(200).json({
        status: 'success',
        data: earnings
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  /**
   * 7. POST /api/v1/riders/payout
   * Trigger instant cash-out via Stripe Connect / Payouts gateway with idempotency
   */
  async requestPayout(req, res) {
    try {
      const { amount, destination } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
      const riderId = req.user?.riderId || req.user?.id || 1;

      if (!idempotencyKey) {
        return res.status(400).json({
          status: 'error',
          message: 'Idempotency-Key header is required for processing instant payout.'
        });
      }

      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({
          status: 'error',
          message: 'A valid withdrawal amount is required.'
        });
      }

      const payout = await WalletLedgerModel.requestPayout(riderId, amount, {
        idempotencyKey,
        destination: destination || 'HDFC Bank ****8831'
      });

      return res.status(200).json({
        status: 'success',
        message: `Payout of $${parseFloat(amount).toFixed(2)} processed successfully.`,
        data: payout
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  /**
   * GET /api/v1/orders/active
   * Returns current active in-transit order (#TRZ-4820)
   */
  async getActiveOrder(req, res) {
    try {
      const riderId = req.user?.riderId || req.user?.id || 1;
      const activeOrder = await ParcelOrderModel.getActiveInTransit(riderId);
      return res.status(200).json({
        status: 'success',
        data: activeOrder
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new DeliveryPartnerController();
