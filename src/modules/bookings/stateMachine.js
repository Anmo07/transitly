/**
 * Explicit State Machine for Shipment Transactions
 */

const TransactionStates = {
  OPEN: 'OPEN',
  CONFIRMED: 'CONFIRMED',
  IN_TRANSIT: 'IN_TRANSIT',
  EXCEPTION: 'EXCEPTION',
  DELIVERED: 'DELIVERED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED'
};

const AllowedTransitions = {
  [TransactionStates.OPEN]: [
    TransactionStates.CONFIRMED,
    TransactionStates.CANCELLED
  ],
  [TransactionStates.CONFIRMED]: [
    TransactionStates.IN_TRANSIT,
    TransactionStates.CANCELLED
  ],
  [TransactionStates.IN_TRANSIT]: [
    TransactionStates.DELIVERED,
    TransactionStates.EXCEPTION
  ],
  [TransactionStates.EXCEPTION]: [
    TransactionStates.IN_TRANSIT,
    TransactionStates.CANCELLED
  ],
  [TransactionStates.DELIVERED]: [
    TransactionStates.CLOSED,
    TransactionStates.DISPUTED
  ],
  [TransactionStates.DISPUTED]: [
    TransactionStates.CLOSED
  ],
  [TransactionStates.CLOSED]: [], // Immutable terminal state
  [TransactionStates.CANCELLED]: [] // Terminal state
};

/**
 * Validates if a state transition is permitted.
 * @param {string} fromState 
 * @param {string} toState 
 * @returns {boolean}
 */
const canTransition = (fromState, toState) => {
  if (!fromState || !toState) return false;
  if (fromState === toState) return true;
  const allowed = AllowedTransitions[fromState];
  return !!(allowed && allowed.includes(toState));
};

/**
 * Asserts state transition or throws a descriptive Domain Error.
 * @param {string} fromState 
 * @param {string} toState 
 */
const assertTransition = (fromState, toState) => {
  if (fromState === TransactionStates.CLOSED) {
    throw new Error(`Forbidden: Closed transaction is immutable. Modifications must be made via linked adjustment transactions.`);
  }
  if (!canTransition(fromState, toState)) {
    throw new Error(`Invalid state transition from '${fromState}' to '${toState}'. Allowed targets: [${(AllowedTransitions[fromState] || []).join(', ')}]`);
  }
};

module.exports = {
  TransactionStates,
  AllowedTransitions,
  canTransition,
  assertTransition
};
