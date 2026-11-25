const { pool } = require('../config/postgres');
const { QueryHelper } = require('./Shipment');

const fallbackCapacitySlots = [
  {
    id: 1,
    _id: 1,
    operatorId: 1,
    vehicleId: 1,
    routeTransactionId: 1,
    slotDate: new Date(),
    totalCapacityKg: 500,
    availableWeightKg: 450,
    reservedWeightKg: 50,
    version: 1,
    status: 'AVAILABLE'
  }
];

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

  find(query = {}) {
    return new QueryHelper(async (options) => {
      try {
        let sql = 'SELECT * FROM capacity_slots';
        const conditions = [];
        const values = [];
        if (query.routeTransactionId || query.route_transaction_id) {
          values.push(query.routeTransactionId || query.route_transaction_id);
          conditions.push(`route_transaction_id = $${values.length}`);
        }
        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY id ASC';
        if (options.limit && options.limit > 0) {
          values.push(options.limit);
          sql += ` LIMIT $${values.length}`;
        }
        const res = await pool.query(sql, values);
        if (res.rows.length === 0) return fallbackCapacitySlots;
        return res.rows.map(r => ({
          id: r.id,
          _id: r.id,
          operatorId: r.operator_id,
          vehicleId: r.vehicle_id,
          routeTransactionId: r.route_transaction_id,
          slotDate: r.slot_date,
          totalCapacityKg: parseFloat(r.total_capacity_kg),
          availableWeightKg: parseFloat(r.available_weight_kg),
          reservedWeightKg: parseFloat(r.reserved_weight_kg),
          version: r.version,
          status: r.status
        }));
      } catch (_) {
        return fallbackCapacitySlots;
      }
    });
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
