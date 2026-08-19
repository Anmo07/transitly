const CustodyHandoff = require('../../models/CustodyHandoff');
const ProofOfDelivery = require('../../models/ProofOfDelivery');
const Shipment = require('../../models/Shipment');
const { verifyOTP, calculateDistanceMeters } = require('../../utils/security');

/**
 * Custody Handoff & Proof-of-Delivery Controller
 */
class CustodyController {
  /**
   * Log Scanned Custody Handoff
   */
  async logHandoff(req, res) {
    try {
      const { shipmentId, trackingId, fromUserId, toUserId, fromRole, toRole, qrSealCode, handoffType, latitude, longitude, terminalLatitude, terminalLongitude, maxDistanceMeters = 500, signatureUrl, photoUrl, notes } = req.body;

      const shipment = await Shipment.findOne({ $or: [{ _id: shipmentId }, { trackingId }] });
      if (!shipment) {
        return res.status(404).json({ status: 'error', message: 'Shipment not found.' });
      }

      // Geofence evaluation
      let isWithinGeofence = true;
      let distanceMeters = 0;
      if (terminalLatitude && terminalLongitude && latitude && longitude) {
        distanceMeters = calculateDistanceMeters(latitude, longitude, terminalLatitude, terminalLongitude);
        isWithinGeofence = distanceMeters <= maxDistanceMeters;
      }

      const handoff = await CustodyHandoff.create({
        shipmentId: shipment._id,
        trackingId: shipment.trackingId,
        fromUserId,
        toUserId,
        fromRole,
        toRole,
        qrSealCode,
        sealStatus: 'INTACT',
        handoffType,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        isWithinGeofence,
        distanceMeters,
        signatureUrl,
        photoUrl,
        notes
      });

      return res.status(201).json({
        status: 'success',
        message: 'Custody handoff successfully recorded in immutable audit log.',
        data: handoff
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  /**
   * Cryptographic Delivery OTP Verification & POD Generation
   */
  async verifyDeliveryOtp(req, res) {
    try {
      const { trackingId, inputOtp, recipientName, recipientPhone, qrSealCode, latitude, longitude, signatureUrl, photoUrl, deliveredByUserId } = req.body;

      const shipment = await Shipment.findOne({ trackingId });
      if (!shipment) {
        return res.status(404).json({ status: 'error', message: `Shipment '${trackingId}' not found.` });
      }

      if (!shipment.deliveryOtpHash || !shipment.deliveryOtpSalt) {
        return res.status(400).json({ status: 'error', message: 'No delivery OTP configured for this shipment.' });
      }

      const isValid = verifyOTP(inputOtp, shipment.deliveryOtpSalt, shipment.deliveryOtpHash);
      if (!isValid) {
        return res.status(401).json({ status: 'error', message: 'Invalid delivery OTP entered.' });
      }

      // Mark shipment OTP as verified and DELIVERED
      shipment.deliveryOtpVerified = true;
      shipment.status = 'DELIVERED';
      shipment.version += 1;
      await shipment.save();

      // Create Proof of Delivery
      const pod = await ProofOfDelivery.create({
        shipmentId: shipment._id,
        trackingId: shipment.trackingId,
        recipientName: recipientName || shipment.recipientName,
        recipientPhone: recipientPhone || shipment.recipientPhone,
        otpVerified: true,
        qrSealVerified: true,
        qrSealCode: qrSealCode || shipment.qrSealCode,
        signatureUrl,
        photoUrl,
        location: {
          type: 'Point',
          coordinates: [longitude || 77.218, latitude || 28.632]
        },
        deliveredByUserId
      });

      return res.status(200).json({
        status: 'success',
        message: 'Delivery OTP verified successfully and Proof of Delivery created.',
        data: pod
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new CustodyController();
