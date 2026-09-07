const assert = require('assert');
const DeliveryPartner = require('../src/models/DeliveryPartner');
const ShipmentLeg = require('../src/models/ShipmentLeg');

console.log('=== Running Delivery Partner / Rider Workflow Tests ===\n');

async function runTests() {
  try {
    const riderId = 11; // Hardcoded in our seed data
    
    // 1. Test getting rider profile
    console.log('1. Testing Rider Profile Fetch...');
    const profile = await DeliveryPartner.getProfile(riderId);
    assert.ok(profile, 'Expected profile to be returned');
    assert.strictEqual(profile.userId, riderId.toString(), 'User ID mismatch');
    assert.strictEqual(profile.vehicleType, 'BIKE', 'Vehicle type mismatch');
    console.log('✔ Rider profile fetched successfully.');
    
    // 2. Test status update
    console.log('2. Testing Rider Status Update...');
    const updatedStatus = await DeliveryPartner.setStatus(riderId, 'ON_DELIVERY');
    assert.strictEqual(updatedStatus.status, 'ON_DELIVERY', 'Status was not updated');
    console.log('✔ Rider status updated successfully.');
    
    // 3. Test location update
    console.log('3. Testing Rider Location Update...');
    const updatedLoc = await DeliveryPartner.updateLocation(riderId, 28.5355, 77.3910);
    assert.strictEqual(updatedLoc.last_latitude, 28.5355, 'Latitude mismatch');
    console.log('✔ Rider location updated successfully.');
    
    // 4. Test getting assigned tasks
    console.log('4. Testing Fetching Assigned Tasks...');
    const tasks = await ShipmentLeg.findAssignedLegs(riderId);
    assert.ok(Array.isArray(tasks), 'Tasks should be an array');
    assert.ok(tasks.length > 0, 'Should have at least 1 assigned task');
    assert.strictEqual(tasks[0].tracking_id, 'TRK-88219', 'Tracking ID mismatch in task');
    console.log('✔ Assigned tasks fetched successfully.');
    
    // 5. Test updating task status
    console.log('5. Testing Task Status Update...');
    const taskId = tasks[0].id;
    const updatedLeg = await ShipmentLeg.updateStatus(taskId, 'COLLECTED');
    assert.strictEqual(updatedLeg.status, 'COLLECTED', 'Leg status mismatch');
    console.log('✔ Task status updated successfully.');

    console.log('\nAll Rider Workflow tests passed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
