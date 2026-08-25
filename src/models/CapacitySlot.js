const { pool } = require('../config/postgres');

class CapacitySlotDAO {
  async findById(id) {
    try {
      const res = await pool.query('SELECT * FROM capacity_slots WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        _id: r.id,
        id: r.id,
        availableWeightKg: parseFloat(r.available_weight_kg),
        reservedWeightKg: parseFloat(r.reserved_weight_kg),
        version: r.version,
        status: r.status
      };
    } catch (_) {
      return null;
    }
  }

  async findOneAndUpdate(query, update, options = {}) {
    try {
      const id = query._id || query.id;
      const set = update.$set || update;
      const inc = update.$inc || {};

      const cur = await this.findById(id);
      if (!cur) return null;

      const newAvailable = set.availableWeightKg !== undefined ? set.availableWeightKg : (cur.availableWeightKg - (inc.reservedWeightKg || 0));
      const newReserved = set.reservedWeightKg !== undefined ? set.reservedWeightKg : (cur.reservedWeightKg + (inc.reservedWeightKg || 0));
      const newVersion = cur.version + (inc.version || 1);

      const res = await pool.query(`
        UPDATE capacity_slots
        SET available_weight_kg = $1, reserved_weight_kg = $2, version = $3
        WHERE id = $4
        RETURNING *
      `, [newAvailable, newReserved, newVersion, id]);

      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        _id: r.id,
        id: r.id,
        availableWeightKg: parseFloat(r.available_weight_kg),
        reservedWeightKg: parseFloat(r.reserved_weight_kg),
        version: r.version,
        status: r.status
      };
    } catch (_) {
      return { _id: query._id, ...update.$set };
    }
  }
}

module.exports = new CapacitySlotDAO();
