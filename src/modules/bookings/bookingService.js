const crypto = require('crypto');
const Shipment = require('../../models/Shipment');
const TransactionSnapshot = require('../../models/TransactionSnapshot');
const ProofOfDelivery = require('../../models/ProofOfDelivery');
const CustodyHandoff = require('../../models/CustodyHandoff');
const { TransactionStates, assertTransition } = require('./stateMachine');
const settlementService = require('../settlements/settlementService');
const { createEventEnvelope } = require('../../events/eventEnvelope');
const { EventContracts } = require('../../events/contracts');

/**
 * Booking Domain Service
 * Manages shipment transaction state machine, Optimistic Concurrency Control (OCC),
 * immutable transaction closing, and linked adjustment creation.
 */
class BookingService {
  /**
   * Transitions a shipment to a new state using Optimistic Concurrency Control.
   * @param {string} transactionId 
   * @param {string} targetStatus 
   * @param {number} expectedVersion 
   * @param {Object} [additionalUpdates={}] 
   * @returns {Promise<Object>} Updated shipment
   */
  async transitionState(transactionId, targetStatus, expectedVersion, additionalUpdates = {}) {
    const currentDoc = await Shipment.findById(transactionId);
    if (!currentDoc) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }

    // Validate state machine transition
    assertTransition(currentDoc.status, targetStatus);

    const updatePayload = {
      ...additionalUpdates,
      status: targetStatus
    };

    // Atomic OCC Update
    const updatedShipment = await Shipment.findOneAndUpdate(
      {
        _id: transactionId,
        status: currentDoc.status,
        version: expectedVersion
      },
      {
        $set: updatePayload,
        $inc: { version: 1 }
      },
      { new: true }
    );

    if (!updatedShipment) {
      throw new Error(`Concurrency Conflict: Unable to update transaction ${transactionId} to '${targetStatus}'. Expected version ${expectedVersion} has changed or status was concurrently modified.`);
    }

    return updatedShipment;
  }

  /**
   * Closes a delivered transaction, generating an immutable snapshot and settlement ledger entries.
   * @param {string} transactionId 
   * @param {number} expectedVersion 
   * @returns {Promise<Object>}
   */
  async closeTransaction(transactionId, expectedVersion) {
    const shipment = await Shipment.findById(transactionId);
    if (!shipment) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }

    if (shipment.status !== TransactionStates.DELIVERED) {
      throw new Error(`Cannot close transaction in state '${shipment.status}'. Must be in '${TransactionStates.DELIVERED}'.`);
    }

    // Transition to CLOSED using OCC
    const closedShipment = await this.transitionState(
      transactionId,
      TransactionStates.CLOSED,
      expectedVersion,
      { closedAt: new Date(), isSnapshotCreated: true }
    );

    // Collect proof of delivery & handoffs for the archive snapshot
    const pod = await ProofOfDelivery.findOne({ shipmentId: transactionId });
    const handoffCount = await CustodyHandoff.countDocuments({ shipmentId: transactionId });

    // Generate cryptographic hash of final state
    const snapshotRaw = JSON.stringify({ shipment: closedShipment, pod });
    const snapshotHash = crypto.createHash('sha256').update(snapshotRaw).digest('hex');

    // Write immutable transaction snapshot
    const snapshot = await TransactionSnapshot.create({
      transactionId: closedShipment._id,
      trackingId: closedShipment.trackingId,
      operatorId: closedShipment.operatorId,
      finalVersion: closedShipment.version,
      finalStatus: TransactionStates.CLOSED,
      snapshotData: closedShipment.toObject(),
      proofOfDelivery: pod ? pod.toObject() : null,
      totalHandoffCount: handoffCount,
      snapshotHash
    });

    // Post double-entry settlement entries to ledger
    const settlementResult = await settlementService.postClosureSettlement(closedShipment);

    const event = createEventEnvelope(EventContracts.TRANSACTION_CLOSED, {
      transactionId: closedShipment._id,
      trackingId: closedShipment.trackingId,
      finalVersion: closedShipment.version,
      snapshotId: snapshot._id,
      ledgerEntriesPosted: settlementResult.entries.length
    }, { operatorId: closedShipment.operatorId });

    return {
      shipment: closedShipment,
      snapshot,
      ledgerEntries: settlementResult.entries,
      event
    };
  }

  /**
   * Creates a linked adjustment/dispute transaction for a closed transaction.
   * Does NOT modify the closed record, preserving audit integrity.
   * @param {string} parentTransactionId 
   * @param {{adjustmentAmount: number, reason: string, createdBy: string}} params 
   * @returns {Promise<Object>} Linked adjustment transaction
   */
  async createAdjustmentTransaction(parentTransactionId, { adjustmentAmount, reason, createdBy }) {
    const parent = await Shipment.findById(parentTransactionId);
    if (!parent) {
      throw new Error(`Parent transaction ${parentTransactionId} not found.`);
    }

    if (parent.status !== TransactionStates.CLOSED) {
      throw new Error(`Adjustment transactions can only be created for CLOSED transactions.`);
    }

    const adjustmentTrackingId = `${parent.trackingId}-ADJ-${Date.now().toString().slice(-4)}`;

    const adjustmentShipment = await Shipment.create({
      trackingId: adjustmentTrackingId,
      operatorId: parent.operatorId,
      sender: parent.sender,
      recipient: parent.recipient,
      weight: parent.weight,
      price: adjustmentAmount,
      status: TransactionStates.CONFIRMED,
      parentTransactionId: parent._id,
      isAdjustment: true,
      disputeReason: reason,
      pickupGeofence: parent.pickupGeofence,
      deliveryGeofence: parent.deliveryGeofence
    });

    // Link parent to adjustment without changing closed status
    parent.linkedAdjustmentId = adjustmentShipment._id;
    await parent.save();

    const event = createEventEnvelope(EventContracts.ADJUSTMENT_CREATED, {
      parentTransactionId: parent._id,
      adjustmentTransactionId: adjustmentShipment._id,
      adjustmentAmount,
      reason
    }, { operatorId: parent.operatorId, userId: createdBy });

    return { adjustmentShipment, event };
  }
}

module.exports = new BookingService();
