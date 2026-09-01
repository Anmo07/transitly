const { UberDirectAdapter } = require('./providerAdapter');
const ShipmentLeg = require('../../models/ShipmentLeg');

const CustomerExperienceType = {
  FULL_DOOR_TO_DOOR: 'FULL_DOOR_TO_DOOR',
  PICKUP_TO_TERMINAL: 'PICKUP_TO_TERMINAL',
  TERMINAL_TO_DELIVERY: 'TERMINAL_TO_DELIVERY',
  TERMINAL_ONLY: 'TERMINAL_ONLY'
};

/**
 * Last-Mile Orchestrator
 * Coordinates dual-geolocation feasibility checks, adapter provider queries,
 * customer experience determination, and parent-child leg lifecycles.
 */
class LastMileOrchestrator {
  constructor(adapters = [new UberDirectAdapter()]) {
    this.adapters = adapters;
  }

  /**
   * Evaluates pickup and delivery feasibility independently.
   * @param {Object} params 
   * @returns {Promise<Object>} Feasibility result & customer experience
   */
  async evaluateFeasibility({
    senderLocation,
    receiverLocation,
    originTerminal,
    destinationTerminal,
    parcel,
    timeWindow
  }) {
    // 1. Evaluate Sender Pickup Leg: Sender -> Origin Terminal
    const pickupLegEvaluation = await this._evaluateSingleLeg(
      senderLocation,
      originTerminal,
      parcel,
      timeWindow,
      'PICKUP_LAST_MILE',
      originTerminal.name
    );

    // 2. Evaluate Receiver Delivery Leg: Destination Terminal -> Receiver
    const deliveryLegEvaluation = await this._evaluateSingleLeg(
      destinationTerminal,
      receiverLocation,
      parcel,
      timeWindow,
      'DELIVERY_LAST_MILE',
      destinationTerminal.name
    );

    // 3. Determine Customer Experience Matrix
    let customerExperience;
    if (pickupLegEvaluation.isFeasible && deliveryLegEvaluation.isFeasible) {
      customerExperience = CustomerExperienceType.FULL_DOOR_TO_DOOR;
    } else if (pickupLegEvaluation.isFeasible && !deliveryLegEvaluation.isFeasible) {
      customerExperience = CustomerExperienceType.PICKUP_TO_TERMINAL;
    } else if (!pickupLegEvaluation.isFeasible && deliveryLegEvaluation.isFeasible) {
      customerExperience = CustomerExperienceType.TERMINAL_TO_DELIVERY;
    } else {
      customerExperience = CustomerExperienceType.TERMINAL_ONLY;
    }

    return {
      customerExperience,
      pickupLeg: pickupLegEvaluation,
      deliveryLeg: deliveryLegEvaluation
    };
  }

  /**
   * Helper to query available adapters for a specific leg.
   */
  async _evaluateSingleLeg(fromCoord, toCoord, parcel, timeWindow, legType, terminalName) {
    for (const adapter of this.adapters) {
      try {
        const check = await adapter.checkServiceability(fromCoord, toCoord, parcel, timeWindow);
        if (check.serviceable) {
          const quote = await adapter.createQuote(fromCoord, toCoord, parcel);
          return {
            isFeasible: true,
            provider: adapter.providerName,
            quote,
            fallbackMessage: null
          };
        }
      } catch (err) {
        // Fallback to next provider or mark unserviceable
      }
    }

    const fallbackAction =
      legType === 'PICKUP_LAST_MILE'
        ? `Door-to-door pickup is not currently available at your address. You can drop the parcel at ${terminalName || 'the origin bus terminal'}.`
        : `Home delivery is not currently available in the destination area. The recipient can collect the parcel from ${terminalName || 'the destination terminal'}.`;

    return {
      isFeasible: false,
      provider: 'UNAVAILABLE',
      quote: null,
      fallbackMessage: fallbackAction
    };
  }

  /**
   * Creates the child shipment legs in PostgreSQL for an accepted multi-modal shipment.
   */
  async createShipmentLegs(parentShipment, feasibilityResult, originTerminal, destinationTerminal) {
    const legs = [];

    // 1. Pickup Leg (if feasible and requested)
    if (feasibilityResult.pickupLeg.isFeasible) {
      legs.push({
        parentShipmentId: parentShipment._id,
        trackingId: parentShipment.trackingId,
        legType: 'PICKUP_LAST_MILE',
        provider: feasibilityResult.pickupLeg.provider,
        status: 'QUOTED',
        pickupLocation: {
          address: parentShipment.sender.address,
          latitude: parentShipment.pickupGeofence.latitude,
          longitude: parentShipment.pickupGeofence.longitude
        },
        dropoffLocation: {
          address: originTerminal.address || originTerminal.name,
          latitude: originTerminal.latitude,
          longitude: originTerminal.longitude
        },
        price: feasibilityResult.pickupLeg.quote.fee,
        quoteExpiresAt: feasibilityResult.pickupLeg.quote.expiresAt
      });
    }

    // 2. Intercity Transit Leg (Parent public transport route)
    legs.push({
      parentShipmentId: parentShipment._id,
      trackingId: parentShipment.trackingId,
      legType: 'TRANSIT',
      provider: 'PUBLIC_TRANSIT',
      status: 'PENDING',
      pickupLocation: {
        address: originTerminal.address || originTerminal.name,
        latitude: originTerminal.latitude,
        longitude: originTerminal.longitude
      },
      dropoffLocation: {
        address: destinationTerminal.address || destinationTerminal.name,
        latitude: destinationTerminal.latitude,
        longitude: destinationTerminal.longitude
      },
      price: parentShipment.price
    });

    // 3. Delivery Leg (if feasible and requested)
    if (feasibilityResult.deliveryLeg.isFeasible) {
      legs.push({
        parentShipmentId: parentShipment._id,
        trackingId: parentShipment.trackingId,
        legType: 'DELIVERY_LAST_MILE',
        provider: feasibilityResult.deliveryLeg.provider,
        status: 'QUOTED',
        pickupLocation: {
          address: destinationTerminal.address || destinationTerminal.name,
          latitude: destinationTerminal.latitude,
          longitude: destinationTerminal.longitude
        },
        dropoffLocation: {
          address: parentShipment.recipient.address,
          latitude: parentShipment.deliveryGeofence.latitude,
          longitude: parentShipment.deliveryGeofence.longitude
        },
        price: feasibilityResult.deliveryLeg.quote.fee,
        quoteExpiresAt: feasibilityResult.deliveryLeg.quote.expiresAt
      });
    }

    return await ShipmentLeg.insertMany(legs);
  }

  /**
   * Handles leg-level failure isolation.
   */
  async handleLegException(legId, reason) {
    const leg = await ShipmentLeg.findByIdAndUpdate(
      legId,
      {
        status: 'EXCEPTION',
        failureReason: reason
      },
      { new: true }
    );
    return leg;
  }
}

module.exports = {
  CustomerExperienceType,
  LastMileOrchestrator: new LastMileOrchestrator()
};
