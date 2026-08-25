const assert = require('assert');
const { TelemetryFastPath } = require('../src/modules/tracking/telemetryFastPath');
const { TelemetryConsumerWorker } = require('../src/modules/tracking/telemetryConsumer');

console.log('=== Running Fast Path / Slow Path Telemetry Ingestion Tests ===\n');

// -------------------------------------------------------------
// 1. Test Fast Path Telemetry Ingestion & In-Memory Indexing
// -------------------------------------------------------------
console.log('1. Testing Fast Path Ingestion Pipeline & Validation...');

class MockRedisPipeline {
  constructor() {
    this.commands = [];
  }
  geoadd(...args) {
    this.commands.push({ cmd: 'geoadd', args });
    return this;
  }
  publish(...args) {
    this.commands.push({ cmd: 'publish', args });
    return this;
  }
  xadd(...args) {
    this.commands.push({ cmd: 'xadd', args });
    return this;
  }
  async exec() {
    return [
      [null, 1], // geoadd ok
      [null, 1], // publish ok
      [null, '1710000000000-0'] // xadd stream id
    ];
  }
}

class MockRedisClient {
  constructor() {
    this.pipelineCalls = [];
  }
  pipeline() {
    const p = new MockRedisPipeline();
    this.pipelineCalls.push(p);
    return p;
  }
  async geosearch(key, fromLonLat, lon, lat, byRadius, radius, unit, withDist, withCoord, countKeyword, count, sort) {
    // Return sample Redis geosearch format: [[member, distance, [lon, lat]]]
    return [
      ['BUS-DEL-101', '450.25', ['77.2180', '28.6320']],
      ['BUS-DEL-102', '1250.80', ['77.2250', '28.6400']]
    ];
  }
  async geopos(key, member) {
    return [['77.2180', '28.6320']];
  }
}

const mockRedis = new MockRedisClient();
const fastPath = new TelemetryFastPath(mockRedis);

// Test validation
assert.rejects(async () => {
  await fastPath.ingestTelemetryPing({ vehicleId: '', latitude: 28.5, longitude: 77.2 });
}, /vehicleId is required/);

assert.rejects(async () => {
  await fastPath.ingestTelemetryPing({ vehicleId: 'V1', latitude: 120.0, longitude: 77.2 });
}, /latitude/);

// Test valid fast path ingestion
fastPath.ingestTelemetryPing({
  vehicleId: 'BUS-DEL-101',
  operatorId: 'DTC-01',
  latitude: 28.6320,
  longitude: 77.2180,
  speedKmh: 45.5,
  heading: 180.0
}).then((res) => {
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.vehicleId, 'BUS-DEL-101');
  assert.strictEqual(res.streamMessageId, '1710000000000-0');

  const pipeline = mockRedis.pipelineCalls[0];
  assert.strictEqual(pipeline.commands.length, 3, 'Pipeline must execute GEOADD, PUBLISH, and XADD');

  // Verify GEOADD takes longitude first, then latitude
  const geoCmd = pipeline.commands.find((c) => c.cmd === 'geoadd');
  assert.strictEqual(geoCmd.args[1], 77.2180, 'Longitude must be first coord in GEOADD');
  assert.strictEqual(geoCmd.args[2], 28.6320, 'Latitude must be second coord in GEOADD');
  assert.strictEqual(geoCmd.args[3], 'BUS-DEL-101');

  // Verify Pub/Sub channel
  const pubCmd = pipeline.commands.find((c) => c.cmd === 'publish');
  assert.strictEqual(pubCmd.args[0], 'tracking:live:BUS-DEL-101');

  console.log('✔ Fast Path pipeline (GEOADD + PUBLISH + XADD) verified successfully.');

  // Test Proximity Search (GEOSEARCH)
  return fastPath.searchNearbyVehicles({ latitude: 28.6315, longitude: 77.2167, radiusMeters: 2000 });
}).then((nearbyVehicles) => {
  assert.strictEqual(nearbyVehicles.length, 2);
  assert.strictEqual(nearbyVehicles[0].vehicleId, 'BUS-DEL-101');
  assert.strictEqual(nearbyVehicles[0].distanceMeters, 450.25);
  console.log('✔ Proximity query (GEOSEARCH) parsing verified.');

  // -------------------------------------------------------------
  // 2. Test Slow Path Bulk Multi-Row SQL Generator & PostGIS Spatial Function
  // -------------------------------------------------------------
  console.log('\n2. Testing PostGIS Bulk SQL Multi-Row Generator...');

  const worker = new TelemetryConsumerWorker({ redisClient: mockRedis, dbPool: {} });

  const sampleBatch = [
    {
      vehicleId: 'BUS-101',
      operatorId: 'OP-1',
      latitude: 28.6320,
      longitude: 77.2180,
      speedKmh: 40.0,
      heading: 90,
      altitude: 215,
      accuracyMeters: 5,
      timestamp: '2026-08-19T20:00:00.000Z'
    },
    {
      vehicleId: 'BUS-102',
      operatorId: 'OP-1',
      latitude: 28.6400,
      longitude: 77.2250,
      speedKmh: 52.0,
      heading: 120,
      altitude: null,
      accuracyMeters: 8,
      timestamp: '2026-08-19T20:00:01.000Z'
    }
  ];

  const { text, values } = worker.buildBulkInsertQuery(sampleBatch);
  assert.match(text, /INSERT INTO vehicle_telemetry/);
  assert.match(text, /ST_SetSRID\(ST_MakePoint\(\$4, \$3\), 4326\)/, 'Must transform ($4=lon, $3=lat) into spatial point');
  assert.match(text, /ST_SetSRID\(ST_MakePoint\(\$13, \$12\), 4326\)/, 'Second row must use ($13=lon, $12=lat)');
  assert.strictEqual(values.length, 18, '2 rows x 9 parameters = 18 values');
  console.log('✔ Bulk multi-row SQL generation with ST_MakePoint verified.');

  // -------------------------------------------------------------
  // 3. Test Error Resilience & Guaranteed XACK
  // -------------------------------------------------------------
  console.log('\n3. Testing Stream Consumer Group & Zero Data Loss XACK Guarantee...');

  let xackExecuted = false;
  const mockWorkerRedis = {
    async xreadgroup() {
      return [
        [
          'stream:telemetry:gps',
          [
            ['msg-1', ['payload', JSON.stringify(sampleBatch[0])]],
            ['msg-2', ['payload', JSON.stringify(sampleBatch[1])]]
          ]
        ]
      ];
    },
    async xack(stream, group, ...ids) {
      xackExecuted = true;
      assert.deepStrictEqual(ids, ['msg-1', 'msg-2']);
    }
  };

  // Case A: Successful DB Commit -> XACK is called
  const mockSuccessDbPool = {
    async query(text, values) {
      return { rowCount: 2 };
    }
  };

  const successWorker = new TelemetryConsumerWorker({
    redisClient: mockWorkerRedis,
    dbPool: mockSuccessDbPool
  });

  return successWorker.processBatch().then((processedCount) => {
    assert.strictEqual(processedCount, 2);
    assert.strictEqual(xackExecuted, true, 'XACK must be called after successful DB commit');
    console.log('✔ PostGIS commit and atomic XACK acknowledgment verified.');

    // Case B: DB Connection Drop / Query Failure -> NO XACK called
    xackExecuted = false;
    const mockFailingDbPool = {
      async query() {
        throw new Error('PostgreSQL connection dropped (ECONNREFUSED)');
      }
    };

    const failingWorker = new TelemetryConsumerWorker({
      redisClient: mockWorkerRedis,
      dbPool: mockFailingDbPool
    });

    return failingWorker.processBatch();
  }).then((processedCount) => {
    assert.strictEqual(processedCount, 0);
    assert.strictEqual(xackExecuted, false, 'XACK must NEVER be called if DB query fails');
    console.log('✔ Zero-data-loss guarantee verified: Uncommitted messages remain in PEL for retry.');

    console.log('\nAll Fast Path / Slow Path Telemetry tests passed successfully!');
    process.exit(0);
  });
}).catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
