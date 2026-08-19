const crypto = require('crypto');
const { calculateDistanceMeters } = require('../../utils/security');

/**
 * Base Provider Neutral Adapter Interface
 */
class BaseProviderAdapter {
  constructor(providerName) {
    this.providerName = providerName;
  }

  async checkServiceability(pickupCoord, dropoffCoord, parcel, timeWindow) {
    throw new Error('checkServiceability() must be implemented by adapter subclass.');
  }

  async createQuote(pickupCoord, dropoffCoord, parcel) {
    throw new Error('createQuote() must be implemented by adapter subclass.');
  }

  async confirmDispatch(quoteId, shipmentDetails) {
    throw new Error('confirmDispatch() must be implemented by adapter subclass.');
  }

  async trackDispatch(dispatchId) {
    throw new Error('trackDispatch() must be implemented by adapter subclass.');
  }

  async cancelDispatch(dispatchId, reason) {
    throw new Error('cancelDispatch() must be implemented by adapter subclass.');
  }

  async receiveWebhook(signature, payload) {
    throw new Error('receiveWebhook() must be implemented by adapter subclass.');
  }
}

/**
 * Uber Direct & Standard Last-Mile Logistics Adapter
 */
class UberDirectAdapter extends BaseProviderAdapter {
  constructor(options = {}) {
    super('UBER_DIRECT');
    this.maxWeightKg = options.maxWeightKg || 25;
    this.maxRadiusKm = options.maxRadiusKm || 30;
    this.operatingHours = options.operatingHours || { startHour: 0, endHour: 24 };
    this.serviceAreaPolygon = options.serviceAreaPolygon || null; // Optional GeoJSON
    this.isOutage = options.isOutage || false;
  }

  /**
   * Evaluates serviceability against distance, parcel weight, hours, and outages.
   */
  async checkServiceability(pickupCoord, dropoffCoord, parcel, timeWindow = {}) {
    if (this.isOutage) {
      return {
        serviceable: false,
        reason: 'Provider temporary outage or extreme weather restriction.'
      };
    }

    if (parcel.weightKg > this.maxWeightKg) {
      return {
        serviceable: false,
        reason: `Parcel weight (${parcel.weightKg}kg) exceeds vehicle suitability limit (${this.maxWeightKg}kg).`
      };
    }

    const currentHour = new Date().getHours();
    if (currentHour < this.operatingHours.startHour || currentHour >= this.operatingHours.endHour) {
      return {
        serviceable: false,
        reason: `Outside operational hours (${this.operatingHours.startHour}:00 - ${this.operatingHours.endHour}:00).`
      };
    }

    const distanceMeters = calculateDistanceMeters(
      pickupCoord.latitude,
      pickupCoord.longitude,
      dropoffCoord.latitude,
      dropoffCoord.longitude
    );
    const distanceKm = distanceMeters / 1000;

    if (distanceKm > this.maxRadiusKm) {
      return {
        serviceable: false,
        reason: `Distance (${distanceKm.toFixed(1)}km) exceeds maximum service radius (${this.maxRadiusKm}km).`
      };
    }

    return {
      serviceable: true,
      distanceKm: Math.round(distanceKm * 10) / 10,
      estimatedDurationMinutes: Math.round(distanceKm * 3.5 + 10)
    };
  }

  /**
   * Generates a binding quote.
   */
  async createQuote(pickupCoord, dropoffCoord, parcel) {
    const check = await this.checkServiceability(pickupCoord, dropoffCoord, parcel);
    if (!check.serviceable) {
      throw new Error(`Quote cannot be generated: ${check.reason}`);
    }

    const quoteId = `QUOTE-${this.providerName}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const baseFee = 40;
    const distanceFee = Math.round(check.distanceKm * 12);
    const weightFee = Math.round(parcel.weightKg * 5);
    const totalFee = baseFee + distanceFee + weightFee;

    return {
      quoteId,
      provider: this.providerName,
      fee: totalFee,
      currency: 'INR',
      distanceKm: check.distanceKm,
      estimatedDurationMinutes: check.estimatedDurationMinutes,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min validity
    };
  }

  /**
   * Confirms operational dispatch.
   */
  async confirmDispatch(quoteId, shipmentDetails) {
    const dispatchId = `DSP-${this.providerName}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    return {
      dispatchId,
      quoteId,
      status: 'DISPATCHED',
      riderName: 'Verified Partner Rider',
      riderPhone: '+919876543210',
      dispatchedAt: new Date(),
      etaMinutes: 25
    };
  }

  async trackDispatch(dispatchId) {
    return {
      dispatchId,
      status: 'IN_TRANSIT',
      estimatedArrival: new Date(Date.now() + 20 * 60 * 1000)
    };
  }

  async cancelDispatch(dispatchId, reason) {
    return {
      dispatchId,
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date()
    };
  }

  async receiveWebhook(signature, payload) {
    return {
      verified: true,
      event: payload.event,
      dispatchId: payload.dispatchId,
      status: payload.status
    };
  }
}

module.exports = {
  BaseProviderAdapter,
  UberDirectAdapter
};
