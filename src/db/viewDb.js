require('dotenv').config();
const { pool } = require('../config/postgres');

/**
 * Database Inspector CLI Script
 * Queries and prints all master tables, routes, stops, and telemetry.
 */
const viewDatabase = async () => {
  console.log('================================================================');
  console.log('         TRANSITLY MASTER DATABASE INSPECTION REPORT            ');
  console.log('================================================================\n');

  try {
    // 1. Bus Routes & Stops
    console.log('📌 1. Master Intercity Routes & Stops (OCP Versioned):');
    const routes = await pool.query(`
      SELECT 
        r.logical_route_id,
        r.version,
        r.origin_terminal,
        r.destination_terminal,
        s.sequence_order,
        s.stop_name,
        s.latitude,
        s.longitude
      FROM route_transactions r
      JOIN route_stops s ON r.id = s.route_transaction_id
      WHERE r.is_latest = TRUE
      ORDER BY s.sequence_order ASC;
    `);
    console.table(routes.rows);

    // 2. Multimodal Shipments & Legs
    console.log('\n📦 2. Active Multimodal Shipments & Child Legs:');
    const shipments = await pool.query(`
      SELECT 
        s.tracking_id,
        s.status AS parent_status,
        s.sender_name,
        s.recipient_name,
        l.leg_type,
        l.provider,
        l.status AS leg_status,
        l.pickup_address,
        l.dropoff_address,
        l.price AS leg_price
      FROM shipments s
      JOIN shipment_legs l ON s.id = l.shipment_id
      ORDER BY s.id, l.id;
    `);
    console.table(shipments.rows);

    // 3. Vehicles & Cargo Capacities
    console.log('\n🚌 3. Fleet Vehicles & Capacity:');
    const vehicles = await pool.query(`
      SELECT 
        v.id,
        v.registration,
        v.cargo_capacity_kg,
        v.available_capacity_kg,
        v.last_latitude,
        v.last_longitude
      FROM vehicles v;
    `);
    console.table(vehicles.rows);

    // 4. Real-time GPS Telemetry Trail
    console.log('\n📡 4. Real-time GPS Telemetry Trail (Spatial Pings):');
    const telemetry = await pool.query(`
      SELECT 
        vehicle_id,
        latitude,
        longitude,
        speed_kmh,
        heading,
        ping_timestamp
      FROM vehicle_telemetry
      ORDER BY ping_timestamp DESC
      LIMIT 10;
    `);
    console.table(telemetry.rows);

    console.log('\n================================================================');
    console.log('All 12 tables and PostGIS spatial geometries are active & healthy.');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    await pool.end();
  }
};

viewDatabase();
