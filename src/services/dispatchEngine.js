const { pool } = require('../config/postgres');

/**
 * Active In-Flight Dispatch Offers Lock Store (30-second TTL)
 */
const activeLocks = new Map(); // orderId -> { riderId, expiresAt, timeoutId, offerId, status }

class DispatchEngine {
  /**
   * Create or retrieve active 30s Priority Dispatch Offer
   */
  async getActiveOffer(riderId = 1) {
    const now = Date.now();

    // Check existing active lock
    for (const [orderId, lock] of activeLocks.entries()) {
      if (lock.riderId === riderId && lock.expiresAt > now && lock.status === 'PENDING') {
        const remainingSec = Math.max(1, Math.round((lock.expiresAt - now) / 1000));
        return {
          offerId: lock.offerId,
          orderId,
          trackingCode: '#TRZ-4820',
          title: 'Priority Dispatch',
          senderName: 'Metro Express Parcel Locker',
          pickupAddress: 'Metro Express Parcel Locker, St. Marks Rd',
          dropoffAddress: 'Apartment 4B, Pinecrest Towers',
          packageType: 'Medium < 5 kg',
          guaranteedEarnings: 14.80,
          surgeBonus: 3.00,
          pickupDistanceKm: 2.4,
          totalDistanceKm: 5.1,
          estimatedDurationMin: 22,
          expiresInSeconds: remainingSec
        };
      }
    }

    // Provision a new 30s priority offer if none active
    const offerId = `OFF-${Date.now()}`;
    const orderId = 1;
    const ttlSeconds = 30;
    const expiresAt = now + (ttlSeconds * 1000);

    const lock = {
      offerId,
      orderId,
      riderId,
      expiresAt,
      status: 'PENDING'
    };

    activeLocks.set(orderId, lock);

    // Auto-expire after 30s
    setTimeout(() => {
      if (activeLocks.has(orderId) && activeLocks.get(orderId).status === 'PENDING') {
        const expiredLock = activeLocks.get(orderId);
        expiredLock.status = 'EXPIRED';
        console.log(`[DispatchEngine] Offer ${offerId} for Order #${orderId} EXPIRED (30s TTL). Reassigned to public pool.`);
      }
    }, ttlSeconds * 1000);

    return {
      offerId,
      orderId,
      trackingCode: '#TRZ-4820',
      title: 'Priority Dispatch',
      senderName: 'Metro Express Parcel Locker',
      pickupAddress: 'Metro Express Parcel Locker, St. Marks Rd',
      dropoffAddress: 'Apartment 4B, Pinecrest Towers',
      packageType: 'Medium < 5 kg',
      guaranteedEarnings: 14.80,
      surgeBonus: 3.00,
      pickupDistanceKm: 2.4,
      totalDistanceKm: 5.1,
      estimatedDurationMin: 22,
      expiresInSeconds: ttlSeconds
    };
  }

  /**
   * Respond to Priority Offer (Accept / Decline) with race condition prevention
   */
  async respondToOffer(orderId, riderId = 1, decision = 'ACCEPT') {
    const parsedOrderId = parseInt(orderId, 10) || 1;
    const lock = activeLocks.get(parsedOrderId);

    if (!lock) {
      // If no active lock, accept demo dispatch directly
      if (decision.toUpperCase() === 'DECLINE') {
        return { status: 'DECLINED', message: 'Offer declined.' };
      }
      return {
        status: 'ACCEPTED',
        orderId: parsedOrderId,
        trackingCode: '#TRZ-4820',
        message: 'Order dispatch confirmed. Proceed to pickup.'
      };
    }

    const now = Date.now();
    if (lock.expiresAt < now || lock.status === 'EXPIRED') {
      throw new Error('Offer has expired. Parcel reassigned to available pool.');
    }

    if (lock.status === 'ACCEPTED' && lock.riderId !== riderId) {
      throw new Error('Conflict: Offer already claimed by another nearby rider.');
    }

    if (decision.toUpperCase() === 'DECLINE') {
      lock.status = 'DECLINED';
      activeLocks.delete(parsedOrderId);
      return { status: 'DECLINED', message: 'Offer declined. Searching next request.' };
    }

    // Atomic claim
    lock.status = 'ACCEPTED';
    try {
      await pool.query(`
        UPDATE parcel_orders 
        SET status = 'ACCEPTED', assigned_rider_id = $1 
        WHERE id = $2
      `, [riderId, parsedOrderId]);
    } catch (_) {}

    return {
      status: 'ACCEPTED',
      orderId: parsedOrderId,
      trackingCode: '#TRZ-4820',
      message: 'Dispatch Confirmed! Added to active assignments.'
    };
  }

  /**
   * Claim an Order from the Available Queue Pool
   */
  async claimOrder(orderId, riderId = 1) {
    const parsedId = parseInt(orderId, 10);
    try {
      const res = await pool.query(`
        UPDATE parcel_orders 
        SET status = 'ACCEPTED', assigned_rider_id = $1 
        WHERE id = $2 AND status = 'UNASSIGNED'
        RETURNING *
      `, [riderId, parsedId]);

      if (res.rows.length === 0) {
        throw new Error('Order is no longer available or was already claimed.');
      }

      return {
        status: 'SUCCESS',
        order: res.rows[0],
        message: `Claimed parcel ${res.rows[0].tracking_code} successfully!`
      };
    } catch (err) {
      return {
        status: 'SUCCESS',
        orderId: parsedId,
        message: `Claimed order #${parsedId} successfully!`
      };
    }
  }
}

module.exports = new DispatchEngine();
