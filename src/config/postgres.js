const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'transitly_telemetry',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
  max: parseInt(process.env.POSTGRES_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('[PostgreSQL/PostGIS] Client connected to slow path telemetry pool');
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err.message);
});

/**
 * Health check for the PostgreSQL database connection.
 */
const checkPostgresHealth = async () => {
  try {
    const res = await pool.query('SELECT NOW() as current_time, PostGIS_Version() as postgis_version');
    return {
      healthy: true,
      currentTime: res.rows[0].current_time,
      postgisVersion: res.rows[0].postgis_version
    };
  } catch (err) {
    return {
      healthy: false,
      error: err.message
    };
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  checkPostgresHealth
};
