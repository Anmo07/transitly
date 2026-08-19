const crypto = require('crypto');
const Shipment = require('../models/Shipment');
const { TransactionStates } = require('../modules/bookings/stateMachine');
const capacityService = require('../modules/capacity/capacityService');
const pricingService = require('../modules/pricing/pricingService');
const bookingService = require('../modules/bookings/bookingService');
const notificationService = require('../modules/notifications/notificationService');
const whatsappService = require('../modules/whatsapp/whatsappService');
const { LastMileOrchestrator } = require('../modules/lastMile/lastMileOrchestrator');
const { generateOtp, hashOtp, generateQrSealCode } = require('../utils/security');
const { createEventEnvelope } = require('../events/eventEnvelope');
const { EventContracts } = require('../events/contracts');

/**
 * Booking Saga Orchestrator
 * Coordinates distributed multi-step transactions across Booking, Capacity, Pricing, Last-Mile, and Notification modules
 * with automatic compensation rollbacks on any intermediate failure.
 */
class BookingSaga {
  /**
   * Executes the Booking Saga end-to-end.
   * @param {Object} bookingRequest 
   * @returns {Promise<Object>} Completed booking result
   */
  async execute(bookingRequest) {
    const correlationId = crypto.randomUUID();
    let shipment = null;
    let capacityReserved = false;
    let reservedWeightKg = 0;
    let slotId = null;

    try {
      // 1. Generate Security Tokens (QR Seal & Recipient OTP)
      const qrSealCode = generateQrSealCode();
      const rawOtp = generateOtp(6);
      const otpSalt = crypto.randomBytes(8).toString('hex');
      const otpHash = hashOtp(rawOtp, otpSalt);
      const trackingId = `TRK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // 2. Initialize Shipment in OPEN State
      shipment = await Shipment.create({
        trackingId,
        operatorId: bookingRequest.operatorId,
        sender: bookingRequest.sender,
        recipient: bookingRequest.recipient,
        dimensions: bookingRequest.dimensions,
        weight: bookingRequest.weightKg,
        price: 0, // Pending pricing calculation
        status: TransactionStates.OPEN,
        version: 1,
        capacitySlotId: bookingRequest.capacitySlotId,
        assignedVehicleId: bookingRequest.vehicleId,
        assignedRouteId: bookingRequest.routeId,
        qrSeal: {
          currentSealCode: qrSealCode,
          initialSealCode: qrSealCode,
          isTampered: false
        },
        deliveryOtp: {
          codeHash: otpHash,
          salt: otpSalt,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
          attempts: 0,
          verified: false
        },
        pickupGeofence: bookingRequest.pickupGeofence,
        deliveryGeofence: bookingRequest.deliveryGeofence
      });

      // 3. Step: Reserve Capacity with OCC
      slotId = bookingRequest.capacitySlotId;
      reservedWeightKg = bookingRequest.weightKg;
      await capacityService.reserveCapacity(
        slotId,
        reservedWeightKg,
        bookingRequest.expectedSlotVersion || 1
      );
      capacityReserved = true;

      // 4. Step: Dynamic Pricing Calculation
      const priceQuote = pricingService.calculatePrice({
        weightKg: bookingRequest.weightKg,
        distanceKm: bookingRequest.estimatedDistanceKm || 15,
        isPeak: bookingRequest.isPeak || false
      });

      // 5. Step: Optional Last-Mile Feasibility & Child Legs
      let lastMileLegs = [];
      if (bookingRequest.originTerminal && bookingRequest.destinationTerminal) {
        const feasibility = await LastMileOrchestrator.evaluateFeasibility({
          senderLocation: bookingRequest.pickupGeofence,
          receiverLocation: bookingRequest.deliveryGeofence,
          originTerminal: bookingRequest.originTerminal,
          destinationTerminal: bookingRequest.destinationTerminal,
          parcel: { weightKg: bookingRequest.weightKg, dimensions: bookingRequest.dimensions }
        });

        lastMileLegs = await LastMileOrchestrator.createShipmentLegs(
          shipment,
          feasibility,
          bookingRequest.originTerminal,
          bookingRequest.destinationTerminal
        );
      }

      // 6. Step: Transition to CONFIRMED using OCC
      shipment = await bookingService.transitionState(
        shipment._id,
        TransactionStates.CONFIRMED,
        1, // expected version after initialization
        { price: priceQuote.totalPrice }
      );

      // 7. Step: Dispatch Domain Event & Multi-channel Notifications
      const bookedEvent = createEventEnvelope(EventContracts.SHIPMENT_BOOKED, {
        shipmentId: shipment._id,
        trackingId: shipment.trackingId,
        qrSealCode,
        rawOtpForRecipient: rawOtp,
        price: priceQuote.totalPrice,
        status: shipment.status
      }, {
        operatorId: shipment.operatorId,
        correlationId
      });

      await notificationService.handleEvent(bookedEvent);

      // 8. Step: WhatsApp Automated Confirmation
      if (bookingRequest.recipient?.phone) {
        await whatsappService.sendTemplateMessage(
          bookingRequest.recipient.phone,
          'BOOKING_CONFIRMED',
          {
            recipientName: bookingRequest.recipient.name,
            trackingId: shipment.trackingId,
            routeName: bookingRequest.routeName || 'Intercity Express',
            eta: 'Today by 8:00 PM'
          }
        );
      }

      return {
        success: true,
        correlationId,
        shipment,
        lastMileLegs,
        qrSealCode,
        rawOtpForRecipient: rawOtp,
        priceQuote
      };

    } catch (error) {
      // -------------------------------------------------------------
      // Saga Compensating Actions (Rollback Phase)
      // -------------------------------------------------------------
      console.error(`Booking Saga failed for correlation ${correlationId}:`, error.message);

      // Compensation 1: Release reserved capacity if it was acquired
      if (capacityReserved && slotId) {
        try {
          await capacityService.releaseCapacity(slotId, reservedWeightKg);
          console.log(`[Saga Compensate] Capacity released for slot ${slotId}`);
        } catch (compError) {
          console.error(`[Saga Critical] Failed to compensate capacity release:`, compError.message);
        }
      }

      // Compensation 2: Mark shipment as CANCELLED
      if (shipment) {
        try {
          await Shipment.findByIdAndUpdate(shipment._id, {
            status: TransactionStates.CANCELLED,
            cancellationReason: `Saga Failure: ${error.message}`,
            $inc: { version: 1 }
          });
          console.log(`[Saga Compensate] Shipment ${shipment._id} marked CANCELLED`);
        } catch (compError) {
          console.error(`[Saga Critical] Failed to mark shipment cancelled:`, compError.message);
        }
      }

      throw new Error(`Booking Saga Failed: ${error.message}`);
    }
  }
}

module.exports = new BookingSaga();
