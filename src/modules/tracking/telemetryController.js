const { telemetryFastPath } = require('./telemetryFastPath');
const { checkPostgresHealth } = require('../../config/postgres');

/**
 * Telemetry REST API Controller
 */
class TelemetryController {
  /**
   * High-frequency GPS ping ingestion endpoint (Fast Path).
   */
  async postTelemetryPing(req, res) {
    try {
      const { vehicleId, operatorId, latitude, longitude, speedKmh, heading, altitude, accuracyMeters, timestamp } = req.body;
      const result = await telemetryFastPath.ingestTelemetryPing({
        vehicleId,
        operatorId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speedKmh: speedKmh ? parseFloat(speedKmh) : 0,
        heading: heading ? parseFloat(heading) : 0,
        altitude: altitude ? parseFloat(altitude) : null,
        accuracyMeters: accuracyMeters ? parseFloat(accuracyMeters) : null,
        timestamp
      });

      return res.status(202).json({
        status: 'accepted',
        data: result
      });
    } catch (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * Real-time spatial proximity search endpoint using Redis GEOSEARCH.
   */
  async getNearbyVehicles(req, res) {
    try {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      const radiusMeters = req.query.radius ? parseFloat(req.query.radius) : 5000;
      const count = req.query.count ? parseInt(req.query.count, 10) : 20;

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          status: 'error',
          message: 'Query parameters "lat" and "lon" are required numbers.'
        });
      }

      const vehicles = await telemetryFastPath.searchNearbyVehicles({
        latitude: lat,
        longitude: lon,
        radiusMeters,
        count
      });

      return res.status(200).json({
        status: 'success',
        count: vehicles.length,
        radiusMeters,
        data: vehicles
      });
    } catch (err) {
      return res.status(500).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * Returns current real-time position for a single vehicle.
   */
  async getVehiclePosition(req, res) {
    try {
      const { vehicleId } = req.params;
      const position = await telemetryFastPath.getVehiclePosition(vehicleId);

      if (!position) {
        return res.status(404).json({
          status: 'error',
          message: `No active location found for vehicle '${vehicleId}'.`
        });
      }

      return res.status(200).json({
        status: 'success',
        data: position
      });
    } catch (err) {
      return res.status(500).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * Telemetry system health check (Redis + PostGIS).
   */
  async getHealth(req, res) {
    const postgresStatus = await checkPostgresHealth();
    return res.status(200).json({
      status: 'ok',
      fastPath: 'Redis In-Memory Ready',
      slowPathPostGIS: postgresStatus
    });
  }
}

module.exports = new TelemetryController();
