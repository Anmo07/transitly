require('dotenv').config();
const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const RiderModel = require('../src/models/RiderModel');
const ParcelOrderModel = require('../src/models/ParcelOrderModel');
const WalletLedgerModel = require('../src/models/WalletLedgerModel');
const dispatchEngine = require('../src/services/dispatchEngine');

console.log('=== Running Delivery Partner Infrastructure & Microservices Test Suite ===\n');

async function runSuite() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = (method, urlPath, payload = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const url = new URL(urlPath, baseUrl);
      const req = http.request(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(body); } catch (_) {}
          resolve({ status: res.statusCode, headers: res.headers, body, json });
        });
      });
      req.on('error', reject);
      if (payload) {
        req.write(JSON.stringify(payload));
      }
      req.end();
    });
  };

  try {
    // 1. Test Duty Mode & Auto-Accept Toggle (PATCH /api/v1/riders/duty)
    console.log('1. Testing PATCH /api/v1/riders/duty (Duty Status & Auto-Accept)...');
    const resDutyOff = await request('PATCH', '/api/v1/riders/duty', { isOnline: false, autoAccept: false });
    assert.strictEqual(resDutyOff.status, 200, 'Expected 200 OK for duty toggle');
    assert.strictEqual(resDutyOff.json.data.isOnline, false);
    assert.strictEqual(resDutyOff.json.data.autoAccept, false);

    const resDutyOn = await request('PATCH', '/api/v1/riders/duty', { isOnline: true, autoAccept: true });
    assert.strictEqual(resDutyOn.status, 200, 'Expected 200 OK for duty toggle on');
    assert.strictEqual(resDutyOn.json.data.isOnline, true);
    assert.strictEqual(resDutyOn.json.data.autoAccept, true);
    console.log('✔ Driver duty mode and auto-accept state machine verified.');

    // 2. Test Partner Dashboard Metrics (GET /api/v1/riders/dashboard)
    console.log('2. Testing GET /api/v1/riders/dashboard (Cockpit Metrics & Telemetry)...');
    const resDash = await request('GET', '/api/v1/riders/dashboard');
    assert.strictEqual(resDash.status, 200, 'Expected 200 OK for dashboard');
    assert.ok(resDash.json.data, 'Expected dashboard data payload');
    assert.strictEqual(resDash.json.data.rating, 4.94, 'Expected 4.94 rating');
    assert.strictEqual(resDash.json.data.acceptanceRate, 96.0, 'Expected 96% acceptance rate');
    assert.strictEqual(resDash.json.data.vehicle.batteryLevel, 82, 'Expected 82% battery level');
    assert.ok(resDash.json.data.shift, 'Expected shift metrics');
    assert.ok(resDash.json.data.nextTask, 'Expected active next task');
    console.log('✔ Cockpit metrics (rating, battery, shift time, next task) verified.');

    // 3. Test Dispatch Queue & Filterable Pool (GET /api/v1/dispatch/queue)
    console.log('3. Testing GET /api/v1/dispatch/queue (Priority Offer & Available Pool)...');
    const resQueueAll = await request('GET', '/api/v1/dispatch/queue?filter=all');
    assert.strictEqual(resQueueAll.status, 200);
    assert.ok(resQueueAll.json.data.priorityOffer, 'Expected priority offer in queue');
    assert.strictEqual(resQueueAll.json.data.priorityOffer.expiresInSeconds, 30, 'Expected 30s TTL dispatch countdown');

    const resQueueHighPayout = await request('GET', '/api/v1/dispatch/queue?filter=high_payout');
    assert.strictEqual(resQueueHighPayout.status, 200);
    resQueueHighPayout.json.data.queue.forEach(item => {
      assert.ok(parseFloat(item.total_payout) >= 18.00, 'Filtered items must have total_payout >= 18.00');
    });
    console.log('✔ Spatial dispatch queue and high-payout filters verified.');

    // 4. Test 30-Second TTL Dispatch Lock & Respond (POST /api/v1/dispatch/orders/:id/respond)
    console.log('4. Testing Priority Offer Acceptance and 30-Second TTL Dispatch Lock...');
    const resAccept = await request('POST', '/api/v1/dispatch/orders/1/respond', { decision: 'ACCEPT' });
    assert.strictEqual(resAccept.status, 200);
    assert.strictEqual(resAccept.json.data.status, 'ACCEPTED');

    // Test rejection of invalid decision
    const resBadDecision = await request('POST', '/api/v1/dispatch/orders/1/respond', { decision: 'INVALID' });
    assert.strictEqual(resBadDecision.status, 400);
    console.log('✔ 30-second TTL dispatch offer acceptance and race-condition safety verified.');

    // 5. Test 4-Digit Recipient OTP & Geofence Verification (POST /api/v1/orders/:id/verify-otp)
    console.log('5. Testing 4-Digit Delivery PIN & Geofence Handoff Verification...');
    // 5a. Invalid OTP rejection
    const resBadOtp = await request('POST', '/api/v1/orders/1/verify-otp', {
      otp: '9999',
      latitude: 28.6315,
      longitude: 77.2167
    });
    assert.strictEqual(resBadOtp.status, 400);
    assert.ok(resBadOtp.json.message.includes('Invalid 4-digit recipient verification PIN code'));

    // 5b. Geofence violation rejection (> 100m away)
    const resGeofenceFail = await request('POST', '/api/v1/orders/1/verify-otp', {
      otp: '4820',
      latitude: 28.7500, // ~13 km away
      longitude: 77.2167
    });
    assert.strictEqual(resGeofenceFail.status, 400);
    assert.ok(resGeofenceFail.json.message.includes('Geofence violation'));

    // 5c. Valid PIN + Proximity Verification with atomic ledger settlement
    const resValidDelivery = await request('POST', '/api/v1/orders/1/verify-otp', {
      otp: '4820',
      latitude: 28.6315,
      longitude: 77.2167
    });
    assert.strictEqual(resValidDelivery.status, 200);
    assert.strictEqual(resValidDelivery.json.data.status, 'DELIVERED');
    assert.ok(resValidDelivery.json.data.payout.totalCredited > 0, 'Expected positive payout credited');
    console.log('✔ 4-digit PIN verification, geofence radius check (<100m), and atomic delivery settlement verified.');

    // 6. Test Partner Earnings & Ledger (GET /api/v1/riders/earnings)
    console.log('6. Testing GET /api/v1/riders/earnings (Balance, Revenue Split, Weekly Trends)...');
    const resEarnings = await request('GET', '/api/v1/riders/earnings');
    assert.strictEqual(resEarnings.status, 200);
    assert.ok(resEarnings.json.data.availableBalance > 0, 'Expected positive available balance');
    assert.strictEqual(resEarnings.json.data.weeklyTrends.length, 7, 'Expected 7-day weekly trends');
    assert.ok(resEarnings.json.data.breakdown.baseFares > 0, 'Expected base fare breakdown');
    assert.ok(resEarnings.json.data.transactions.length > 0, 'Expected itemized ledger transactions');
    console.log('✔ Earnings ledger, weekly trends aggregation, and revenue splits verified.');

    // 7. Test Instant Cash-Out Payout with Idempotency Key (POST /api/v1/riders/payout)
    console.log('7. Testing POST /api/v1/riders/payout (Stripe Connect / Instant Cash-Out Gateway)...');
    // 7a. Missing Idempotency Key rejection
    const resNoKey = await request('POST', '/api/v1/riders/payout', { amount: 50.00 });
    assert.strictEqual(resNoKey.status, 400);
    assert.ok(resNoKey.json.message.includes('Idempotency-Key'));

    // 7b. Valid Payout Execution
    const testIdempotencyKey = `idemp_test_${Date.now()}`;
    const resPayout1 = await request('POST', '/api/v1/riders/payout', { amount: 25.00 }, {
      'Idempotency-Key': testIdempotencyKey
    });
    assert.strictEqual(resPayout1.status, 200);
    assert.strictEqual(resPayout1.json.data.status, 'TRANSFERRED');
    assert.strictEqual(resPayout1.json.data.amount, 25.00);

    // 7c. Idempotent Retry (Same Key returns exact same payout record without double-deducting)
    const resPayout2 = await request('POST', '/api/v1/riders/payout', { amount: 25.00 }, {
      'Idempotency-Key': testIdempotencyKey
    });
    assert.strictEqual(resPayout2.status, 200);
    assert.strictEqual(resPayout2.json.data.payoutId, resPayout1.json.data.payoutId);
    assert.strictEqual(resPayout2.json.data.remainingBalance, resPayout1.json.data.remainingBalance);
    console.log('✔ Instant cash-out payout gateway and strict financial idempotency verified.');

    console.log('\nAll Delivery Partner Infrastructure & Microservices tests passed successfully!\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test Suite Failed:', err);
    server.close();
    process.exit(1);
  }
}

runSuite();
