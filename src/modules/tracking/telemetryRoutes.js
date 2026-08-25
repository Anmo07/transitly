const express = require('express');
const telemetryController = require('./telemetryController');

const router = express.Router();

// High-frequency telemetry ping ingestion (Fast Path)
router.post('/telemetry', (req, res) => telemetryController.postTelemetryPing(req, res));

// Real-time spatial proximity search (GEOSEARCH)
router.get('/nearby', (req, res) => telemetryController.getNearbyVehicles(req, res));

// Single vehicle current location (GEOPOS)
router.get('/vehicles/:vehicleId/position', (req, res) => telemetryController.getVehiclePosition(req, res));

// Health status
router.get('/health', (req, res) => telemetryController.getHealth(req, res));

module.exports = router;
