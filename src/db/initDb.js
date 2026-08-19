require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { pool, checkPostgresHealth } = require('../config/postgres');

/**
 * Master Database Initialization & Migration Runner
 * Ensures target database exists, enables PostGIS, applies DDL schema, and loads seed data.
 */
const initializeDatabase = async () => {
  console.log('=== Transitly Master Database Initialization ===\n');

  const targetDb = process.env.POSTGRES_DB || 'transitly_telemetry';
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || 'postgrespassword';
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);

  // 1. Connect to root postgres database to ensure target database exists
  console.log(`1. Ensuring database "${targetDb}" exists...`);
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
      console.log(`✔ Database "${targetDb}" already exists.`);
    }
  } catch (err) {
    console.warn('[Notice]', err.message);
  } finally {
    await rootPool.end();
  }

  // 2. Connect to target database and check PostGIS
  console.log(`\n2. Connecting to "${targetDb}" and verifying PostGIS...`);
  const targetPool = new Pool({
    host,
    port,
    user,
    password,
    database: targetDb
  });

  try {
    // Enable PostGIS
    await targetPool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    const health = await targetPool.query('SELECT PostGIS_Version() as postgis_version, NOW() as current_time');
    console.log(`✔ Connected. PostGIS Version: ${health.rows[0].postgis_version}`);

    // 3. Apply Master DDL Schema
    const schemaPath = path.join(__dirname, 'migrations', '000_master_schema.sql');
    console.log(`\n3. Applying Master DDL Schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await targetPool.query(schemaSql);
    console.log('✔ Master Schema DDL applied successfully (12 tables, indexes, and PostGIS geometries created).');

    // 4. Load All Seed Files in Sorted Order
    const seedsDir = path.join(__dirname, 'seeds');
    if (fs.existsSync(seedsDir)) {
      const seedFiles = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();
      for (const seedFile of seedFiles) {
        const seedPath = path.join(seedsDir, seedFile);
        console.log(`\n4. Seeding Sample Master Data from: ${seedFile}`);
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await targetPool.query(seedSql);
        console.log(`✔ Seeded: ${seedFile}`);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 Database migration & seeding completed successfully!');
    console.log(`Connect via DBeaver: host=localhost, port=5432, db=${targetDb}, user=${user}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Database Initialization Failed:', err.message);
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
