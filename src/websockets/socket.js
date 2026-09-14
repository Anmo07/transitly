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
        await RiderModel.updateLocation(data.riderId || 1, {
          latitude: parseFloat(data.lat || data.latitude || 28.6315),
          longitude: parseFloat(data.lng || data.longitude || 77.2167),
          speed: data.speed || 38,
          heading: data.heading || 45
        });

        const telemetryPayload = {
          riderId: data.riderId || 1,
          orderId: data.orderId || 1,
          trackingCode: data.trackingCode || '#TRZ-4820',
          lat: parseFloat(data.lat || data.latitude || 28.6315),
          lng: parseFloat(data.lng || data.longitude || 77.2167),
          speed: data.speed || 38,
          heading: data.heading || 45,
          distanceKm: data.distanceKm || 2.8,
          etaMinutes: data.etaMinutes || 11,
          timestamp: new Date().toISOString()
        };

        io.emit(`rider:location_${data.riderId || 1}`, telemetryPayload);
        io.emit('rider:location_updated', telemetryPayload);
      } catch (err) {
        socket.emit('error', { message: `Rider telemetry ping failed: ${err.message}` });
      }
    });

    // 2. Delivery Partner Disruption / Delay Alert
    socket.on('rider:disruption_report', (data) => {
      io.emit('rider:disruption_alert', {
        orderId: data.orderId || 1,
        trackingCode: data.trackingCode || '#TRZ-4820',
        issueType: data.issueType || 'Traffic Congestion',
        note: data.note || '',
        delayMinutes: data.delayMinutes || 15,
        ticketId: data.ticketId || `INC-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toISOString()
      });
    });

    // 3. Recipient & Partner In-Transit Messaging
    socket.on('chat:send_message', (data) => {
      io.emit(`chat:message_${data.orderId || 1}`, {
        sender: data.sender || 'RIDER',
        text: data.text,
        timestamp: new Date().toISOString()
      });
    });

    // 4. Delivery Partner Duty Mode Toggle
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
