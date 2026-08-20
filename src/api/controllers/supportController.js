const SupportTicket = require('../../models/SupportTicket');
const User = require('../../models/User');

class SupportController {
  async listTickets(req, res) {
    try {
      let user = await User.findOne();
      if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

      const tickets = await SupportTicket.find({ userId: user._id }).sort({ createdAt: -1 });
      return res.status(200).json({ status: 'success', count: tickets.length, data: tickets });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  async createTicket(req, res) {
    try {
      const { name, email, phone, category, subject, message } = req.body;
      let user = await User.findOne();

      const ticket = await SupportTicket.create({
        userId: user ? user._id : undefined,
        name,
        email,
        phone,
        category: category || 'GENERAL',
        subject,
        message
      });

      return res.status(201).json({ status: 'success', data: ticket });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new SupportController();
