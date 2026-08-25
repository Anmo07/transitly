const { pool } = require('../config/postgres');

class RouteTransactionDAO {
  async findById(id) {
    try {
      const res = await pool.query('SELECT * FROM route_transactions WHERE id = $1', [id]);
      return res.rows[0] ? { _id: res.rows[0].id, ...res.rows[0] } : null;
    } catch (_) {
      return null;
    }
  }

  async find(query = {}) {
    try {
      const res = await pool.query('SELECT * FROM route_transactions ORDER BY id ASC');
      return res.rows.map(r => ({ _id: r.id, id: r.id, ...r }));
    } catch (_) {
      return [];
    }
  }
}

module.exports = new RouteTransactionDAO();
