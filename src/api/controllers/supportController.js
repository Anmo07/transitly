const { pool } = require('../../config/postgres');

class SupportController {
  async listTickets(req, res) {
    try {
      const userRes = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
      const userId = userRes.rows[0]?.id || 1;

      const result = await pool.query(`
        SELECT id, user_id as "userId", category, tracking_id as "trackingId", description, status, created_at as "createdAt"
        FROM support_tickets
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);

      return res.status(200).json({
        status: 'success',
        count: result.rows.length,
        data: result.rows
      });
    } catch (err) {
      console.warn('[PostgreSQL Notice] listTickets fallback:', err.message);
      return res.status(200).json({
        status: 'success',
        count: 0,
        data: []
      });
    }
  }

  async createTicket(req, res) {
    try {
      const { category, trackingId, description, subject, message } = req.body;
      const userRes = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
      const userId = userRes.rows[0]?.id || 1;

      const desc = description || (subject ? `${subject}: ${message}` : message) || 'Support inquiry';

      const insertRes = await pool.query(`
        INSERT INTO support_tickets (user_id, category, tracking_id, description, status)
        VALUES ($1, $2, $3, $4, 'OPEN')
        RETURNING id, user_id as "userId", category, tracking_id as "trackingId", description, status, created_at as "createdAt"
      `, [userId, category || 'GENERAL', trackingId || null, desc]);

      const createdTicket = insertRes.rows[0];

      // Emit real-time WebSocket event to connected Admin Command Centers
      try {
        const { getIo } = require('../../websockets/socket');
        const io = getIo();

        const countRes = await pool.query("SELECT COUNT(*) as count FROM support_tickets WHERE status = 'OPEN'");
        const unresolvedCount = parseInt(countRes.rows[0]?.count || '1', 10);

        io.emit('new_support_ticket', {
          ticket: {
            id: createdTicket.id,
            category: createdTicket.category,
            tracking_id: createdTicket.trackingId,
            description: createdTicket.description,
            status: createdTicket.status,
            created_at: createdTicket.createdAt
          },
          unresolvedCount,
          timestamp: new Date().toISOString()
        });
      } catch (wsErr) {
        console.warn('[SupportController] WebSocket broadcast notice:', wsErr.message);
      }

      return res.status(201).json({ status: 'success', data: createdTicket });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new SupportController();
