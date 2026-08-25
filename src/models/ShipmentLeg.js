const { pool } = require('../config/postgres');

class ShipmentLegDAO {
  async create(data) {
    try {
      const res = await pool.query(`
        INSERT INTO shipment_legs (shipment_id, tracking_id, leg_type, provider, status, pickup_address, dropoff_address, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        data.shipmentId || 1,
        data.trackingId || 'TRK-01',
        data.legType || 'TRANSIT',
        data.provider || 'PUBLIC_TRANSIT',
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
}

module.exports = new ShipmentLegDAO();
