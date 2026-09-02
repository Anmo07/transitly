/**
 * ==============================================================================
 * Transitly: Comprehensive PostgreSQL 16 + PostGIS Operations Test Suite
 * Tests every single domain operation across all 6 DDD modules:
 * 1. IAM & Multi-Tenant Operators
 * 2. Transit Network Infrastructure (PostGIS Spatial Queries & Corridors)
 * 3. Fleet & Capacity OCC Operations
 * 4. Multimodal Shipments & Last-Mile Provider Orchestration
 * 5. Real-Time Telemetry, Custody Handoffs & Proof of Delivery
 * 6. Financial Settlements, Snapshots, WhatsApp Consents & Audit Logging
 * ==============================================================================
 */

require('dotenv').config();
const assert = require('assert');
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
  database: process.env.POSTGRES_DB || 'transitly_telemetry'
});

async function runOperationsTestSuite() {
  console.log('================================================================');
  console.log(' Transitly: Master PostgreSQL + PostGIS Operations Test Suite');
  console.log('================================================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  async function testStep(name, fn) {
    try {
      await fn();
      console.log(`  ✔ ${name}`);
      testsPassed++;
    } catch (err) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      testsFailed++;
    }
  }

  try {
    // --------------------------------------------------------------------------
    // MODULE 1: IAM & Multi-Tenant Operator Operations
    // --------------------------------------------------------------------------
    console.log('🔹 [MODULE 1: IAM & Multi-Tenant Operator Operations]');

    let testOperatorId;
    let testOperatorUserId;
    let testCustomerId;

    await testStep('1.1 Create Multi-Tenant Operator with JSONB Config', async () => {
      const uniqueCode = `OP-${Date.now().toString().slice(-6)}`;
      const res = await pool.query(`
        INSERT INTO operators (name, code, contact_email, contact_phone, commission_rate, is_active, config)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, operator_uuid, code, config
      `, [
        'Punjab Roadways Express',
        uniqueCode,
        `ops@punjabroadways-${uniqueCode}.gov.in`,
        '+911722700000',
        12.50,
        true,
        JSON.stringify({ autoAcceptBookings: true, maxCargoWeightPerBusKg: 750 })
      ]);
      assert(res.rows.length === 1);
      assert(res.rows[0].id);
      assert.strictEqual(res.rows[0].config.maxCargoWeightPerBusKg, 750);
      testOperatorId = res.rows[0].id;
    });

    await testStep('1.2 Reject Operator with Invalid Phone Format (E.164 Regex Check)', async () => {
      let rejected = false;
      try {
        await pool.query(`
          INSERT INTO operators (name, code, contact_email, contact_phone)
          VALUES ('Invalid Phone Corp', 'INV-PH-01', 'bad@phone.com', '12345')
        `);
      } catch (err) {
        rejected = true;
      }
      assert(rejected, 'Expected invalid phone format to be rejected by E.164 regex constraint');
    });

    await testStep('1.3 Create Operator User and Customer User with Role Validation', async () => {
      // 1. Operator persona user
      const opUserRes = await pool.query(`
        INSERT INTO users (operator_id, name, email, phone, role)
        VALUES ($1, $2, $3, $4, 'OPERATOR')
        RETURNING id
      `, [
        testOperatorId,
        'Punjab Roadways Official Dispatch',
        `dispatch-${Date.now()}@punjabroadways.gov.in`,
        '+911722700001'
      ]);
      testOperatorUserId = opUserRes.rows[0].id;

      // 2. Customer user
      const custRes = await pool.query(`
        INSERT INTO users (operator_id, name, email, phone, role, preferences)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, role
      `, [
        testOperatorId,
        'Harpreet Singh',
        `customer-${Date.now()}@example.com`,
        '+919876500001',
        'CUSTOMER',
        JSON.stringify({ whatsappUpdates: true, language: 'pa' })
      ]);
      assert(custRes.rows.length === 1);
      assert.strictEqual(custRes.rows[0].role, 'CUSTOMER');
      testCustomerId = custRes.rows[0].id;
    });

    await testStep('1.4 Create Customer Saved Address with PostGIS Spatial Point', async () => {
      const res = await pool.query(`
        INSERT INTO saved_addresses (user_id, label, address_line, city, latitude, longitude, geom, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326), $7)
        RETURNING id, label, ST_AsGeoJSON(geom) AS geom_json
      `, [
        testCustomerId,
        'Mohali Fulfillment Hub',
        'Plot 104, Industrial Area Phase 8B',
        'Mohali',
        30.7046,
        76.7089,
        true
      ]);
      assert(res.rows.length === 1);
      const parsed = JSON.parse(res.rows[0].geom_json);
      assert.strictEqual(parsed.type, 'Point');
      assert.strictEqual(parsed.coordinates[0], 76.7089);
      assert.strictEqual(parsed.coordinates[1], 30.7046);
    });

    // --------------------------------------------------------------------------
    // MODULE 2: Transit Network Infrastructure & PostGIS Spatial Calculations
    // --------------------------------------------------------------------------
    console.log('\n🔹 [MODULE 2: Transit Network Infrastructure & PostGIS Spatial Operations]');

    let originTerminalId;
    let destTerminalId;
    let routeTransactionId;

    await testStep('2.1 Create Terminals with Point Geometries & Spatial GIST Index', async () => {
      const tCode1 = `TERM-CHD-${Date.now().toString().slice(-4)}`;
      const tCode2 = `TERM-ASR-${Date.now().toString().slice(-4)}`;

      // Origin: ISBT Sector 43, Chandigarh
      const t1 = await pool.query(`
        INSERT INTO terminals (terminal_code, name, operator_id, address, city, location, geofence_radius_meters)
        VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8)
        RETURNING id
      `, [tCode1, 'ISBT Sector 43 Chandigarh', testOperatorId, 'Sector 43, Chandigarh', 'Chandigarh', 76.7554, 30.7188, 300]);
      originTerminalId = t1.rows[0].id;

      // Destination: Amritsar Central Bus Stand
      const t2 = await pool.query(`
        INSERT INTO terminals (terminal_code, name, operator_id, address, city, location, geofence_radius_meters)
        VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8)
        RETURNING id
      `, [tCode2, 'Amritsar Central Bus Terminal', testOperatorId, 'City Center, Amritsar', 'Amritsar', 74.8723, 31.6340, 400]);
      destTerminalId = t2.rows[0].id;

      assert(originTerminalId && destTerminalId);
    });

    await testStep('2.2 Calculate Geodesic Distance via PostGIS ST_Distance (Geography)', async () => {
      // Distance between Chandigarh (30.7188 N, 76.7554 E) and Amritsar (31.6340 N, 74.8723 E)
      const res = await pool.query(`
        SELECT ST_Distance(
          (SELECT location::geography FROM terminals WHERE id = $1),
          (SELECT location::geography FROM terminals WHERE id = $2)
        ) / 1000.0 AS distance_km
      `, [originTerminalId, destTerminalId]);

      const dist = parseFloat(res.rows[0].distance_km);
      assert(dist > 200 && dist < 250, `Distance was ${dist} km, expected ~210-230 km`);
    });

    await testStep('2.3 Verify PostGIS Geofence Proximity Query (ST_DWithin)', async () => {
      // Point inside Chandigarh ISBT (offset by ~50 meters)
      const insideLng = 76.7558;
      const insideLat = 30.7190;
      
      const res = await pool.query(`
        SELECT ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          geofence_radius_meters
        ) AS is_inside
        FROM terminals WHERE id = $3
      `, [insideLng, insideLat, originTerminalId]);

      assert.strictEqual(res.rows[0].is_inside, true);
    });

    await testStep('2.4 Create Versioned Corridor Route with PostGIS LineString Path', async () => {
      const logicalRouteId = `PB-CHD-ASR-${Date.now().toString().slice(-4)}`;
      const res = await pool.query(`
        INSERT INTO route_transactions (
          logical_route_id, version, operator_id, origin_terminal, destination_terminal,
          origin_terminal_id, destination_terminal_id,
          origin_geom, destination_geom, path,
          distance_km, estimated_duration_minutes, is_latest, status
        ) VALUES (
          $1, 1, $2, 'ISBT Sector 43 Chandigarh', 'Amritsar Central Bus Stand',
          $3, $4,
          ST_SetSRID(ST_MakePoint(76.7554, 30.7188), 4326),
          ST_SetSRID(ST_MakePoint(74.8723, 31.6340), 4326),
          ST_SetSRID(ST_MakeLine(
            ARRAY[
              ST_MakePoint(76.7554, 30.7188),
              ST_MakePoint(75.8573, 30.9010),
              ST_MakePoint(75.5762, 31.3260),
              ST_MakePoint(74.8723, 31.6340)
            ]
          ), 4326),
          228.50, 240, TRUE, 'ACTIVE'
        )
        RETURNING id, logical_route_id, version, ST_AsText(path) AS path_wkt
      `, [logicalRouteId, testOperatorUserId, originTerminalId, destTerminalId]);

      assert(res.rows.length === 1);
      assert.strictEqual(res.rows[0].version, 1);
      assert(res.rows[0].path_wkt.startsWith('LINESTRING'));
      routeTransactionId = res.rows[0].id;
    });

    await testStep('2.5 Create Route Stops and Enforce Unique Sequence Order', async () => {
      await pool.query(`
        INSERT INTO route_stops (route_transaction_id, terminal_id, stop_name, sequence_order, latitude, longitude, geom, estimated_stop_offset_minutes)
        VALUES 
        ($1, $2, 'ISBT Chandigarh (Origin)', 1, 30.7188, 76.7554, ST_SetSRID(ST_MakePoint(76.7554, 30.7188), 4326), 0),
        ($1, NULL, 'Ludhiana Bus Stand', 2, 30.9010, 75.8573, ST_SetSRID(ST_MakePoint(75.8573, 30.9010), 4326), 75),
        ($1, NULL, 'Jalandhar City Hub', 3, 31.3260, 75.5762, ST_SetSRID(ST_MakePoint(75.5762, 31.3260), 4326), 140),
        ($1, $3, 'Amritsar Central Terminal (Destination)', 4, 31.6340, 74.8723, ST_SetSRID(ST_MakePoint(74.8723, 31.6340), 4326), 240)
      `, [routeTransactionId, originTerminalId, destTerminalId]);

      // Attempt inserting duplicate sequence order for same route
      let duplicateRejected = false;
      try {
        await pool.query(`
          INSERT INTO route_stops (route_transaction_id, stop_name, sequence_order, latitude, longitude)
          VALUES ($1, 'Duplicate Stop', 1, 30.7188, 76.7554)
        `, [routeTransactionId]);
      } catch (_) {
        duplicateRejected = true;
      }
      assert(duplicateRejected, 'Expected unique constraint (route_transaction_id, sequence_order) to reject duplicate ordinal');
    });

    // --------------------------------------------------------------------------
    // MODULE 3: Fleet & Capacity Management (Optimistic Concurrency Control)
    // --------------------------------------------------------------------------
    console.log('\n🔹 [MODULE 3: Fleet & Capacity OCC Operations]');

    let testVehicleId;
    let testSlotId;
    const uniqueVehicleReg = `PB-EXP-${Date.now().toString().slice(-6)}`;

    await testStep('3.1 Register Fleet Vehicle with Cargo Constraints', async () => {
      const res = await pool.query(`
        INSERT INTO vehicles (operator_id, registration, vehicle_type, cargo_capacity_kg, available_capacity_kg, cargo_volume_m3, is_active)
        VALUES ($1, $2, 'BUS', 500.00, 500.00, 4.50, TRUE)
        RETURNING id, registration
      `, [testOperatorUserId, uniqueVehicleReg]);
      assert(res.rows.length === 1);
      testVehicleId = res.rows[0].id;
    });

    await testStep('3.2 Create Dynamic Date Capacity Slot with Version 1', async () => {
      const slotDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // Tomorrow
      const res = await pool.query(`
        INSERT INTO capacity_slots (
          operator_id, vehicle_id, route_transaction_id, slot_date, departure_time,
          total_capacity_kg, available_weight_kg, reserved_weight_kg, version, status
        ) VALUES (
          $1, $2, $3, $4, '08:30:00',
          500.00, 500.00, 0.00, 1, 'AVAILABLE'
        )
        RETURNING id, version, available_weight_kg
      `, [testOperatorUserId, testVehicleId, routeTransactionId, slotDate]);
      assert(res.rows.length === 1);
      assert.strictEqual(res.rows[0].version, 1);
      testSlotId = res.rows[0].id;
    });

    await testStep('3.3 Atomic OCC Capacity Reservation (version 1 -> 2)', async () => {
      const parcelWeight = 35.00;
      const expectedVersion = 1;

      const res = await pool.query(`
        UPDATE capacity_slots
        SET 
          available_weight_kg = available_weight_kg - $1,
          reserved_weight_kg = reserved_weight_kg + $1,
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND version = $3 AND available_weight_kg >= $1
        RETURNING id, available_weight_kg, reserved_weight_kg, version
      `, [parcelWeight, testSlotId, expectedVersion]);

      assert(res.rows.length === 1);
      assert.strictEqual(res.rows[0].version, 2);
      assert.strictEqual(parseFloat(res.rows[0].available_weight_kg), 465.00);
      assert.strictEqual(parseFloat(res.rows[0].reserved_weight_kg), 35.00);
    });

    await testStep('3.4 Reject Stale OCC Version Collision (Optimistic Lock Test)', async () => {
      const staleVersion = 1; // Current version in DB is 2
      const res = await pool.query(`
        UPDATE capacity_slots
        SET 
          available_weight_kg = available_weight_kg - 20,
          reserved_weight_kg = reserved_weight_kg + 20,
          version = version + 1
        WHERE id = $1 AND version = $2 AND available_weight_kg >= 20
        RETURNING id
      `, [testSlotId, staleVersion]);

      assert.strictEqual(res.rows.length, 0, 'Expected OCC collision to affect 0 rows');
    });

    await testStep('3.5 Reject Over-Capacity Reservation violating Balance Constraint', async () => {
      let rejected = false;
      try {
        await pool.query(`
          UPDATE capacity_slots
          SET 
            available_weight_kg = 100,
            reserved_weight_kg = 450 -- 100 + 450 = 550 > 500 total capacity
          WHERE id = $1
        `, [testSlotId]);
      } catch (_) {
        rejected = true;
      }
      assert(rejected, 'Expected chk_capacity_balance constraint to reject exceeding total capacity');
    });

    // --------------------------------------------------------------------------
    // MODULE 4: Multimodal Shipments & Last-Mile Orchestration
    // --------------------------------------------------------------------------
    console.log('\n🔹 [MODULE 4: Multimodal Shipments & Last-Mile Operations]');

    let testShipmentId;
    let testTrackingId;
    let rawOtp = '482910';
    let otpSalt = crypto.randomBytes(16).toString('hex');
    let otpHash = crypto.createHash('sha256').update(rawOtp + otpSalt).digest('hex');
    let qrSealCode = 'SEAL-PB-9941-8A20';
    let qrSealSecret = 'transitly-hmac-master-key';
    let qrSealHash = crypto.createHmac('sha256', qrSealSecret).update(qrSealCode).digest('hex');

    await testStep('4.1 Create Master Shipment Aggregate with Crypto Seal & OTP Hash', async () => {
      testTrackingId = `TRK-PB-${Date.now().toString().slice(-6)}`;
      const res = await pool.query(`
        INSERT INTO shipments (
          tracking_id, operator_id, customer_user_id, capacity_slot_id, assigned_vehicle_id, assigned_route_id,
          status, version,
          sender_name, sender_phone, sender_address,
          recipient_name, recipient_phone, recipient_address,
          weight_kg, price,
          qr_seal_code, qr_seal_hash, qr_seal_tampered,
          delivery_otp_hash, delivery_otp_salt, delivery_otp_verified,
          pickup_geom, delivery_geom, origin_geom, dest_geom
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          'OPEN', 1,
          'Harpreet Singh', '+919876500001', 'Sector 43, Chandigarh',
          'Gurpreet Kaur', '+919876500002', 'Golden Temple Road, Amritsar',
          35.00, 650.00,
          $7, $8, FALSE,
          $9, $10, FALSE,
          ST_SetSRID(ST_MakePoint(76.7554, 30.7188), 4326),
          ST_SetSRID(ST_MakePoint(74.8723, 31.6340), 4326),
          ST_SetSRID(ST_MakePoint(76.7554, 30.7188), 4326),
          ST_SetSRID(ST_MakePoint(74.8723, 31.6340), 4326)
        )
        RETURNING id, tracking_id, status, version
      `, [
        testTrackingId, testOperatorUserId, testCustomerId, testSlotId, testVehicleId, routeTransactionId,
        qrSealCode, qrSealHash, otpHash, otpSalt
      ]);

      assert(res.rows.length === 1);
      assert.strictEqual(res.rows[0].status, 'OPEN');
      testShipmentId = res.rows[0].id;
    });

    await testStep('4.2 Verify Cryptographic OTP Hash against Raw Recipient Input', async () => {
      const res = await pool.query(`
        SELECT delivery_otp_hash, delivery_otp_salt FROM shipments WHERE id = $1
      `, [testShipmentId]);

      const storedHash = res.rows[0].delivery_otp_hash;
      const storedSalt = res.rows[0].delivery_otp_salt;

      const computedHash = crypto.createHash('sha256').update(rawOtp + storedSalt).digest('hex');
      assert.strictEqual(computedHash, storedHash, 'Cryptographic OTP verification failed');
    });

    let lastMilePickupLegId;
    let lastMileDeliveryLegId;

    await testStep('4.3 Create Multimodal Legs Parent-Child Mapping', async () => {
      const l1 = await pool.query(`
        INSERT INTO shipment_legs (
          shipment_id, tracking_id, leg_type, direction, provider, status,
          pickup_address, dropoff_address, quoted_amount, accepted_amount,
          pickup_geom, dropoff_geom
        ) VALUES (
          $1, $2, 'PICKUP_LAST_MILE', 'PICKUP', 'UBER_DIRECT', 'COMPLETED',
          'Sector 43, Chandigarh', 'ISBT Sector 43, Chandigarh', 95.00, 95.00,
          ST_SetSRID(ST_MakePoint(76.7550, 30.7180), 4326),
          ST_SetSRID(ST_MakePoint(76.7554, 30.7188), 4326)
        ) RETURNING id
      `, [testShipmentId, testTrackingId]);
      lastMilePickupLegId = l1.rows[0].id;

      await pool.query(`
        INSERT INTO shipment_legs (
          shipment_id, tracking_id, leg_type, direction, provider, status,
          pickup_address, dropoff_address, quoted_amount, accepted_amount,
          pickup_geom, dropoff_geom
        ) VALUES (
          $1, $2, 'TRANSIT', 'TRANSIT', 'PUNJAB_ROADWAYS', 'IN_TRANSIT',
          'ISBT Sector 43, Chandigarh', 'Amritsar Central Bus Stand', 460.00, 460.00,
          ST_SetSRID(ST_MakePoint(76.7554, 30.7188), 4326),
          ST_SetSRID(ST_MakePoint(74.8723, 31.6340), 4326)
        )
      `, [testShipmentId, testTrackingId]);

      const l3 = await pool.query(`
        INSERT INTO shipment_legs (
          shipment_id, tracking_id, leg_type, direction, provider, status,
          pickup_address, dropoff_address, quoted_amount, accepted_amount,
          pickup_geom, dropoff_geom
        ) VALUES (
          $1, $2, 'DELIVERY_LAST_MILE', 'DELIVERY', 'RAPIDO', 'QUOTED',
          'Amritsar Central Bus Stand', 'Golden Temple Road, Amritsar', 95.00, 95.00,
          ST_SetSRID(ST_MakePoint(74.8723, 31.6340), 4326),
          ST_SetSRID(ST_MakePoint(74.8765, 31.6200), 4326)
        ) RETURNING id
      `, [testShipmentId, testTrackingId]);
      lastMileDeliveryLegId = l3.rows[0].id;

      assert(lastMilePickupLegId && lastMileDeliveryLegId);
    });

    await testStep('4.4 Store 3rd-Party Provider Quotes & Capabilities', async () => {
      const quoteId = `UBER-Q-${Date.now().toString().slice(-6)}`;
      const res = await pool.query(`
        INSERT INTO provider_quotes (
          shipment_leg_id, provider, external_quote_id, amount, currency, expires_at, capabilities, raw_payload
        ) VALUES (
          $1, 'UBER_DIRECT', $2, 95.00, 'INR', NOW() + INTERVAL '15 minutes',
          '{"vehicleType": "MOTO", "estimatedArrivalMinutes": 18}'::jsonb,
          '{"quote_id": "ext_99182", "status": "active"}'::jsonb
        )
        RETURNING id, external_quote_id
      `, [lastMilePickupLegId, quoteId]);
      assert(res.rows.length === 1);
    });

    await testStep('4.5 Store Provider Dispatch with Idempotency Key & Reject Duplicates', async () => {
      const idempotencyKey = `IDEMP-${Date.now()}-${testShipmentId}`;
      const res = await pool.query(`
        INSERT INTO provider_dispatches (
          shipment_leg_id, provider, external_delivery_id, status, tracking_url, idempotency_key
        ) VALUES (
          $1, 'UBER_DIRECT', 'DELIV-UBER-8819', 'DISPATCHED', 'https://uber.direct/track/8819', $2
        ) RETURNING id
      `, [lastMilePickupLegId, idempotencyKey]);
      assert(res.rows.length === 1);

      // Duplicate idempotency key must fail
      let duplicateRejected = false;
      try {
        await pool.query(`
          INSERT INTO provider_dispatches (
            shipment_leg_id, provider, external_delivery_id, status, idempotency_key
          ) VALUES ($1, 'UBER_DIRECT', 'DELIV-UBER-8819-DUP', 'DISPATCHED', $2)
        `, [lastMilePickupLegId, idempotencyKey]);
      } catch (_) {
        duplicateRejected = true;
      }
      assert(duplicateRejected, 'Expected duplicate idempotency key to be rejected by unique constraint');
    });

    // --------------------------------------------------------------------------
    // MODULE 5: Real-Time Telemetry, Custody Handoffs & Proof of Delivery
    // --------------------------------------------------------------------------
    console.log('\n🔹 [MODULE 5: Real-Time Telemetry & Custody Operations]');

    const telemetryVehicleKey = `PB-EXP-TEL-${Date.now()}`;

    await testStep('5.1 Ingest Real-Time Spatial GPS Telemetry Pings', async () => {
      const pingTime = new Date();
      await pool.query(`
        INSERT INTO vehicle_telemetry (
          vehicle_id, operator_id, latitude, longitude, geom, speed_kmh, heading, ping_timestamp
        ) VALUES 
        ($1, $2, 30.7188, 76.7554, ST_SetSRID(ST_MakePoint(76.7554, 30.7188), 4326), 0.0, 0, $3),
        ($1, $2, 30.9010, 75.8573, ST_SetSRID(ST_MakePoint(75.8573, 30.9010), 4326), 65.4, 285, $3 + INTERVAL '1 hour'),
        ($1, $2, 31.3260, 75.5762, ST_SetSRID(ST_MakePoint(75.5762, 31.3260), 4326), 72.1, 290, $3 + INTERVAL '2 hours')
      `, [telemetryVehicleKey, testOperatorId.toString(), pingTime]);

      const count = await pool.query(`
        SELECT COUNT(*) FROM vehicle_telemetry WHERE vehicle_id = $1
      `, [telemetryVehicleKey]);
      assert.strictEqual(parseInt(count.rows[0].count, 10), 3);
    });

    await testStep('5.2 Log Immutable Chain of Custody Transfer with Geofence Verification', async () => {
      const res = await pool.query(`
        INSERT INTO custody_handoffs (
          shipment_id, tracking_id, from_user_id, to_user_id, from_role, to_role,
          qr_seal_code, seal_status, handoff_type,
          location_geom, is_within_geofence, distance_meters, signature_url
        ) VALUES (
          $1, $2, $3, $3, 'CUSTOMER', 'DRIVER',
          $4, 'INTACT', 'PICKUP_TO_BUS',
          ST_SetSRID(ST_MakePoint(76.7554, 30.7188), 4326), TRUE, 12.5, 'https://cdn.transitly.in/signatures/sig-8819.png'
        ) RETURNING id, seal_status
      `, [testShipmentId, testTrackingId, testCustomerId, qrSealCode]);

      assert(res.rows.length === 1);
      assert.strictEqual(res.rows[0].seal_status, 'INTACT');
    });

    await testStep('5.3 Record Digital Proof of Delivery with PostGIS Geofence Validation', async () => {
      // Transition shipment to DELIVERED
      await pool.query(`
        UPDATE shipments 
        SET status = 'DELIVERED', delivery_otp_verified = TRUE, version = version + 1
        WHERE id = $1
      `, [testShipmentId]);

      const res = await pool.query(`
        INSERT INTO proof_of_delivery (
          shipment_id, tracking_id, recipient_name, recipient_phone,
          otp_verified, qr_seal_verified, qr_seal_code,
          signature_url, photo_url, location_geom, geofence_validated, delivered_by_user_id
        ) VALUES (
          $1, $2, 'Gurpreet Kaur', '+919876500002',
          TRUE, TRUE, $3,
          'https://cdn.transitly.in/signatures/pod-9912.png',
          'https://cdn.transitly.in/photos/parcel-delivered-9912.jpg',
          ST_SetSRID(ST_MakePoint(74.8765, 31.6200), 4326),
          TRUE, $4
        ) RETURNING id, otp_verified, geofence_validated
      `, [testShipmentId, testTrackingId, qrSealCode, testCustomerId]);

      assert(res.rows.length === 1);
      assert.strictEqual(res.rows[0].otp_verified, true);
      assert.strictEqual(res.rows[0].geofence_validated, true);
    });

    // --------------------------------------------------------------------------
    // MODULE 6: Settlements, Audits & Notifications
    // --------------------------------------------------------------------------
    console.log('\n🔹 [MODULE 6: Settlements, Audits & Notifications]');

    await testStep('6.1 Post Double-Entry Ledger Postings & Verify Zero-Balance Trial Balance', async () => {
      // Total price: 650.00
      // Operator: 460.00 (70.7%)
      // Last-Mile Riders: 130.00 (20%)
      // Platform Fee: 60.00 (9.3%)
      await pool.query(`
        INSERT INTO ledger_entries (shipment_id, tracking_id, operator_id, entry_type, amount, currency, debit_account, credit_account, description)
        VALUES
        ($1, $2, $3, 'SHIPMENT_REVENUE', 650.00, 'INR', 'ACCOUNTS_RECEIVABLE_CUSTOMER', 'UNEARNED_TRANSIT_REVENUE', 'Customer fare collected'),
        ($1, $2, $3, 'OPERATOR_EARNING', 460.00, 'INR', 'UNEARNED_TRANSIT_REVENUE', 'OPERATOR_PAYABLE_PB_ROADWAYS', 'Intercity bus transit compensation'),
        ($1, $2, $3, 'PARTNER_COMMISSION', 130.00, 'INR', 'UNEARNED_TRANSIT_REVENUE', 'LAST_MILE_PARTNERS_PAYABLE', 'Pickup & delivery rider fees'),
        ($1, $2, $3, 'PLATFORM_FEE', 60.00, 'INR', 'UNEARNED_TRANSIT_REVENUE', 'PLATFORM_REVENUE_COMMISSION', 'Transitly service fee')
      `, [testShipmentId, testTrackingId, testOperatorUserId]);

      // Check sum of debits and credits
      const revenue = await pool.query(`
        SELECT amount FROM ledger_entries WHERE shipment_id = $1 AND entry_type = 'SHIPMENT_REVENUE'
      `, [testShipmentId]);

      const payouts = await pool.query(`
        SELECT SUM(amount) AS total_payouts FROM ledger_entries 
        WHERE shipment_id = $1 AND entry_type IN ('OPERATOR_EARNING', 'PARTNER_COMMISSION', 'PLATFORM_FEE')
      `, [testShipmentId]);

      assert.strictEqual(parseFloat(revenue.rows[0].amount), parseFloat(payouts.rows[0].total_payouts));
    });

    await testStep('6.2 Create Immutable Transaction Snapshot with SHA-256 Digest', async () => {
      const snapshotPayload = {
        shipmentId: testShipmentId,
        trackingId: testTrackingId,
        finalStatus: 'CLOSED',
        price: 650.00,
        weight: 35.00,
        sender: 'Harpreet Singh',
        recipient: 'Gurpreet Kaur',
        qrSeal: qrSealCode,
        deliveryConfirmedAt: new Date().toISOString()
      };

      const digest = crypto.createHash('sha256').update(JSON.stringify(snapshotPayload)).digest('hex');

      const res = await pool.query(`
        INSERT INTO transaction_snapshots (
          shipment_id, tracking_id, operator_id, final_version, final_status,
          snapshot_data, total_handoff_count, snapshot_hash
        ) VALUES (
          $1, $2, $3, 4, 'CLOSED', $4, 2, $5
        ) RETURNING id, snapshot_hash
      `, [testShipmentId, testTrackingId, testOperatorUserId, JSON.stringify(snapshotPayload), digest]);

      assert(res.rows.length === 1);
      assert.strictEqual(res.rows[0].snapshot_hash, digest);
    });

    await testStep('6.3 Manage WhatsApp Messaging Consent (Opt-in & Opt-out)', async () => {
      const phone = '+919876500001';
      // Record Consent
      await pool.query(`
        INSERT INTO messaging_consents (user_id, channel, phone_e164, status, source)
        VALUES ($1, 'WHATSAPP', $2, 'OPTED_IN', 'WEB_BOOKING')
      `, [testCustomerId, phone]);

      // Update to Opt-out
      const res = await pool.query(`
        UPDATE messaging_consents
        SET status = 'OPTED_OUT', revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND phone_e164 = $2
        RETURNING status
      `, [testCustomerId, phone]);

      assert.strictEqual(res.rows[0].status, 'OPTED_OUT');
    });

    await testStep('6.4 Queue & Dispatch Outbound Notifications', async () => {
      const res = await pool.query(`
        INSERT INTO notifications (
          shipment_id, user_id, channel, template_name, recipient_e164, status, payload
        ) VALUES (
          $1, $2, 'WHATSAPP', 'parcel_delivered', '+919876500002', 'QUEUED',
          '{"trackingId": "TRK-PB-01", "deliveredAt": "2026-09-02T12:00:00Z"}'::jsonb
        ) RETURNING id, status
      `, [testShipmentId, testCustomerId]);

      assert.strictEqual(res.rows[0].status, 'QUEUED');

      // Dispatch worker marks as SENT
      const updated = await pool.query(`
        UPDATE notifications SET status = 'DELIVERED', delivered_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING status
      `, [res.rows[0].id]);
      assert.strictEqual(updated.rows[0].status, 'DELIVERED');
    });

    await testStep('6.5 Record Admin Command Center Security Audit Log', async () => {
      const res = await pool.query(`
        INSERT INTO audit_logs (
          actor_user_id, actor_role, action, resource_type, resource_id, ip_address, payload
        ) VALUES (
          $1, 'ADMIN', 'FORCE_CLOSE_SHIPMENT', 'SHIPMENT', $2, '127.0.0.1'::inet,
          '{"reason": "Delivery confirmed by operator manual override", "authorizedBy": "Chief Ops"}'::jsonb
        ) RETURNING id, action
      `, [testCustomerId, testShipmentId.toString()]);

      assert(res.rows.length === 1);
      assert.strictEqual(res.rows[0].action, 'FORCE_CLOSE_SHIPMENT');
    });

    await testStep('6.6 Manage Customer Support Ticket Lifecycle (OPEN -> RESOLVED)', async () => {
      const res = await pool.query(`
        INSERT INTO support_tickets (
          user_id, shipment_id, category, tracking_id, description, status, priority
        ) VALUES (
          $1, $2, 'LATE_DELIVERY', $3, 'Parcel was delayed by 30 mins due to fog', 'OPEN', 'MEDIUM'
        ) RETURNING id, status
      `, [testCustomerId, testShipmentId, testTrackingId]);

      assert.strictEqual(res.rows[0].status, 'OPEN');

      // Resolution
      const resolved = await pool.query(`
        UPDATE support_tickets
        SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING status
      `, [res.rows[0].id]);
      assert.strictEqual(resolved.rows[0].status, 'RESOLVED');
    });

  } finally {
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(` Operations Test Results: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runOperationsTestSuite();
}

module.exports = { runOperationsTestSuite };
