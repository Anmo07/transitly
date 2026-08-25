const { pool, checkPostgresHealth } = require('./postgres');

/**
 * Transitly Master Database Connector (PostgreSQL + PostGIS)
 */
const connectDB = async () => {
  return await checkPostgresHealth();
};

module.exports = connectDB;
