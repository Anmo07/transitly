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

    // 1. Delivery Partner Real-Time Telemetry & Location Ping
    socket.on('rider:location_ping', async (data) => {
      try {
        const RiderModel = require('../models/RiderModel');
        const updated = await RiderModel.updateLocation(data.riderId || 1, {
          latitude: parseFloat(data.lat || data.latitude || 28.6315),
          longitude: parseFloat(data.lng || data.longitude || 77.2167),
          speed: data.speed,
          heading: data.heading
        });
        io.emit(`rider:location_${data.riderId || 1}`, {
          riderId: data.riderId || 1,
          lat: data.lat || data.latitude,
          lng: data.lng || data.longitude,
          speed: data.speed,
          heading: data.heading,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        socket.emit('error', { message: `Rider telemetry ping failed: ${err.message}` });
      }
    });

    // 2. Delivery Partner Duty Mode Toggle
    socket.on('rider:toggle_duty', async (data) => {
      try {
        const RiderModel = require('../models/RiderModel');
        const res = await RiderModel.toggleDuty(data.riderId || 1, {
          isOnline: data.isOnline,
          autoAccept: data.autoAccept
        });
        socket.emit('rider:duty_updated', {
          isOnline: res.is_online,
          autoAccept: res.auto_accept
        });
      } catch (err) {
        socket.emit('error', { message: `Duty toggle failed: ${err.message}` });
      }
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
