const { pool } = require('../config/postgres');

class ShipmentLegDAO {
  async create(data) {
    try {
      const res = await pool.query(`
        INSERT INTO shipment_legs (shipment_id, tracking_id, leg_type, provider, rider_id, status, pickup_address, dropoff_address, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        data.shipmentId || 1,
        data.trackingId || 'TRK-01',
        data.legType || 'TRANSIT',
        data.provider || 'PUBLIC_TRANSIT',
        data.riderId || null,
        data.status || 'PENDING',
        data.pickup?.address || data.pickupAddress || 'Origin',
        data.dropoff?.address || data.dropoffAddress || 'Destination',
        data.price || 0
      ]);
      const row = res.rows[0];
      return { _id: row.id, id: row.id, ...row };
    } catch (_) {
      return { _id: Date.now(), ...data };
    }
  }

  async insertMany(legs) {
    const res = [];
    for (const leg of legs) {
      res.push(await this.create(leg));
    }
    return res;
  }

  async find(query = {}) {
    try {
      const res = await pool.query('SELECT * FROM shipment_legs ORDER BY id ASC');
      return res.rows;
    } catch (_) {
      return [];
    }
  }

  async findAssignedLegs(riderId) {
    try {
      const res = await pool.query(`
        SELECT l.*, s.sender_name, s.sender_phone, s.recipient_name, s.recipient_phone, s.weight_kg 
        FROM shipment_legs l
        JOIN shipments s ON s.id = l.shipment_id
        WHERE l.rider_id = $1 AND l.status NOT IN ('COMPLETED', 'CANCELLED', 'EXCEPTION')
        ORDER BY l.created_at ASC
      `, [riderId]);
      return res.rows;
    } catch (error) {
      console.error('Error fetching assigned legs for rider:', error);
      return [];
    }
  }
  
  async updateStatus(legId, status) {
    try {
      const res = await pool.query(`
        UPDATE shipment_legs 
        SET status = $1
        WHERE id = $2
        RETURNING *
      `, [status, legId]);
      return res.rows[0];
    } catch (error) {
      console.error('Error updating leg status:', error);
      return null;
    }
  }
}

module.exports = new ShipmentLegDAO();
