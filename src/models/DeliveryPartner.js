const { pool } = require('../config/postgres');

class DeliveryPartnerDAO {
  async getProfile(userId) {
    try {
      const res = await pool.query(`
        SELECT p.*, u.name, u.phone 
        FROM delivery_partner_profiles p
        JOIN users u ON u.id = p.user_id
        WHERE p.user_id = $1
      `, [userId]);
      if (res.rows.length === 0) return null;
      
      const p = res.rows[0];
      return {
        id: p.id,
        userId: p.user_id,
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
      console.error('Error fetching delivery partner profile:', error);
      return null;
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
      return res.rows[0];
    } catch (error) {
      console.error('Error setting delivery partner status:', error);
      return null;
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
      return res.rows[0];
    } catch (error) {
      console.error('Error updating delivery partner location:', error);
      return null;
    }
  }
}

module.exports = new DeliveryPartnerDAO();
