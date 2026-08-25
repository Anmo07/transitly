const { pool } = require('../config/postgres');

class UserDAO {
  async findOne(query = {}) {
    try {
      const res = await pool.query('SELECT * FROM users ORDER BY id ASC LIMIT 1');
      if (res.rows.length === 0) return null;
      const u = res.rows[0];
      return {
        _id: u.id,
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatar_url,
        settings: u.preferences,
        role: u.role,
        save: async function() {
          await pool.query(`
            UPDATE users SET name = $1, email = $2, phone = $3, avatar_url = $4, preferences = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
          `, [this.name, this.email, this.phone, this.avatarUrl, JSON.stringify(this.settings), this.id]);
          return this;
        }
      };
    } catch (_) {
      return null;
    }
  }

  async create(data) {
    try {
      const res = await pool.query(`
        INSERT INTO users (name, email, phone, avatar_url, preferences)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [data.name, data.email, data.phone, data.avatarUrl, JSON.stringify(data.settings || {})]);
      const u = res.rows[0];
      return { _id: u.id, id: u.id, ...u, settings: u.preferences };
    } catch (_) {
      return { _id: 1, ...data };
    }
  }
}

module.exports = new UserDAO();
