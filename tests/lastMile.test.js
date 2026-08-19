const assert = require('assert');
const { UberDirectAdapter } = require('../src/modules/lastMile/providerAdapter');
const {
  LastMileOrchestrator,
  CustomerExperienceType
} = require('../src/modules/lastMile/lastMileOrchestrator');

console.log('=== Running Last-Mile Orchestration Tests ===\n');

// 1. Test Provider Adapter Direct Logic
console.log('1. Testing Provider Adapter Constraints...');
const adapter = new UberDirectAdapter({ maxWeightKg: 20, maxRadiusKm: 25, operatingHours: { startHour: 0, endHour: 24 } });

const connaughtPlace = { latitude: 28.6315, longitude: 77.2167 };
const kashmereGateTerminal = { latitude: 28.6675, longitude: 77.2285, name: 'ISBT Kashmere Gate' }; // ~4km
const farAwayPoint = { latitude: 28.9845, longitude: 77.7064 }; // ~50km

// Serviceable check
adapter.checkServiceability(connaughtPlace, kashmereGateTerminal, { weightKg: 5 }).then((res) => {
  assert.strictEqual(res.serviceable, true, 'Short distance with light parcel should be serviceable');
  assert.ok(res.distanceKm > 0 && res.distanceKm < 10, 'Distance should be ~4-5km');
  console.log('✔ Serviceable check passed.');

  // Weight limit exceeded check
  return adapter.checkServiceability(connaughtPlace, kashmereGateTerminal, { weightKg: 35 });
}).then((res) => {
  assert.strictEqual(res.serviceable, false, 'Overweight parcel should fail');
  assert.match(res.reason, /exceeds vehicle suitability limit/);
  console.log('✔ Weight limit rejection check passed.');

  // Distance limit exceeded check
  return adapter.checkServiceability(connaughtPlace, farAwayPoint, { weightKg: 5 });
}).then((res) => {
  assert.strictEqual(res.serviceable, false, 'Long distance should fail');
  assert.match(res.reason, /exceeds maximum service radius/);
  console.log('✔ Distance limit rejection check passed.');

  // Outage check
  const outageAdapter = new UberDirectAdapter({ isOutage: true });
  return outageAdapter.checkServiceability(connaughtPlace, kashmereGateTerminal, { weightKg: 5 });
}).then((res) => {
  assert.strictEqual(res.serviceable, false);
  assert.match(res.reason, /temporary outage/);
  console.log('✔ Outage and weather condition check passed.');

  // 2. Test Customer Experience Matrix Determination
  console.log('\n2. Testing Customer Experience Matrix Logic...');

  // Scenario A: Both legs serviceable -> Full Door-to-Door
  const originTerminal = { latitude: 28.6675, longitude: 77.2285, name: 'Delhi Central Bus Terminal' };
  const destinationTerminal = { latitude: 26.9124, longitude: 75.7873, name: 'Jaipur Bus Terminal' };
  const senderNearOrigin = { latitude: 28.6500, longitude: 77.2200 };
  const receiverNearDest = { latitude: 26.9200, longitude: 75.7900 };

  return LastMileOrchestrator.evaluateFeasibility({
    senderLocation: senderNearOrigin,
    receiverLocation: receiverNearDest,
    originTerminal,
    destinationTerminal,
    parcel: { weightKg: 5 }
  });
}).then((result) => {
  assert.strictEqual(result.customerExperience, CustomerExperienceType.FULL_DOOR_TO_DOOR);
  assert.strictEqual(result.pickupLeg.isFeasible, true);
  assert.strictEqual(result.deliveryLeg.isFeasible, true);
  console.log('✔ Full Door-to-Door matrix scenario verified.');

  // Scenario B: Destination receiver is far in rural area -> Pickup to Terminal
  const receiverFarDest = { latitude: 27.5000, longitude: 76.8000 }; // >80km from destination terminal
  return LastMileOrchestrator.evaluateFeasibility({
    senderLocation: { latitude: 28.6500, longitude: 77.2200 },
    receiverLocation: receiverFarDest,
    originTerminal: { latitude: 28.6675, longitude: 77.2285, name: 'Delhi Central Bus Terminal' },
    destinationTerminal: { latitude: 26.9124, longitude: 75.7873, name: 'Jaipur Bus Terminal' },
    parcel: { weightKg: 5 }
  });
}).then((result) => {
  assert.strictEqual(result.customerExperience, CustomerExperienceType.PICKUP_TO_TERMINAL);
  assert.strictEqual(result.pickupLeg.isFeasible, true);
  assert.strictEqual(result.deliveryLeg.isFeasible, false);
  assert.match(result.deliveryLeg.fallbackMessage, /The recipient can collect the parcel from Jaipur Bus Terminal/);
  console.log('✔ Pickup-to-Terminal with fallback messaging verified.');

  console.log('\nAll Last-Mile Orchestration tests passed successfully!');
}).catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
