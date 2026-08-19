const assert = require('assert');
const {
  TransactionStates,
  canTransition,
  assertTransition
} = require('../src/modules/bookings/stateMachine');
const { EventContracts } = require('../src/events/contracts');
const { createEventEnvelope } = require('../src/events/eventEnvelope');
const pricingService = require('../src/modules/pricing/pricingService');
const settlementService = require('../src/modules/settlements/settlementService');

console.log('=== Running Enterprise Domain Architecture Tests ===\n');

// -------------------------------------------------------------
// 1. State Machine & Transition Rules Tests
// -------------------------------------------------------------
console.log('1. Testing State Machine Transition Rules...');

// Valid transitions
assert.strictEqual(canTransition(TransactionStates.OPEN, TransactionStates.CONFIRMED), true);
assert.strictEqual(canTransition(TransactionStates.CONFIRMED, TransactionStates.IN_TRANSIT), true);
assert.strictEqual(canTransition(TransactionStates.IN_TRANSIT, TransactionStates.DELIVERED), true);
assert.strictEqual(canTransition(TransactionStates.DELIVERED, TransactionStates.CLOSED), true);
assert.strictEqual(canTransition(TransactionStates.DELIVERED, TransactionStates.DISPUTED), true);

// Invalid transitions
assert.strictEqual(canTransition(TransactionStates.OPEN, TransactionStates.DELIVERED), false);
assert.strictEqual(canTransition(TransactionStates.CONFIRMED, TransactionStates.CLOSED), false);
assert.strictEqual(canTransition(TransactionStates.CLOSED, TransactionStates.IN_TRANSIT), false);

// Assertion throwing check
assert.throws(() => {
  assertTransition(TransactionStates.OPEN, TransactionStates.DELIVERED);
}, /Invalid state transition/);

assert.throws(() => {
  assertTransition(TransactionStates.CLOSED, TransactionStates.OPEN);
}, /Forbidden: Closed transaction is immutable/);

console.log('✔ State machine transition constraints verified successfully.');

// -------------------------------------------------------------
// 2. Versioned Event Envelope Tests
// -------------------------------------------------------------
console.log('\n2. Testing Event Contract Envelopes...');

const event = createEventEnvelope(
  EventContracts.SHIPMENT_BOOKED,
  { trackingId: 'TRK-TEST-1234', price: 250 },
  { operatorId: 'OP-001', correlationId: 'CORR-999' }
);

assert.ok(event.eventId, 'Event ID must be present');
assert.strictEqual(event.eventType, 'shipment.booked.v1');
assert.strictEqual(event.operatorId, 'OP-001');
assert.strictEqual(event.correlationId, 'CORR-999');
assert.strictEqual(event.payload.trackingId, 'TRK-TEST-1234');
console.log('✔ Event contract envelopes verified successfully.');

// -------------------------------------------------------------
// 3. Dynamic Pricing Domain Rules Tests
// -------------------------------------------------------------
console.log('\n3. Testing Dynamic Pricing Service...');

const standardQuote = pricingService.calculatePrice({ weightKg: 10, distanceKm: 20, isPeak: false });
// Base: 50 + Weight (10 * 15 = 150) + Distance (20 * 5 = 100) = 300
assert.strictEqual(standardQuote.totalPrice, 300, 'Standard price should be 300');

const peakQuote = pricingService.calculatePrice({ weightKg: 10, distanceKm: 20, isPeak: true });
// 300 * 1.25 = 375
assert.strictEqual(peakQuote.totalPrice, 375, 'Peak price should be 375 (1.25x multiplier)');

console.log('✔ Pricing domain calculations verified successfully.');

// -------------------------------------------------------------
// 4. Optimistic Concurrency Control Simulation
// -------------------------------------------------------------
console.log('\n4. Testing Optimistic Concurrency Control Pattern...');

// Simulated in-memory OCC store
let simulatedDbDoc = {
  _id: 'doc-123',
  status: TransactionStates.OPEN,
  version: 1,
  data: 'Initial'
};

const simulateOccUpdate = (id, expectedStatus, expectedVersion, updates) => {
  if (
    simulatedDbDoc._id === id &&
    simulatedDbDoc.status === expectedStatus &&
    simulatedDbDoc.version === expectedVersion
  ) {
    simulatedDbDoc = {
      ...simulatedDbDoc,
      ...updates,
      version: simulatedDbDoc.version + 1
    };
    return simulatedDbDoc;
  }
  return null; // Concurrency conflict
};

// First concurrent worker succeeds
const worker1Result = simulateOccUpdate('doc-123', TransactionStates.OPEN, 1, {
  status: TransactionStates.CONFIRMED
});
assert.ok(worker1Result, 'Worker 1 with correct version should succeed');
assert.strictEqual(worker1Result.version, 2);
assert.strictEqual(worker1Result.status, TransactionStates.CONFIRMED);

// Second concurrent worker with stale version 1 fails
const worker2Result = simulateOccUpdate('doc-123', TransactionStates.OPEN, 1, {
  status: TransactionStates.CANCELLED
});
assert.strictEqual(worker2Result, null, 'Worker 2 with stale expectedVersion must fail');

console.log('✔ Optimistic concurrency control (OCC) conflict rejection verified.');

// -------------------------------------------------------------
// 5. Saga Compensation Workflow Logic
// -------------------------------------------------------------
console.log('\n5. Testing Saga Compensation Pattern...');

class MockSaga {
  constructor() {
    this.compensationsExecuted = [];
  }

  async runWorkflow(shouldFailAtStep3 = false) {
    let capacityReserved = false;
    try {
      // Step 1: Init
      // Step 2: Reserve Capacity
      capacityReserved = true;

      // Step 3: Payment / Confirmation
      if (shouldFailAtStep3) {
        throw new Error('Payment Authorization Declined');
      }
      return { status: 'CONFIRMED' };
    } catch (err) {
      // Compensation
      if (capacityReserved) {
        this.compensationsExecuted.push('RELEASE_CAPACITY');
      }
      this.compensationsExecuted.push('CANCEL_TRANSACTION');
      return { status: 'CANCELLED', reason: err.message };
    }
  }
}

const failingSaga = new MockSaga();
failingSaga.runWorkflow(true).then((res) => {
  assert.strictEqual(res.status, 'CANCELLED');
  assert.deepStrictEqual(failingSaga.compensationsExecuted, [
    'RELEASE_CAPACITY',
    'CANCEL_TRANSACTION'
  ]);
  console.log('✔ Saga compensation rollback actions verified.');
  console.log('\nAll Enterprise Domain Architecture tests passed successfully!');
});
