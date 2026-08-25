const LedgerEntry = require('../../models/LedgerEntry');
const { createEventEnvelope } = require('../../events/eventEnvelope');
const { EventContracts } = require('../../events/contracts');

/**
 * Settlements Domain Service
 * Generates immutable double-entry ledger distributions for operators, delivery partners, and platform fees.
 */
class SettlementService {
  /**
   * Posts immutable settlement ledger entries upon transaction closure.
   * @param {Object} shipment - The closed shipment document
   * @returns {Promise<Array<Object>>} Generated ledger entries
   */
  async postClosureSettlement(shipment) {
    const totalAmount = shipment.price;
    const platformFeeRate = 0.15; // 15% platform commission
    const partnerFeeRate = 0.25;  // 25% last-mile delivery partner fee
    const operatorFeeRate = 0.60; // 60% bus transport operator share

    const platformFee = Math.round(totalAmount * platformFeeRate);
    const partnerFee = Math.round(totalAmount * partnerFeeRate);
    const operatorShare = totalAmount - platformFee - partnerFee;

    const entries = [
      // 1. Gross Revenue
      {
        transactionId: shipment._id,
        trackingId: shipment.trackingId,
        operatorId: shipment.operatorId,
        entryType: 'SHIPMENT_REVENUE',
        amount: totalAmount,
        debitAccount: 'CUSTOMER_RECEIVABLES',
        creditAccount: 'ESCROW_HOLDING',
        description: `Gross delivery revenue collected for tracking ${shipment.trackingId}`
      },
      // 2. Operator Share
      {
        transactionId: shipment._id,
        trackingId: shipment.trackingId,
        operatorId: shipment.operatorId,
        entryType: 'OPERATOR_EARNING',
        amount: operatorShare,
        debitAccount: 'ESCROW_HOLDING',
        creditAccount: `OPERATOR_PAYABLE_${shipment.operatorId}`,
        description: `Bus route cargo earnings for operator ${shipment.operatorId}`
      },
      // 3. Platform Fee
      {
        transactionId: shipment._id,
        trackingId: shipment.trackingId,
        operatorId: shipment.operatorId,
        entryType: 'PLATFORM_FEE',
        amount: platformFee,
        debitAccount: 'ESCROW_HOLDING',
        creditAccount: 'PLATFORM_REVENUE',
        description: `Transitly platform fee (15%)`
      }
    ];

    if (partnerFee > 0) {
      entries.push({
        transactionId: shipment._id,
        trackingId: shipment.trackingId,
        operatorId: shipment.operatorId,
        entryType: 'PARTNER_COMMISSION',
        amount: partnerFee,
        debitAccount: 'ESCROW_HOLDING',
        creditAccount: 'DELIVERY_PARTNER_PAYABLE',
        description: `Last-mile delivery commission`
      });
    }

    const savedEntries = await LedgerEntry.insertMany(entries);

    const event = createEventEnvelope(EventContracts.LEDGER_ENTRY_RECORDED, {
      transactionId: shipment._id,
      trackingId: shipment.trackingId,
      entryCount: savedEntries.length,
      grossAmount: totalAmount
    }, { operatorId: shipment.operatorId });

    return { entries: savedEntries, event };
  }
}

module.exports = new SettlementService();
