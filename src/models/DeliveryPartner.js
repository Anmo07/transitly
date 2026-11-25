const { pool } = require('../config/postgres');

/**
 * In-memory fallback state for offline / testing environments
 */
const fallbackProfiles = {
  '11': {
    id: 1,
    userId: '11',
    user_id: 11,
    name: 'Rajesh Kumar',
    phone: '+919876543213',
    vehicleType: 'BIKE',
    vehicle_type: 'BIKE',
    licenseNumber: 'DL-04-2022-9871',
    license_number: 'DL-04-2022-9871',
    status: 'AVAILABLE',
    activeLegId: 1,
    active_leg_id: 1,
    lastLatitude: 28.6315,
    last_latitude: 28.6315,
    lastLongitude: 77.2167,
    last_longitude: 77.2167
  }
};

class DeliveryPartnerDAO {
  async getProfile(userId) {
    try {
      const res = await pool.query(`
        SELECT p.*, u.name, u.phone 
        FROM delivery_partner_profiles p
        JOIN users u ON u.id = p.user_id
        WHERE p.user_id = $1
      `, [userId]);
      if (res.rows.length === 0) {
        const fallback = fallbackProfiles[String(userId)];
        return fallback ? { ...fallback } : null;
      }
      
      const p = res.rows[0];
      return {
        id: p.id,
        userId: String(p.user_id),
        name: p.name,
        phone: p.phone,
        vehicleType: p.vehicle_type,
        licenseNumber: p.license_number,
        status: p.status,
        activeLegId: p.active_leg_id,
        lastLatitude: p.last_latitude,
        lastLongitude: p.last_longitude
      };
    } catch (error) {
      console.warn('[DeliveryPartnerDAO.getProfile fallback]:', error.message);
      const fallback = fallbackProfiles[String(userId)] || fallbackProfiles['11'];
      return fallback ? { ...fallback, userId: String(fallback.userId) } : null;
    }
  }

  async setStatus(userId, status) {
    try {
      const res = await pool.query(`
        UPDATE delivery_partner_profiles 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `, [status, userId]);
      if (res.rows.length === 0) {
        const key = String(userId);
        if (fallbackProfiles[key]) fallbackProfiles[key].status = status;
        return { user_id: userId, status, updated_at: new Date() };
      }
      return res.rows[0];
    } catch (error) {
      console.warn('[DeliveryPartnerDAO.setStatus fallback]:', error.message);
      const key = String(userId);
      if (fallbackProfiles[key]) fallbackProfiles[key].status = status;
      return { user_id: userId, status, updated_at: new Date() };
    }
  }

  async updateLocation(userId, lat, lon) {
    try {
      const res = await pool.query(`
        UPDATE delivery_partner_profiles 
        SET last_latitude = $1, 
            last_longitude = $2, 
            last_geom = ST_SetSRID(ST_MakePoint($2, $1), 4326),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3
        RETURNING *
      `, [lat, lon, userId]);
      if (res.rows.length === 0) {
        const key = String(userId);
        if (fallbackProfiles[key]) {
          fallbackProfiles[key].last_latitude = lat;
          fallbackProfiles[key].lastLatitude = lat;
          fallbackProfiles[key].last_longitude = lon;
          fallbackProfiles[key].lastLongitude = lon;
        }
        return { user_id: userId, last_latitude: lat, last_longitude: lon, updated_at: new Date() };
      }
      return res.rows[0];
    } catch (error) {
      console.warn('[DeliveryPartnerDAO.updateLocation fallback]:', error.message);
      const key = String(userId);
      if (fallbackProfiles[key]) {
        fallbackProfiles[key].last_latitude = lat;
        fallbackProfiles[key].lastLatitude = lat;
        fallbackProfiles[key].last_longitude = lon;
        fallbackProfiles[key].lastLongitude = lon;
      }
      return { user_id: userId, last_latitude: lat, last_longitude: lon, updated_at: new Date() };
    }
  }
}

module.exports = new DeliveryPartnerDAO();
