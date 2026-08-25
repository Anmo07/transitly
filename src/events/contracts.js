/**
 * Versioned Domain Event Contracts
 */
const EventContracts = {
  // Booking & Lifecycle Events
  SHIPMENT_OPENED: 'shipment.opened.v1',
  SHIPMENT_BOOKED: 'shipment.booked.v1',
  SHIPMENT_CONFIRMED: 'shipment.confirmed.v1',
  SHIPMENT_IN_TRANSIT: 'shipment.in_transit.v1',
  SHIPMENT_DELIVERED: 'shipment.delivered.v1',
  SHIPMENT_CANCELLED: 'shipment.cancelled.v1',
  SHIPMENT_DISPUTED: 'shipment.disputed.v1',

  // Capacity Events
  CAPACITY_RESERVED: 'capacity.reserved.v1',
  CAPACITY_RELEASED: 'capacity.released.v1', // Compensation event
  CAPACITY_COMMITTED: 'capacity.committed.v1',

  // Custody & Handoff Events
  PARCEL_PICKED_UP: 'parcel.picked_up.v1',
  PARCEL_HANDED_OVER: 'parcel.handed_over.v1',
  QR_SEAL_VERIFIED: 'qr_seal.verified.v1',

  // Telematics & Tracking
  VEHICLE_LOCATION_RECEIVED: 'vehicle.location_received.v1',

  // Delivery Evidence & Verification
  DELIVERY_OTP_GENERATED: 'delivery.otp_generated.v1',
  DELIVERY_CONFIRMED: 'delivery.confirmed.v1',

  // Financial & Ledger Closures
  TRANSACTION_CLOSED: 'transaction.closed.v1',
  LEDGER_ENTRY_RECORDED: 'ledger.entry_recorded.v1',
  ADJUSTMENT_CREATED: 'transaction.adjustment_created.v1',

  // Last-Mile & Multi-Modal Routing Events
  LAST_MILE_FEASIBILITY_EVALUATED: 'last_mile.feasibility_evaluated.v1',
  LAST_MILE_LEG_DISPATCHED: 'last_mile.leg_dispatched.v1',
  LAST_MILE_LEG_EXCEPTION: 'last_mile.leg_exception.v1',

  // WhatsApp Notification Events
  WHATSAPP_NOTIFICATION_SENT: 'whatsapp.notification_sent.v1',
  WHATSAPP_INBOUND_RECEIVED: 'whatsapp.inbound_received.v1'
};

module.exports = {
  EventContracts
};
