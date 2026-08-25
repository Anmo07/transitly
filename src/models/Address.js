const { pool } = require('../config/postgres');

class AddressDAO {
  async find(query = {}) {
    try {
      const res = await pool.query('SELECT * FROM saved_addresses ORDER BY is_default DESC, id ASC');
      return res.rows.map(r => ({ _id: r.id, id: r.id, userId: r.user_id, label: r.label, addressLine: r.address_line, tag: r.tag, isDefault: r.is_default }));
    } catch (_) {
      return [];
    }
  }

  async insertMany(items) {
    const res = [];
    for (const item of items) {
      const r = await pool.query(`
        INSERT INTO saved_addresses (user_id, label, address_line, tag, is_default)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [item.userId || 1, item.label, item.addressLine, item.tag || 'home', item.isDefault || false]);
      res.push({ _id: r.rows[0].id, id: r.rows[0].id, ...r.rows[0] });
    }
    return res;
  }
}

module.exports = new AddressDAO();
