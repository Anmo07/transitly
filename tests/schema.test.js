const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Running Master Database Schema & SQL Verification Tests ===\n');

const schemaPath = path.join(__dirname, '../src/db/migrations/000_master_schema.sql');
const seedPath = path.join(__dirname, '../src/db/seeds/001_seed_master_data.sql');

assert.ok(fs.existsSync(schemaPath), 'Master schema SQL file must exist');
assert.ok(fs.existsSync(seedPath), 'Master seed SQL file must exist');

const schemaSql = fs.readFileSync(schemaPath, 'utf8');
const seedSql = fs.readFileSync(seedPath, 'utf8');

// 1. Verify PostGIS Extension
assert.match(schemaSql, /CREATE EXTENSION IF NOT EXISTS postgis;/i);
console.log('✔ PostGIS spatial extension declaration verified.');

// 2. Verify Essential Master Tables
const expectedTables = [
  'users',
  'vehicles',
  'route_transactions',
  'route_stops',
  'capacity_slots',
  'shipments',
  'shipment_legs',
  'custody_handoffs',
  'proof_of_delivery',
  'ledger_entries',
  'transaction_snapshots',
  'vehicle_telemetry'
];

for (const table of expectedTables) {
  const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`, 'i');
  assert.match(schemaSql, tableRegex, `Table '${table}' must be defined in master schema`);
}
console.log(`✔ All ${expectedTables.length} master tables defined in DDL.`);

// 3. Verify Spatial PostGIS Columns & GIST Indexes
assert.match(schemaSql, /geom GEOMETRY\(Point, 4326\)/i);
assert.match(schemaSql, /USING GIST\s*\(geom\)/i);
assert.match(schemaSql, /USING GIST\s*\(last_geom\)/i);
assert.match(schemaSql, /USING GIST\s*\(pickup_geom\)/i);
assert.match(schemaSql, /USING GIST\s*\(delivery_geom\)/i);
console.log('✔ PostGIS spatial geometry columns and GIST indexing verified.');

// 4. Verify OCP Route Versioning Constraints
assert.match(schemaSql, /CONSTRAINT uq_route_logical_version UNIQUE \(logical_route_id, version\)/i);
assert.match(schemaSql, /is_latest BOOLEAN DEFAULT TRUE/i);
console.log('✔ Open-Closed (OCP) route versioning constraints verified.');

// 5. Verify Sample Master Seed Data
assert.match(seedSql, /INSERT INTO users/i);
assert.match(seedSql, /INSERT INTO vehicles/i);
assert.match(seedSql, /INSERT INTO route_transactions/i);
assert.match(seedSql, /INSERT INTO route_stops/i);
assert.match(seedSql, /INSERT INTO shipments/i);
assert.match(seedSql, /INSERT INTO shipment_legs/i);
assert.match(seedSql, /INSERT INTO vehicle_telemetry/i);
console.log('✔ Master seed data entries verified.');

console.log('\nAll Master Database Schema tests passed successfully!');
