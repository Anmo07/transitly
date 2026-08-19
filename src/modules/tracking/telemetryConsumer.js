const { createDuplicateRedisClient } = require('../../config/redis');
const { pool } = require('../../config/postgres');

const STREAM_KEY = process.env.REDIS_TELEMETRY_STREAM || 'stream:telemetry:gps';
const CONSUMER_GROUP = process.env.REDIS_TELEMETRY_CONSUMER_GROUP || 'cg:telemetry:durable';
const BATCH_SIZE = parseInt(process.env.REDIS_TELEMETRY_BATCH_SIZE || '200', 10);
const BLOCK_TIMEOUT_MS = 2000;

/**
 * Slow Path Telemetry Stream Consumer Worker
 * Consumes buffered GPS pings from Redis Stream in batches, performs bulk multi-row inserts
 * into PostGIS, and acknowledges (XACK) upon successful transaction commit.
 */
class TelemetryConsumerWorker {
  constructor(options = {}) {
    this.redis = options.redisClient || createDuplicateRedisClient();
    this.dbPool = options.dbPool || pool;
    this.consumerId = options.consumerId || `worker-${process.pid}-${Date.now().toString(36)}`;
    this.isRunning = false;
    this.pollingTimer = null;
  }

  /**
   * Initializes the Redis Stream consumer group if it does not already exist.
   */
  async initConsumerGroup() {
    try {
      await this.redis.xgroup('CREATE', STREAM_KEY, CONSUMER_GROUP, '0', 'MKSTREAM');
      console.log(`[Telemetry Consumer] Initialized consumer group '${CONSUMER_GROUP}' on stream '${STREAM_KEY}'`);
    } catch (err) {
      if (err.message.includes('BUSYGROUP')) {
        // Group already exists, normal behavior
      } else {
        console.error('[Telemetry Consumer Error] Failed to create consumer group:', err.message);
        throw err;
      }
    }
  }

  /**
   * Builds a parameterized bulk multi-row SQL INSERT query with PostGIS geometry creation.
   * @param {Array<Object>} records 
   * @returns {{text: string, values: Array<any>}}
   */
  buildBulkInsertQuery(records) {
    const valuePlaceholders = [];
    const values = [];
    let paramIndex = 1;

    for (const record of records) {
      // 9 fields per record
      const p1 = `$${paramIndex++}`; // vehicle_id
      const p2 = `$${paramIndex++}`; // operator_id
      const p3 = `$${paramIndex++}`; // latitude
      const p4 = `$${paramIndex++}`; // longitude
      const p5 = `$${paramIndex++}`; // speed_kmh
      const p6 = `$${paramIndex++}`; // heading
      const p7 = `$${paramIndex++}`; // altitude
      const p8 = `$${paramIndex++}`; // accuracy_meters
      const p9 = `$${paramIndex++}`; // ping_timestamp

      // Geom: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) -> Notice PostGIS takes (lon, lat)
      valuePlaceholders.push(
        `(${p1}, ${p2}, ${p3}, ${p4}, ST_SetSRID(ST_MakePoint(${p4}, ${p3}), 4326), ${p5}, ${p6}, ${p7}, ${p8}, ${p9})`
      );

      values.push(
        record.vehicleId,
        record.operatorId || 'default-operator',
        record.latitude,
        record.longitude,
        record.speedKmh || 0,
        record.heading || 0,
        record.altitude || null,
        record.accuracyMeters || null,
        new Date(record.timestamp)
      );
    }

    const queryText = `
      INSERT INTO vehicle_telemetry (
        vehicle_id, operator_id, latitude, longitude, geom,
        speed_kmh, heading, altitude, accuracy_meters, ping_timestamp
      )
      VALUES ${valuePlaceholders.join(',\n')}
    `;

    return { text: queryText, values };
  }

  /**
   * Polls Redis Stream, executes batch insert into PostGIS, and executes XACK on commit.
   * @returns {Promise<number>} Number of processed records
   */
  async processBatch() {
    try {
      // XREADGROUP GROUP <group> <consumer> BLOCK <timeout> COUNT <count> STREAMS <stream> >
      const response = await this.redis.xreadgroup(
        'GROUP',
        CONSUMER_GROUP,
        this.consumerId,
        'BLOCK',
        BLOCK_TIMEOUT_MS,
        'COUNT',
        BATCH_SIZE,
        'STREAMS',
        STREAM_KEY,
        '>'
      );

      if (!response || !response.length) {
        return 0;
      }

      const streamEntries = response[0][1]; // Array of [messageId, [ 'payload', jsonString ]]
      if (!streamEntries || !streamEntries.length) {
        return 0;
      }

      const messageIds = [];
      const recordsToInsert = [];

      for (const [messageId, fields] of streamEntries) {
        messageIds.push(messageId);
        try {
          // Parse field key-value pairs
          let payloadStr = null;
          for (let i = 0; i < fields.length; i += 2) {
            if (fields[i] === 'payload') {
              payloadStr = fields[i + 1];
              break;
            }
          }
          if (payloadStr) {
            const parsed = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
            recordsToInsert.push(parsed);
          }
        } catch (parseErr) {
          console.error(`[Telemetry Consumer] Corrupt payload in stream msg ${messageId}:`, parseErr.message);
        }
      }

      if (!recordsToInsert.length) {
        // Acknowledge corrupt messages so they don't block the stream
        await this.redis.xack(STREAM_KEY, CONSUMER_GROUP, ...messageIds);
        return 0;
      }

      // 1. Bulk Insert into PostGIS
      const { text, values } = this.buildBulkInsertQuery(recordsToInsert);
      await this.dbPool.query(text, values);

      // 2. Guaranteed Acknowledgment (XACK) only AFTER successful DB commit
      await this.redis.xack(STREAM_KEY, CONSUMER_GROUP, ...messageIds);

      console.log(`[Telemetry Consumer] Persisted batch of ${recordsToInsert.length} GPS pings into PostGIS (ACKed ${messageIds.length} msgs)`);
      return recordsToInsert.length;

    } catch (err) {
      // On database or network error: DO NOT XACK. Messages remain in PEL for retry.
      console.error('[Telemetry Consumer Error] Batch processing failed (Messages NOT acked, will retry):', err.message);
      // Brief pause before retry
      await new Promise((r) => setTimeout(r, 1000));
      return 0;
    }
  }

  /**
   * Starts the continuous background processing loop.
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    await this.initConsumerGroup();

    console.log(`[Telemetry Consumer Worker] Started consumer '${this.consumerId}'`);

    const loop = async () => {
      if (!this.isRunning) return;
      await this.processBatch();
      setImmediate(loop);
    };

    loop();
  }

  /**
   * Stops the background worker cleanly.
   */
  async stop() {
    this.isRunning = false;
    console.log(`[Telemetry Consumer Worker] Stopped consumer '${this.consumerId}'`);
  }
}

module.exports = {
  TelemetryConsumerWorker
};
