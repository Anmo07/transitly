const User = require('../../models/User');
const Shipment = require('../../models/Shipment');

class UserController {
  async getProfile(req, res) {
    try {
      // Mocking user auth for now - grabbing the first user or creating default
      let user = await User.findOne();
      if (!user) {
        user = await User.create({ 
          name: 'Alex Mitchell', 
          email: 'alex.mitchell@example.com', 
          phone: '+919876543210' 
        });
      }

      // Get stats
      const totalTrips = await Shipment.countDocuments({ 
        operatorId: user._id, 
        status: 'DELIVERED' 
      });
      const activeTrips = await Shipment.countDocuments({ 
        operatorId: user._id, 
        status: { $in: ['OPEN', 'CONFIRMED', 'IN_TRANSIT'] } 
      });

      return res.status(200).json({
        status: 'success',
        data: {
          user,
          stats: {
            totalTrips,
            activeTrips
          }
        }
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, email, phone } = req.body;
      let user = await User.findOne();
      
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }

      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      
      await user.save();

      return res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  async getSettings(req, res) {
    try {
      let user = await User.findOne();
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }
      return res.status(200).json({
        status: 'success',
        data: user.settings
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  async updateSettings(req, res) {
    try {
      const { pushNotifications, emailUpdates, locationServices, language } = req.body;
      let user = await User.findOne();
      
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }

      if (pushNotifications !== undefined) user.settings.pushNotifications = pushNotifications;
      if (emailUpdates !== undefined) user.settings.emailUpdates = emailUpdates;
      if (locationServices !== undefined) user.settings.locationServices = locationServices;
      if (language !== undefined) user.settings.language = language;

      await user.save();

      return res.status(200).json({
        status: 'success',
        data: user.settings
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new UserController();
