const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');

router.get('/profile', (req, res) => riderController.getProfile(req, res));
router.post('/status', (req, res) => riderController.setStatus(req, res));
router.post('/location', (req, res) => riderController.updateLocation(req, res));

router.get('/tasks', (req, res) => riderController.getAssignedTasks(req, res));
router.post('/tasks/:id/status', (req, res) => riderController.updateTaskStatus(req, res));

module.exports = router;
