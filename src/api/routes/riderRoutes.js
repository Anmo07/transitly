const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');
const deliveryPartnerController = require('../controllers/deliveryPartnerController');

// 1. Cockpit & Duty Handlers
router.patch('/duty', (req, res) => deliveryPartnerController.toggleDuty(req, res));
router.get('/dashboard', (req, res) => deliveryPartnerController.getDashboard(req, res));

// 2. Earnings & Instant Payouts
router.get('/earnings', (req, res) => deliveryPartnerController.getEarnings(req, res));
router.post('/payout', (req, res) => deliveryPartnerController.requestPayout(req, res));

// 3. Legacy Rider Workflows (Preserved for Backward Compatibility)
router.get('/profile', (req, res) => riderController.getProfile(req, res));
router.post('/status', (req, res) => riderController.setStatus(req, res));
router.post('/location', (req, res) => riderController.updateLocation(req, res));
router.get('/tasks', (req, res) => riderController.getAssignedTasks(req, res));
router.post('/tasks/:id/status', (req, res) => riderController.updateTaskStatus(req, res));

module.exports = router;
