const mongoose = require('mongoose');
const User = require('../../models/User');
const Shipment = require('../../models/Shipment');

let inMemoryUser = {
  _id: 'usr_default_01',
  name: 'Anmol',
  email: 'anmolrajotiy@gmail.com',
  phone: '+91 7988342544',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzAACyzyleKmM4JQVt8Aa-jr70QVcpj9loY9wKp5o9O4E4p6Pw4_DrVmOHt4kkJfjfzprBQFcotrP67UIXwwodZ_N8y_NQMBXmYt1FUgmWEZU3RkLHv9mtX5_jewodrd3AC22FofPIl1pDv6bTKcqN63TR8-Ce6clfaRjIaxwp6CeKnOIoGAZdfBFJX_YfrWG4DCAk26zr7uiOS6j2JNkj4E16URTfm8orQCRZ5X_7hBMsGpV5UeKJ',
  settings: {
    pushNotifications: true,
    emailUpdates: true,
    locationServices: true,
    language: 'English (US)'
  }
};

class UserController {
  async getProfile(req, res) {
    try {
      if (mongoose.connection.readyState === 1) {
        let user = await User.findOne();
        if (!user) {
          user = await User.create({ 
            name: inMemoryUser.name, 
            email: inMemoryUser.email, 
            phone: inMemoryUser.phone,
            avatarUrl: inMemoryUser.avatarUrl,
            settings: inMemoryUser.settings
          });
        }

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
            stats: { totalTrips, activeTrips }
          }
        });
      }
    } catch (_) {}

    // In-memory fallback
    return res.status(200).json({
      status: 'success',
      data: {
        user: inMemoryUser,
        stats: { totalTrips: 124, activeTrips: 3 }
      }
    });
  }

  async updateProfile(req, res) {
    try {
      const { name, email, phone, avatarUrl, avatar } = req.body;
      
      if (mongoose.connection.readyState === 1) {
        let user = await User.findOne();
        if (user) {
          user.name = name || user.name;
          user.email = email || user.email;
          user.phone = phone || user.phone;
          if (avatarUrl || avatar) {
            user.avatarUrl = avatarUrl || avatar;
          }
          await user.save();
          return res.status(200).json({ status: 'success', data: user });
        }
      }

      // Update in-memory fallback
      if (name) inMemoryUser.name = name;
      if (email) inMemoryUser.email = email;
      if (phone) inMemoryUser.phone = phone;
      if (avatarUrl || avatar) inMemoryUser.avatarUrl = avatarUrl || avatar;

      return res.status(200).json({
        status: 'success',
        data: inMemoryUser
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  async getSettings(req, res) {
    try {
      if (mongoose.connection.readyState === 1) {
        let user = await User.findOne();
        if (user && user.settings) {
          return res.status(200).json({
            status: 'success',
            data: user.settings
          });
        }
      }
    } catch (_) {}

    return res.status(200).json({
      status: 'success',
      data: inMemoryUser.settings
    });
  }

  async updateSettings(req, res) {
    try {
      const { pushNotifications, emailUpdates, locationServices, language } = req.body;

      if (mongoose.connection.readyState === 1) {
        let user = await User.findOne();
        if (user) {
          if (pushNotifications !== undefined) user.settings.pushNotifications = pushNotifications;
          if (emailUpdates !== undefined) user.settings.emailUpdates = emailUpdates;
          if (locationServices !== undefined) user.settings.locationServices = locationServices;
          if (language !== undefined) user.settings.language = language;
          await user.save();
          return res.status(200).json({ status: 'success', data: user.settings });
        }
      }

      if (pushNotifications !== undefined) inMemoryUser.settings.pushNotifications = pushNotifications;
      if (emailUpdates !== undefined) inMemoryUser.settings.emailUpdates = emailUpdates;
      if (locationServices !== undefined) inMemoryUser.settings.locationServices = locationServices;
      if (language !== undefined) inMemoryUser.settings.language = language;

      return res.status(200).json({
        status: 'success',
        data: inMemoryUser.settings
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new UserController();
