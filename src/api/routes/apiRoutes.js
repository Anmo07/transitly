const express = require('express');
const bookingController = require('../controllers/bookingController');
const lastMileController = require('../controllers/lastMileController');
const custodyController = require('../controllers/custodyController');
const capacityController = require('../controllers/capacityController');
const whatsappController = require('../controllers/whatsappController');
const telemetryController = require('../../modules/tracking/telemetryController');
const { pool } = require('../../config/postgres');

const router = express.Router();

// 1. Bookings & Sagas
router.post('/bookings', (req, res) => bookingController.createBooking(req, res));
router.get('/shipments', (req, res) => bookingController.listShipments(req, res));
router.get('/shipments/:trackingId', (req, res) => bookingController.getShipment(req, res));
router.post('/shipments/:id/transition', (req, res) => bookingController.transitionStatus(req, res));
router.post('/shipments/:id/close', (req, res) => bookingController.closeShipment(req, res));

// 2. Capacity
router.get('/capacity/slots', (req, res) => capacityController.listSlots(req, res));
router.post('/capacity/reserve', (req, res) => capacityController.reserveCapacity(req, res));

// 3. Last-Mile Feasibility & Multi-Modal
router.post('/lastmile/feasibility', (req, res) => lastMileController.checkFeasibility(req, res));
router.post('/lastmile/quotes', (req, res) => lastMileController.getQuotes(req, res));

// 4. Custody & Delivery Proof
router.post('/custody/handoff', (req, res) => custodyController.logHandoff(req, res));
router.post('/custody/verify-otp', (req, res) => custodyController.verifyDeliveryOtp(req, res));

// 5. Telemetry & Tracking
router.post('/tracking/telemetry', (req, res) => telemetryController.postTelemetryPing(req, res));
router.get('/tracking/nearby', (req, res) => telemetryController.getNearbyVehicles(req, res));
router.get('/tracking/vehicles/:vehicleId/position', (req, res) => telemetryController.getVehiclePosition(req, res));
router.get('/tracking/health', (req, res) => telemetryController.getHealth(req, res));

// 6. WhatsApp Assistant & Meta Webhooks
router.get('/whatsapp/webhook', (req, res) => whatsappController.verifyWebhook(req, res));
router.post('/whatsapp/webhook', (req, res) => whatsappController.handleInbound(req, res));
router.post('/whatsapp/send', (req, res) => whatsappController.sendNotification(req, res));

// 7. Official Haryana Roadways Routes & Spatial Stops
router.get('/routes/haryana-roadways', async (req, res) => {
  try {
    const routesQuery = `
      SELECT r.id, r.logical_route_id, r.origin_terminal, r.destination_terminal,
             json_agg(
               json_build_object(
                 'id', s.id,
                 'name', s.stop_name,
                 'latitude', s.latitude,
                 'longitude', s.longitude,
                 'sequence', s.sequence_order,
                 'offsetMinutes', s.estimated_stop_offset_minutes
               ) ORDER BY s.sequence_order
             ) as stops
      FROM route_transactions r
      JOIN route_stops s ON r.id = s.route_transaction_id
      WHERE r.operator_id = 10 AND r.is_latest = TRUE
      GROUP BY r.id, r.logical_route_id, r.origin_terminal, r.destination_terminal
      ORDER BY r.logical_route_id ASC;
    `;
    const result = await pool.query(routesQuery);
    return res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
