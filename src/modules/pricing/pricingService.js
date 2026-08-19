/**
 * Pricing Domain Service
 * Encapsulates dynamic pricing rules, distance calculations, weight tiers, and platform surcharges.
 */
class PricingService {
  /**
   * Calculates estimated shipment cost.
   * @param {{weightKg: number, distanceKm?: number, isPeak?: boolean}} params 
   * @returns {{basePrice: number, weightFee: number, peakMultiplier: number, totalPrice: number}}
   */
  calculatePrice({ weightKg, distanceKm = 10, isPeak = false }) {
    if (!weightKg || weightKg <= 0) {
      throw new Error('Invalid parcel weight for pricing calculation.');
    }

    const baseFare = 50; // Base fare in INR
    const ratePerKg = 15; // INR per kg
    const ratePerKm = 5;  // INR per km

    const weightFee = weightKg * ratePerKg;
    const distanceFee = distanceKm * ratePerKm;
    const subtotal = baseFare + weightFee + distanceFee;
    const peakMultiplier = isPeak ? 1.25 : 1.0;
    const totalPrice = Math.round(subtotal * peakMultiplier);

    return {
      baseFare,
      weightFee,
      distanceFee,
      peakMultiplier,
      totalPrice
    };
  }
}

module.exports = new PricingService();
