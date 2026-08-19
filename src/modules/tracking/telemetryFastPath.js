const { redisClient } = require('../../config/redis');

const GEO_KEY = process.env.REDIS_TELEMETRY_GEO_KEY || 'tracking:positions';
const STREAM_KEY = process.env.REDIS_TELEMETRY_STREAM || 'stream:telemetry:gps';

/**
 * Fast Path Telemetry Ingestion Service
 * Handles high-throughput sub-millisecond in-memory spatial indexing,
 * live WebSocket fan-out, and stream buffering.
 */
class TelemetryFastPath {
  constructor(redis = redisClient) {
    this.redis = redis;
  }

  /**
   * Validates and ingests a driver/vehicle GPS ping.
   * Performs GEOADD, PUBLISH, and XADD in parallel/pipeline for maximum throughput.
   * @param {Object} ping
   * @returns {Promise<Object>} Ingestion outcome & metrics
   */
  async ingestTelemetryPing(ping) {
    const startTime = Date.now();

    // 1. Validation
    if (!ping.vehicleId || typeof ping.vehicleId !== 'string') {
      throw new Error('Invalid payload: vehicleId is required.');
    }
    if (
      typeof ping.latitude !== 'number' ||
      ping.latitude < -90 ||
      ping.latitude > 90 ||
      typeof ping.longitude !== 'number' ||
      ping.longitude < -180 ||
      ping.longitude > 180
    ) {
      throw new Error('Invalid payload: latitude (-90..90) and longitude (-180..180) are required numbers.');
    }

    const sanitizedPing = {
      vehicleId: ping.vehicleId,
      operatorId: ping.operatorId || 'default-operator',
      latitude: ping.latitude,
      longitude: ping.longitude,
      speedKmh: typeof ping.speedKmh === 'number' ? ping.speedKmh : 0,
      heading: typeof ping.heading === 'number' ? ping.heading : 0,
      altitude: typeof ping.altitude === 'number' ? ping.altitude : null,
      accuracyMeters: typeof ping.accuracyMeters === 'number' ? ping.accuracyMeters : null,
      timestamp: ping.timestamp ? new Date(ping.timestamp).toISOString() : new Date().toISOString()
    };

    const payloadString = JSON.stringify(sanitizedPing);
    const pubSubChannel = `tracking:live:${sanitizedPing.vehicleId}`;

    // 2. Atomic Pipeline: GEOADD + PUBLISH + XADD
    const pipeline = this.redis.pipeline();

    // Fast Path 1: Update real-time geospatial index (Note: Redis GEOADD takes longitude first, then latitude)
    pipeline.geoadd(GEO_KEY, sanitizedPing.longitude, sanitizedPing.latitude, sanitizedPing.vehicleId);

    // Fast Path 2: Publish to live UI subscriber channel
    pipeline.publish(pubSubChannel, payloadString);

    // Buffer: Append to Redis Stream for slow-path batch consumer
    pipeline.xadd(STREAM_KEY, '*', 'payload', payloadString);

    const results = await pipeline.exec();

    // Check for pipeline execution errors
    for (const [err] of results) {
      if (err) {
        throw new Error(`Redis Fast Path Ingestion Error: ${err.message}`);
      }
    }

    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      vehicleId: sanitizedPing.vehicleId,
      streamMessageId: results[2][1],
      latencyMs
    };
  }

  /**
   * Fast proximity query using Redis GEOSEARCH.
   * Returns vehicles within a radius (in meters) with distance and coordinates.
   * @param {{latitude: number, longitude: number, radiusMeters?: number, count?: number}} params
   * @returns {Promise<Array<Object>>}
   */
  async searchNearbyVehicles({ latitude, longitude, radiusMeters = 5000, count = 20 }) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Latitude and Longitude numbers are required.');
    }

    // GEOSEARCH tracking:positions FROMLONLAT <lon> <lat> BYRADIUS <radius> m WITHDIST WITHCOORD COUNT <count> ASC
    const results = await this.redis.geosearch(
      GEO_KEY,
      'FROMLONLAT',
      longitude,
      latitude,
      'BYRADIUS',
      radiusMeters,
      'm',
      'WITHDIST',
      'WITHCOORD',
      'COUNT',
      count,
      'ASC'
    );

    // Parse Redis GEOSEARCH nested array output: [[vehicleId, distance, [lon, lat]], ...]
    return results.map(([vehicleId, distanceMeters, [lon, lat]]) => ({
      vehicleId,
      distanceMeters: parseFloat(distanceMeters),
      latitude: parseFloat(lat),
      longitude: parseFloat(lon)
    }));
  }

  /**
   * Retrieves current real-time coordinates for a specific vehicle.
   * @param {string} vehicleId
   * @returns {Promise<{latitude: number, longitude: number} | null>}
   */
  async getVehiclePosition(vehicleId) {
    const pos = await this.redis.geopos(GEO_KEY, vehicleId);
    if (!pos || !pos[0]) {
      return null;
    }
    const [lon, lat] = pos[0];
    return {
      vehicleId,
      longitude: parseFloat(lon),
      latitude: parseFloat(lat)
    };
  }
}

module.exports = {
  TelemetryFastPath,
  telemetryFastPath: new TelemetryFastPath()
};
