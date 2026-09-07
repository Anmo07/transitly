const { pool } = require('../config/postgres');

/**
 * In-memory fallback state for offline / testing environments
 */
const mockRiderState = {
  id: 1,
  userId: 11,
  isOnline: true,
  autoAccept: true,
  rating: 4.94,
  reviewCount: 240,
  acceptanceRate: 96.0,
  vehicleType: 'NIU NQi-Sport',
  vehicleIdCode: 'DX-412',
  batteryLevel: 82,
  batteryRangeKm: 46.0,
  helmetVerified: true,
  thermalBagReady: true,
  latitude: 28.6315,
  longitude: 77.2167,
  activeShift: {
    id: 1,
    shiftTimeFormatted: '4h 12m',
    loginTimeFormatted: '08:30 AM',
    todayTotal: 84.50,
    ordersCompleted: 8
  },
  demandHotspot: {
    name: 'Downtown Logistics Center',
    surgeBonus: '+15% Surge Bonus',
    surgeMultiplier: 1.15,
    requestsInQueue: 18
  },
  walletBalance: 148.50
};

class RiderModel {
  /**
   * Fetch comprehensive dashboard cockpit metrics
   */
  async getDashboard(riderId = 1) {
    try {
      // 1. Fetch Rider record
      const riderRes = await pool.query(`
        SELECT r.*, u.name as rider_name, u.phone as rider_phone
        FROM riders r
        JOIN users u ON u.id = r.user_id
        WHERE r.id = $1
      `, [riderId]);

      if (riderRes.rows.length === 0) {
        return mockRiderState;
      }

      const rider = riderRes.rows[0];

      // 2. Fetch Active Shift
      let shiftData = mockRiderState.activeShift;
      const shiftRes = await pool.query(`
        SELECT * FROM shifts 
        WHERE rider_id = $1 AND is_active = TRUE 
        ORDER BY started_at DESC LIMIT 1
      `, [riderId]);

      if (shiftRes.rows.length > 0) {
        const s = shiftRes.rows[0];
        const now = new Date();
        const start = new Date(s.started_at);
        const diffMs = Math.max(0, now - start);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        shiftData = {
          id: s.id,
          shiftTimeFormatted: `${hours}h ${mins}m`,
          loginTimeFormatted: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          todayTotal: parseFloat(s.total_earnings || 84.50),
          ordersCompleted: parseInt(s.completed_trips || 8, 10)
        };
      }

      // 3. Fetch Next Pickup Task
      const nextTaskRes = await pool.query(`
        SELECT * FROM parcel_orders
        WHERE assigned_rider_id = $1 AND status IN ('ACCEPTED', 'ARRIVED_PICKUP')
        ORDER BY id DESC LIMIT 1
      `, [riderId]);

      let nextTask = null;
      if (nextTaskRes.rows.length > 0) {
        const t = nextTaskRes.rows[0];
        nextTask = {
          id: t.id,
          trackingCode: t.tracking_code,
          pickupAddress: t.pickup_address,
          pickupHub: t.pickup_hub || 'Central Hub Terminal 4',
          subLocation: 'Bay 12, Level 2 • Gate B Secure Dock',
          packageType: t.package_type,
          weightKg: parseFloat(t.weight_kg),
          etaMinutes: 6,
          senderPhone: t.sender_phone
        };
      } else {
        // Fallback demo card if none actively assigned
        nextTask = {
          id: 2,
          trackingCode: '#TRZ-9921',
          pickupAddress: 'Central Hub Terminal 4, Bay 12, Level 2 • Gate B Secure Dock',
          pickupHub: 'Central Hub Terminal 4',
          subLocation: 'Bay 12, Level 2 • Gate B Secure Dock',
          packageType: 'Expedited Medic/Supply',
          weightKg: 1.8,
          etaMinutes: 6,
          senderPhone: '+15550192'
        };
      }

      // 4. Fetch Total Wallet Balance
      let balance = mockRiderState.walletBalance;
      const walletRes = await pool.query(`
        SELECT balance_after FROM wallet_ledgers 
        WHERE rider_id = $1 
        ORDER BY id DESC LIMIT 1
      `, [riderId]);
      if (walletRes.rows.length > 0) {
        balance = parseFloat(walletRes.rows[0].balance_after);
      }

      // 5. Fetch Recent Completed Deliveries
      const recentRes = await pool.query(`
        SELECT id, type, description, amount, status, created_at 
        FROM wallet_ledgers
        WHERE rider_id = $1 AND type IN ('FARE', 'TIP')
        ORDER BY id DESC LIMIT 5
      `, [riderId]);

      const recentDeliveries = recentRes.rows.map(row => ({
        id: row.id,
        title: row.description,
        amount: parseFloat(row.amount),
        type: row.type,
        status: 'Completed',
        createdAt: row.created_at
      }));

      return {
        id: rider.id,
        userId: rider.user_id,
        name: rider.rider_name || 'Rajesh Kumar',
        phone: rider.rider_phone || '+919988776655',
        isOnline: rider.is_online,
        autoAccept: rider.auto_accept,
        walletBalance: balance,
        rating: parseFloat(rider.rating),
        reviewCount: rider.review_count,
        acceptanceRate: parseFloat(rider.acceptance_rate),
        vehicle: {
          type: rider.vehicle_type,
          idCode: rider.vehicle_id_code,
          batteryLevel: rider.battery_level,
          batteryRangeKm: parseFloat(rider.battery_range_km),
          helmetVerified: true,
          thermalBagReady: true
        },
        shift: shiftData,
        demandHotspot: mockRiderState.demandHotspot,
        nextTask,
        recentDeliveries: recentDeliveries.length > 0 ? recentDeliveries : [
          { title: 'Oakwood Pharmacy', details: '0.6 kg Cold Chain • 24 mins ago', tip: 2.00, amount: 11.20, status: 'Completed' },
          { title: 'Riverside Office Park', details: '3.2 kg Documents • 1h 05m ago', amount: 9.50, status: 'Completed' }
        ]
      };
    } catch (err) {
      console.warn('[RiderModel.getDashboard fallback]:', err.message);
      return mockRiderState;
    }
  }

  /**
   * Toggle Driver Duty (Online / Offline) and Auto-Accept
   */
  async toggleDuty(riderId = 1, { isOnline, autoAccept }) {
    mockRiderState.isOnline = isOnline !== undefined ? Boolean(isOnline) : mockRiderState.isOnline;
    if (autoAccept !== undefined) {
      mockRiderState.autoAccept = Boolean(autoAccept);
    }

    try {
      const updates = [];
      const values = [];
      let idx = 1;

      if (isOnline !== undefined) {
        updates.push(`is_online = $${idx++}`);
        values.push(isOnline);
      }
      if (autoAccept !== undefined) {
        updates.push(`auto_accept = $${idx++}`);
        values.push(autoAccept);
      }

      values.push(riderId);
      const sql = `
        UPDATE riders 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $${idx} 
        RETURNING *
      `;
      const res = await pool.query(sql, values);
      return res.rows[0];
    } catch (err) {
      console.warn('[RiderModel.toggleDuty fallback]:', err.message);
      return {
        id: riderId,
        is_online: mockRiderState.isOnline,
        auto_accept: mockRiderState.autoAccept
      };
    }
  }

  /**
   * Update Rider GPS Location Ping
   */
  async updateLocation(riderId = 1, { latitude, longitude, speed, heading }) {
    mockRiderState.latitude = latitude;
    mockRiderState.longitude = longitude;

    try {
      const res = await pool.query(`
        UPDATE riders 
        SET latitude = $1, longitude = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [latitude, longitude, riderId]);
      return res.rows[0];
    } catch (err) {
      return { id: riderId, latitude, longitude };
    }
  }
}

module.exports = new RiderModel();
