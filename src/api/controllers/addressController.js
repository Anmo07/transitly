const Address = require('../../models/Address');
const User = require('../../models/User');

class AddressController {
  async listAddresses(req, res) {
    try {
      let user = await User.findOne();
      if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

      let addresses = await Address.find({ userId: user._id }).sort({ createdAt: 1 });
      
      // Seed defaults if empty
      if (addresses.length === 0) {
        addresses = await Address.insertMany([
          { userId: user._id, label: 'Home', addressLine: '123 Elm Street, Springfield, IL 62701', tag: 'home', isDefault: true },
          { userId: user._id, label: 'Work', addressLine: '456 Tech Park, Building A, IL 62702', tag: 'work' },
          { userId: user._id, label: 'Gym', addressLine: '789 Fitness Blvd, Springfield, IL 62703', tag: 'fitness_center' },
          { userId: user._id, label: 'Favorite Cafe', addressLine: '101 Coffee Lane, Springfield, IL 62704', tag: 'local_cafe' }
        ]);
      }

      return res.status(200).json({ status: 'success', count: addresses.length, data: addresses });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  async createAddress(req, res) {
    try {
      const { label, addressLine, tag, isDefault } = req.body;
      let user = await User.findOne();
      
      if (isDefault) {
        await Address.updateMany({ userId: user._id }, { $set: { isDefault: false } });
      }

      const address = await Address.create({
        userId: user._id,
        label,
        addressLine,
        tag: tag || 'location_on',
        isDefault: isDefault || false
      });

      return res.status(201).json({ status: 'success', data: address });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  async updateAddress(req, res) {
    try {
      const { id } = req.params;
      const { label, addressLine, tag, isDefault } = req.body;
      let user = await User.findOne();

      if (isDefault) {
        await Address.updateMany({ userId: user._id }, { $set: { isDefault: false } });
      }

      const address = await Address.findOneAndUpdate(
        { _id: id, userId: user._id },
        { label, addressLine, tag, isDefault },
        { new: true }
      );

      if (!address) return res.status(404).json({ status: 'error', message: 'Address not found' });

      return res.status(200).json({ status: 'success', data: address });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  async deleteAddress(req, res) {
    try {
      const { id } = req.params;
      let user = await User.findOne();
      
      const address = await Address.findOneAndDelete({ _id: id, userId: user._id });
      if (!address) return res.status(404).json({ status: 'error', message: 'Address not found' });

      return res.status(200).json({ status: 'success', message: 'Address deleted' });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new AddressController();
