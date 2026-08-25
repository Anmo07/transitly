const { pool } = require('../config/postgres');

class PaymentMethodDAO {
  async find(query = {}) {
    try {
      const res = await pool.query('SELECT * FROM payment_methods ORDER BY is_default DESC, id ASC');
      return res.rows.map(r => ({ _id: r.id, id: r.id, userId: r.user_id, type: r.type, cardName: r.card_name, cardNumber: r.card_last_four, expiry: r.card_expiry, upiId: r.upi_vpa, isDefault: r.is_default }));
    } catch (_) {
      return [];
    }
  }

  async insertMany(items) {
    const res = [];
    for (const item of items) {
      const r = await pool.query(`
        INSERT INTO payment_methods (user_id, type, card_name, card_last_four, card_expiry, upi_vpa, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [item.userId || 1, item.type || 'CARD', item.brand || item.cardName || 'Card', item.cardNumber || '4242', item.expiry || '12/28', item.upiId || null, item.isDefault || false]);
      res.push({ _id: r.rows[0].id, id: r.rows[0].id, ...r.rows[0] });
    }
    return res;
  }
}

module.exports = new PaymentMethodDAO();
