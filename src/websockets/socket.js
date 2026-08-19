const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // GPS location event ingestion routed through Fast Path engine
    socket.on('gps_update', async (data) => {
      try {
        const { telemetryFastPath } = require('../modules/tracking/telemetryFastPath');
        await telemetryFastPath.ingestTelemetryPing({
          vehicleId: data.vehicleId,
          operatorId: data.operatorId,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          speedKmh: data.speedKmh,
          heading: data.heading,
          altitude: data.altitude,
          accuracyMeters: data.accuracyMeters,
          timestamp: data.timestamp
        });

        // Broadcast to specific room for subscribed tracking clients
        io.to(`tracking_${data.vehicleId}`).emit(`tracking_${data.vehicleId}`, data);
      } catch (err) {
        socket.emit('error', { message: `GPS Ingestion Failed: ${err.message}` });
      }
    });

    socket.on('subscribe_tracking', (vehicleId) => {
      console.log(`Client ${socket.id} subscribed to tracking_${vehicleId}`);
      socket.join(`tracking_${vehicleId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIo
};
