/**
 * WhatsApp Notification Templates
 * Approved standard customer communications.
 */
const WhatsAppTemplates = {
  BOOKING_CONFIRMED: (data) =>
    `📦 *Booking Confirmed!*\nHi ${data.recipientName}, your parcel with Tracking ID *${data.trackingId}* has been booked on the ${data.routeName || 'Transitly Network'}.\nETA: ${data.eta || 'Same-day'}.`,

  RIDER_ASSIGNED_PICKUP: (data) =>
    `🛵 *Pickup Rider Assigned!*\nA partner rider has been assigned to collect your parcel from ${data.pickupAddress}. Arriving in approx. ${data.etaMinutes || 15} mins.`,

  PARCEL_ACCEPTED_ORIGIN: (data) =>
    `✅ *Parcel Accepted at Origin Terminal*\nYour parcel *${data.trackingId}* is verified with QR seal *${data.qrSealCode}* and loaded for transit at ${data.terminalName}.`,

  VEHICLE_DEPARTED: (data) =>
    `🚌 *In Transit!*\nPublic transport vehicle *${data.vehicleRegistration}* has departed with your parcel from ${data.originTerminal} towards ${data.destinationTerminal}.`,

  PARCEL_REACHED_DESTINATION: (data) =>
    `📍 *Arrived at Destination Terminal*\nYour parcel *${data.trackingId}* has safely arrived at ${data.destinationTerminal}.`,

  RIDER_ASSIGNED_DELIVERY: (data) =>
    `🛵 *Out for Final Delivery!*\nA delivery partner is en route to ${data.deliveryAddress}. Please keep your delivery OTP ready.`,

  DELIVERY_OTP_REQUIRED: (data) =>
    `🔐 *Delivery Verification OTP*\nYour one-time password for parcel *${data.trackingId}* is: *${data.otp}*.\nPlease share this code ONLY with the delivery partner upon parcel handover.`,

  PARCEL_DELIVERED: (data) =>
    `🎉 *Parcel Delivered!*\nYour parcel *${data.trackingId}* was successfully delivered to ${data.recipientName}. Thank you for using Transitly!`,

  DELIVERY_EXCEPTION: (data) =>
    `⚠️ *Delivery Update / Exception*\nWe could not complete home delivery for *${data.trackingId}* (${data.reason || 'Attempt failed'}). You can collect your parcel from *${data.terminalName}* or reply to reschedule.`
};

module.exports = {
  WhatsAppTemplates
};
