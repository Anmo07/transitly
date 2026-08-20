const PaymentMethod = require('../../models/PaymentMethod');
const User = require('../../models/User');

class PaymentController {
  async listPaymentMethods(req, res) {
    try {
      let user = await User.findOne();
      if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

      let methods = await PaymentMethod.find({ userId: user._id }).sort({ createdAt: 1 });
      
      // Seed defaults if empty
      if (methods.length === 0) {
        methods = await PaymentMethod.insertMany([
          { userId: user._id, type: 'CARD', brand: 'Visa', cardNumber: '•••• 4242', expiry: '12/25', isDefault: true },
          { userId: user._id, type: 'UPI', brand: 'Google Pay', upiId: 'alex@okhdfcbank', isDefault: false },
          { userId: user._id, type: 'WALLET', brand: 'Paytm Wallet', cardNumber: 'Linked to +919876543210', isDefault: false }
        ]);
      }

      return res.status(200).json({ status: 'success', count: methods.length, data: methods });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  async createPaymentMethod(req, res) {
    try {
      const { type, brand, cardNumber, expiry, upiId, isDefault } = req.body;
      let user = await User.findOne();
      
      if (isDefault) {
        await PaymentMethod.updateMany({ userId: user._id }, { $set: { isDefault: false } });
      }

      const method = await PaymentMethod.create({
        userId: user._id,
        type: type || 'CARD',
        brand,
        cardNumber,
        expiry,
        upiId,
        isDefault: isDefault || false
      });

      return res.status(201).json({ status: 'success', data: method });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  async setDefault(req, res) {
    try {
      const { id } = req.params;
      let user = await User.findOne();

      await PaymentMethod.updateMany({ userId: user._id }, { $set: { isDefault: false } });
      
      const method = await PaymentMethod.findOneAndUpdate(
        { _id: id, userId: user._id },
        { isDefault: true },
        { new: true }
      );

      if (!method) return res.status(404).json({ status: 'error', message: 'Payment method not found' });

      return res.status(200).json({ status: 'success', data: method });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  async deletePaymentMethod(req, res) {
    try {
      const { id } = req.params;
      let user = await User.findOne();
      
      const method = await PaymentMethod.findOneAndDelete({ _id: id, userId: user._id });
      if (!method) return res.status(404).json({ status: 'error', message: 'Payment method not found' });

      return res.status(200).json({ status: 'success', message: 'Payment method deleted' });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new PaymentController();
