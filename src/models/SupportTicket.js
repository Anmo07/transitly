const { pool } = require('../config/postgres');

class SupportTicketDAO {
  async create(data) {
    try {
      const res = await pool.query(`
        INSERT INTO support_tickets (user_id, category, tracking_id, description, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [data.userId || 1, data.category || 'GENERAL', data.trackingId || null, data.message || data.description || 'Support Request', 'OPEN']);
      return { _id: res.rows[0].id, ...res.rows[0] };
    } catch (_) {
      return { _id: Date.now(), ...data };
    }
  }

  async find(query = {}) {
    try {
      const res = await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC');
      return res.rows.map(r => ({ _id: r.id, id: r.id, userId: r.user_id, category: r.category, trackingId: r.tracking_id, message: r.description, status: r.status }));
    } catch (_) {
      return [];
    }
  }
}

module.exports = new SupportTicketDAO();
