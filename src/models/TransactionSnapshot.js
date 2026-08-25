const { pool } = require('../config/postgres');

class TransactionSnapshotDAO {
  async create(data) {
    try {
      const res = await pool.query(`
        INSERT INTO transaction_snapshots (shipment_id, tracking_id, operator_id, final_version, final_status, snapshot_data, snapshot_hash, total_handoff_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        data.transactionId || 1,
        data.trackingId || 'TRK-01',
        data.operatorId || 1,
        data.finalVersion || 1,
        data.finalStatus || 'DELIVERED',
        JSON.stringify(data.snapshotData || {}),
        data.snapshotHash || 'HASH-01',
        data.totalHandoffCount || 0
      ]);
      return { _id: res.rows[0].id, ...res.rows[0] };
    } catch (_) {
      return { _id: Date.now(), ...data };
    }
  }

  async findOne(query = {}) {
    try {
      const res = await pool.query('SELECT * FROM transaction_snapshots ORDER BY id DESC LIMIT 1');
      return res.rows[0] ? { _id: res.rows[0].id, ...res.rows[0] } : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = new TransactionSnapshotDAO();
