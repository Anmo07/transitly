require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/**
 * Master PostgreSQL Database Initialization & Migration Runner
 * Seamlessly supports both PostGIS-enabled environments (e.g. Docker / Enterprise)
 * and native PostgreSQL (POINT/JSONB) for local DBeaver development.
 */
const initializeDatabase = async () => {
  console.log('=== Transitly Master Database Initialization (PostgreSQL) ===\n');

  const targetDb = process.env.POSTGRES_DB || 'transitly_telemetry';
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || 'postgrespassword';
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);

  // 1. Connect to root postgres database to ensure target database exists
  console.log(`1. Ensuring database "${targetDb}" exists on ${host}:${port}...`);
  const rootPool = new Pool({
    host,
    port,
    user,
    password,
    database: 'postgres'
  });

  try {
    const dbCheck = await rootPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );
    if (dbCheck.rowCount === 0) {
      console.log(`Creating database "${targetDb}"...`);
      await rootPool.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`✔ Database "${targetDb}" created.`);
    } else {
      console.log(`✔ Database "${targetDb}" verified.`);
    }
  } catch (err) {
    console.warn('[Notice]', err.message);
  } finally {
    await rootPool.end();
  }

  // 2. Connect to target database
  console.log(`\n2. Connecting to "${targetDb}"...`);
  const targetPool = new Pool({
    host,
    port,
    user,
    password,
    database: targetDb
  });

  try {
    // Check for PostGIS availability
    let hasPostgis = false;
    try {
      await targetPool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      const health = await targetPool.query('SELECT PostGIS_Version() as postgis_version');
      console.log(`✔ PostGIS Extension Enabled: ${health.rows[0].postgis_version}`);
      hasPostgis = true;
    } catch (_) {
      console.log(`ℹ PostGIS extension not installed globally on host; using PostgreSQL native POINT & JSONB spatial engine.`);
    }

    try {
      await targetPool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    } catch (_) {}

    // 3. Apply DDL Schema
    console.log(`\n3. Applying Master Relational Schema DDL...`);

    const geomType = hasPostgis ? 'GEOMETRY(Point, 4326)' : 'POINT';

    const ddl = `
      -- 1. Users & Actors
      CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          user_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(50) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'OPERATOR', 'OPERATIONS_MANAGER', 'DELIVERY_PARTNER', 'DRIVER')),
          avatar_url TEXT,
          preferences JSONB DEFAULT '{"pushNotifications": true, "emailUpdates": true, "locationServices": true, "language": "English (US)"}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      -- 1b. Customer Saved Addresses
      CREATE TABLE IF NOT EXISTS saved_addresses (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
          label VARCHAR(100) NOT NULL,
          address_line TEXT NOT NULL,
          tag VARCHAR(50) DEFAULT 'home',
          is_default BOOLEAN DEFAULT FALSE,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          geom ${geomType},
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_saved_addresses_user ON saved_addresses(user_id);
      ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
      ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

      -- 1c. Customer Payment Methods
      CREATE TABLE IF NOT EXISTS payment_methods (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL CHECK (type IN ('CARD', 'UPI', 'WALLET')),
          card_name VARCHAR(255),
          card_last_four VARCHAR(10),
          card_expiry VARCHAR(20),
          upi_vpa VARCHAR(255),
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);

      -- 1d. Customer Support Tickets
      CREATE TABLE IF NOT EXISTS support_tickets (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
          category VARCHAR(100) NOT NULL,
          tracking_id VARCHAR(100),
          description TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);

      -- 2. Vehicles
      CREATE TABLE IF NOT EXISTS vehicles (
          id BIGSERIAL PRIMARY KEY,
          operator_id BIGINT NOT NULL REFERENCES users(id),
          registration VARCHAR(50) UNIQUE NOT NULL,
          cargo_capacity_kg NUMERIC(8, 2) NOT NULL,
          available_capacity_kg NUMERIC(8, 2) NOT NULL,
          last_latitude DOUBLE PRECISION,
          last_longitude DOUBLE PRECISION,
          last_geom ${geomType},
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Route Master Transactions
      CREATE TABLE IF NOT EXISTS route_transactions (
          id BIGSERIAL PRIMARY KEY,
          logical_route_id VARCHAR(100) NOT NULL,
          version INT NOT NULL DEFAULT 1,
          operator_id BIGINT NOT NULL REFERENCES users(id),
          origin_terminal VARCHAR(255) NOT NULL,
          origin_geom ${geomType},
          destination_terminal VARCHAR(255) NOT NULL,
          destination_geom ${geomType},
          effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          effective_to TIMESTAMPTZ,
          is_latest BOOLEAN DEFAULT TRUE,
          status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'CANCELLED')),
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_route_logical_version UNIQUE (logical_route_id, version)
      );

      -- 4. Route Stops
      CREATE TABLE IF NOT EXISTS route_stops (
          id BIGSERIAL PRIMARY KEY,
          route_transaction_id BIGINT NOT NULL REFERENCES route_transactions(id) ON DELETE CASCADE,
          stop_name VARCHAR(255) NOT NULL,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          geom ${geomType},
          sequence_order INT NOT NULL,
          estimated_stop_offset_minutes INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. Capacity Slots
      CREATE TABLE IF NOT EXISTS capacity_slots (
          id BIGSERIAL PRIMARY KEY,
          operator_id BIGINT NOT NULL REFERENCES users(id),
          vehicle_id BIGINT NOT NULL REFERENCES vehicles(id),
          route_transaction_id BIGINT NOT NULL REFERENCES route_transactions(id),
          slot_date DATE NOT NULL,
          total_capacity_kg NUMERIC(8, 2) NOT NULL,
          available_weight_kg NUMERIC(8, 2) NOT NULL,
          reserved_weight_kg NUMERIC(8, 2) DEFAULT 0.0,
          version INT NOT NULL DEFAULT 1,
          status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'FULL', 'DEPARTED', 'CANCELLED')),
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- 6. Master Shipments
      CREATE TABLE IF NOT EXISTS shipments (
          id BIGSERIAL PRIMARY KEY,
          tracking_id VARCHAR(100) UNIQUE NOT NULL,
          operator_id BIGINT NOT NULL REFERENCES users(id),
          capacity_slot_id BIGINT REFERENCES capacity_slots(id),
          assigned_vehicle_id BIGINT REFERENCES vehicles(id),
          assigned_route_id BIGINT REFERENCES route_transactions(id),
          status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED', 'CANCELLED', 'DISPUTED')),
          version INT NOT NULL DEFAULT 1,
          sender_name VARCHAR(255) NOT NULL,
          sender_phone VARCHAR(50) NOT NULL,
          sender_address TEXT NOT NULL,
          recipient_name VARCHAR(255) NOT NULL,
          recipient_phone VARCHAR(50) NOT NULL,
          recipient_address TEXT NOT NULL,
          weight_kg NUMERIC(8, 2) NOT NULL,
          price NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
          qr_seal_code VARCHAR(100),
          qr_seal_tampered BOOLEAN DEFAULT FALSE,
          delivery_otp_hash VARCHAR(255),
          delivery_otp_salt VARCHAR(50),
          delivery_otp_verified BOOLEAN DEFAULT FALSE,
          pickup_geom ${geomType},
          delivery_geom ${geomType},
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- 7. Multi-Modal Shipment Legs
      CREATE TABLE IF NOT EXISTS shipment_legs (
          id BIGSERIAL PRIMARY KEY,
          shipment_id BIGINT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
          tracking_id VARCHAR(100) NOT NULL,
          leg_type VARCHAR(50) NOT NULL CHECK (leg_type IN ('PICKUP_LAST_MILE', 'TRANSIT', 'DELIVERY_LAST_MILE')),
          provider VARCHAR(50) NOT NULL,
          provider_dispatch_id VARCHAR(100),
          status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUOTED', 'DISPATCHED', 'COLLECTED', 'IN_TRANSIT', 'COMPLETED', 'EXCEPTION', 'CANCELLED')),
          pickup_address TEXT NOT NULL,
          pickup_geom ${geomType},
          dropoff_address TEXT NOT NULL,
          dropoff_geom ${geomType},
          price NUMERIC(10, 2) DEFAULT 0.0,
          estimated_arrival TIMESTAMPTZ,
          failure_reason TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- 8. Custody Handoffs
      CREATE TABLE IF NOT EXISTS custody_handoffs (
          id BIGSERIAL PRIMARY KEY,
          shipment_id BIGINT NOT NULL REFERENCES shipments(id),
          tracking_id VARCHAR(100) NOT NULL,
          from_user_id BIGINT REFERENCES users(id),
          to_user_id BIGINT REFERENCES users(id),
          from_role VARCHAR(50),
          to_role VARCHAR(50),
          qr_seal_code VARCHAR(100) NOT NULL,
          seal_status VARCHAR(50) NOT NULL DEFAULT 'INTACT' CHECK (seal_status IN ('INTACT', 'DAMAGED', 'TAMPERED', 'REPLACED')),
          handoff_type VARCHAR(50) NOT NULL,
          location_geom ${geomType},
          is_within_geofence BOOLEAN NOT NULL DEFAULT TRUE,
          distance_meters NUMERIC(8, 2),
          signature_url TEXT,
          photo_url TEXT,
          notes TEXT,
          handoff_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 9. Proof of Delivery
      CREATE TABLE IF NOT EXISTS proof_of_delivery (
          id BIGSERIAL PRIMARY KEY,
          shipment_id BIGINT UNIQUE NOT NULL REFERENCES shipments(id),
          tracking_id VARCHAR(100) NOT NULL,
          recipient_name VARCHAR(255) NOT NULL,
          recipient_phone VARCHAR(50) NOT NULL,
          otp_verified BOOLEAN NOT NULL DEFAULT TRUE,
          qr_seal_verified BOOLEAN NOT NULL DEFAULT TRUE,
          qr_seal_code VARCHAR(100) NOT NULL,
          signature_url TEXT,
          photo_url TEXT,
          location_geom ${geomType},
          geofence_validated BOOLEAN DEFAULT TRUE,
          delivered_by_user_id BIGINT REFERENCES users(id),
          delivered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 10. Ledger Entries
      CREATE TABLE IF NOT EXISTS ledger_entries (
          id BIGSERIAL PRIMARY KEY,
          shipment_id BIGINT NOT NULL REFERENCES shipments(id),
          tracking_id VARCHAR(100) NOT NULL,
          operator_id BIGINT NOT NULL REFERENCES users(id),
          entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('SHIPMENT_REVENUE', 'OPERATOR_EARNING', 'PARTNER_COMMISSION', 'PLATFORM_FEE', 'REFUND', 'DISPUTE_ADJUSTMENT')),
          amount NUMERIC(12, 2) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'INR',
          debit_account VARCHAR(100) NOT NULL,
          credit_account VARCHAR(100) NOT NULL,
          description TEXT,
          posted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 11. Transaction Snapshots
      CREATE TABLE IF NOT EXISTS transaction_snapshots (
          id BIGSERIAL PRIMARY KEY,
          shipment_id BIGINT UNIQUE NOT NULL REFERENCES shipments(id),
          tracking_id VARCHAR(100) NOT NULL,
          operator_id BIGINT NOT NULL REFERENCES users(id),
          final_version INT NOT NULL,
          final_status VARCHAR(50) NOT NULL,
          snapshot_data JSONB NOT NULL,
          proof_of_delivery_data JSONB,
          total_handoff_count INT DEFAULT 0,
          snapshot_hash VARCHAR(64) NOT NULL,
          closed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 12. Spatial Vehicle Telemetry
      CREATE TABLE IF NOT EXISTS vehicle_telemetry (
          id BIGSERIAL PRIMARY KEY,
          vehicle_id VARCHAR(100) NOT NULL,
          operator_id VARCHAR(100) NOT NULL,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          geom ${geomType},
          speed_kmh NUMERIC(6, 2) DEFAULT 0.0,
          heading NUMERIC(5, 2) DEFAULT 0.0,
          altitude NUMERIC(7, 2),
          accuracy_meters NUMERIC(6, 2),
          ping_timestamp TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await targetPool.query(ddl);
    
    // Safety migrations for existing database instances
    try {
      await targetPool.query(`
        ALTER TABLE route_transactions ALTER COLUMN origin_geom DROP NOT NULL;
        ALTER TABLE route_transactions ALTER COLUMN destination_geom DROP NOT NULL;
        ALTER TABLE route_stops ALTER COLUMN geom DROP NOT NULL;
        ALTER TABLE shipment_legs ALTER COLUMN pickup_geom DROP NOT NULL;
        ALTER TABLE shipment_legs ALTER COLUMN dropoff_geom DROP NOT NULL;
        ALTER TABLE custody_handoffs ALTER COLUMN location_geom DROP NOT NULL;
        ALTER TABLE proof_of_delivery ALTER COLUMN location_geom DROP NOT NULL;
      `);
    } catch (_) {}

    console.log('✔ Master Relational DDL applied successfully (16 tables created).');

    // 4. Seed Data
    console.log(`\n4. Seeding Initial Master Data...`);

    const seedUsers = `
      INSERT INTO users (id, name, email, phone, role, avatar_url, preferences) VALUES
      (1, 'Anmol', 'anmolrajotiy@gmail.com', '+91 7988342544', 'CUSTOMER', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzAACyzyleKmM4JQVt8Aa-jr70QVcpj9loY9wKp5o9O4E4p6Pw4_DrVmOHt4kkJfjfzprBQFcotrP67UIXwwodZ_N8y_NQMBXmYt1FUgmWEZU3RkLHv9mtX5_jewodrd3AC22FofPIl1pDv6bTKcqN63TR8-Ce6clfaRjIaxwp6CeKnOIoGAZdfBFJX_YfrWG4DCAk26zr7uiOS6j2JNkj4E16URTfm8orQCRZ5X_7hBMsGpV5UeKJ', '{"pushNotifications": true, "smsUpdates": true, "locationServices": true, "biometrics": false, "language": "English (US)"}'::jsonb),
      (2, 'Delhi Transport Corporation', 'operator@dtc.delhi.gov.in', '+911123456789', 'OPERATOR', NULL, '{}'::jsonb),
      (3, 'Aarav Sharma (Sender)', 'aarav.sharma@example.com', '+919876543210', 'CUSTOMER', NULL, '{}'::jsonb),
      (4, 'Rohan Verma (Recipient)', 'rohan.verma@example.com', '+919876543211', 'CUSTOMER', NULL, '{}'::jsonb),
      (5, 'Express Last-Mile Delivery Partners', 'partner@expresslogistics.in', '+919876543212', 'DELIVERY_PARTNER', NULL, '{}'::jsonb),
      (6, 'Rajesh Kumar (Bus Captain)', 'rajesh.driver@dtc.in', '+919876543213', 'DRIVER', NULL, '{}'::jsonb),
      (10, 'Haryana Roadways (State Transport)', 'contact@haryanaroadways.gov.in', '+911722704014', 'OPERATOR', NULL, '{}'::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        preferences = EXCLUDED.preferences;

      INSERT INTO saved_addresses (id, user_id, label, address_line, tag, is_default, latitude, longitude) VALUES
      (1, 1, 'Home (Flat 402)', 'House 402, Sector 17, Chandigarh, Punjab', 'home', TRUE, 30.7333, 76.7794),
      (2, 1, 'Work HQ (Office)', 'Alphaa Tech Hub, Cyber City Phase 2, Gurgaon, Haryana', 'work', FALSE, 28.4950, 77.0878),
      (3, 1, 'Transit Central Warehouse', 'Plot 88, Industrial Focal Point, Phase 8B, Mohali, Punjab', 'store', FALSE, 30.7046, 76.7089)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO payment_methods (id, user_id, type, card_name, card_last_four, card_expiry, upi_vpa, is_default) VALUES
      (1, 1, 'CARD', 'Anmol', '8831', '12/28', NULL, TRUE),
      (2, 1, 'UPI', 'Anmol', NULL, NULL, 'anmol@okhdfcbank', FALSE)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO vehicles (id, operator_id, registration, cargo_capacity_kg, available_capacity_kg, last_latitude, last_longitude) VALUES
      (1, 2, 'DL-01-AB-1234', 500.00, 420.00, 28.6320, 77.2180),
      (2, 2, 'DL-01-CD-5678', 600.00, 600.00, 28.6675, 77.2285),
      (101, 10, 'HR-68-A-1001', 500.00, 420.00, 28.6675, 77.2285),
      (102, 10, 'HR-68-A-1002', 500.00, 500.00, 28.6675, 77.2285)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO route_transactions (id, logical_route_id, version, operator_id, origin_terminal, destination_terminal, is_latest, status) VALUES
      (1, 'TR-DEL-JAI', 1, 2, 'ISBT Kashmere Gate, Delhi', 'Sindhi Camp Bus Stand, Jaipur', TRUE, 'ACTIVE'),
      (10, 'HR-DEL-CHD', 1, 10, 'ISBT Kashmiri Gate, Delhi', 'ISBT Sector 17, Chandigarh', TRUE, 'ACTIVE'),
      (11, 'HR-DEL-JAI', 1, 10, 'ISBT Kashmiri Gate, Delhi', 'Sindhi Camp, Jaipur', TRUE, 'ACTIVE'),
      (12, 'HR-DEL-SRS', 1, 10, 'ISBT Kashmiri Gate, Delhi', 'General Bus Stand, Sirsa', TRUE, 'ACTIVE')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO route_stops (route_transaction_id, stop_name, latitude, longitude, sequence_order, estimated_stop_offset_minutes) VALUES
      (10, 'ISBT Kashmiri Gate, Delhi', 28.6675, 77.2285, 1, 0),
      (10, 'Panipat Toll Plaza Hub', 29.3909, 76.9635, 2, 85),
      (10, 'Karnal Oasis Mid-Point', 29.6857, 76.9905, 3, 130),
      (10, 'Kurukshetra Pipli Chowk', 29.9695, 76.8783, 4, 175),
      (10, 'Ambala Cantt Junction ISBT', 30.3752, 76.7821, 5, 220),
      (10, 'ISBT Sector 17, Chandigarh', 30.7398, 76.7827, 6, 270)
      ON CONFLICT DO NOTHING;

      INSERT INTO capacity_slots (id, operator_id, vehicle_id, route_transaction_id, slot_date, total_capacity_kg, available_weight_kg, reserved_weight_kg, version, status) VALUES
      (1, 2, 1, 1, CURRENT_DATE, 500.00, 420.00, 80.00, 2, 'AVAILABLE'),
      (101, 10, 101, 10, CURRENT_DATE, 500.00, 420.00, 80.00, 2, 'AVAILABLE')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO shipments (
          id, tracking_id, operator_id, capacity_slot_id, assigned_vehicle_id, assigned_route_id,
          status, version, sender_name, sender_phone, sender_address,
          recipient_name, recipient_phone, recipient_address,
          weight_kg, price, qr_seal_code, qr_seal_tampered
      ) VALUES (
          1, 'TRK-88219', 10, 101, 101, 10,
          'IN_TRANSIT', 3, 'Anmol', '+91 7988342544', 'Connaught Place, New Delhi',
          'Rohan Verma', '+919876543211', 'Sector 17, Chandigarh',
          15.00, 450.00, 'SEAL-8F3A-9B21-4C10', FALSE
      ),
      (
          2, 'TRK-60912', 2, 1, 1, 1,
          'DELIVERED', 5, 'Anmol', '+91 7988342544', 'Cyber City, Gurgaon',
          'Priya Sharma', '+919876543212', '124 Maple Street, Jaipur',
          5.00, 12.50, 'SEAL-7712-4410-1120', FALSE
      ) ON CONFLICT (id) DO NOTHING;

      INSERT INTO shipment_legs (id, shipment_id, tracking_id, leg_type, provider, status, pickup_address, dropoff_address, price) VALUES
      (1, 1, 'TRK-88219', 'PICKUP_LAST_MILE', 'UBER_DIRECT', 'COMPLETED', 'Connaught Place, New Delhi', 'ISBT Kashmiri Gate, Delhi', 85.00),
      (2, 1, 'TRK-88219', 'TRANSIT', 'HARYANA_ROADWAYS', 'IN_TRANSIT', 'ISBT Kashmiri Gate, Delhi', 'ISBT Sector 17, Chandigarh', 280.00),
      (3, 1, 'TRK-88219', 'DELIVERY_LAST_MILE', 'RAPIDO', 'QUOTED', 'ISBT Sector 17, Chandigarh', 'Sector 17, Chandigarh', 85.00)
      ON CONFLICT (id) DO NOTHING;
    `;

    await targetPool.query(seedUsers);
    console.log('✔ Master seed data loaded into PostgreSQL.');

    console.log('\n======================================================');
    console.log('🎉 PostgreSQL Database Migration & Seeding COMPLETED!');
    console.log(`Connect via DBeaver:`);
    console.log(`  • Host:     ${host}`);
    console.log(`  • Port:     ${port}`);
    console.log(`  • Database: ${targetDb}`);
    console.log(`  • User:     ${user}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Database Initialization Failed:', err);
    process.exitCode = 1;
  } finally {
    await targetPool.end();
  }
};

if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase
};
