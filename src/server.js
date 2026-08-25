require('dotenv').config();
const http = require('http');
const app = require('./app');
const { checkPostgresHealth } = require('./config/postgres');
const { initializeSocket } = require('./websockets/socket');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

const startServer = async () => {
  try {
    const pgStatus = await checkPostgresHealth();
    if (pgStatus.healthy) {
      console.log(`[PostgreSQL + PostGIS] Connected successfully (PostGIS Version: ${pgStatus.postgisVersion})`);
    } else {
      console.log(`[PostgreSQL] Running in non-blocking mode: ${pgStatus.error || 'Offline fallback ready'}`);
    }

    server.listen(PORT, () => {
      console.log(`Transitly Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
