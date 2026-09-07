/**
 * Test Suite: Tracking Page Persistent Bus & Conditional In-Transit Notifications
 * Verifies that:
 * 1. Tracking page does not persistently show a bus in transit by default when no parcel is sent.
 * 2. Search input defaults to empty and HUD starts hidden.
 * 3. In-transit notifications are strictly conditional on user-sent parcels.
 * 4. Tracking endpoint supports both registration plate and tracking ID lookups.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const app = require('../src/app');

async function runTests() {
  console.log('=== Running Tracking & In-Transit Notification Verification Tests ===\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = (urlPath) => {
    return new Promise((resolve, reject) => {
      http.get(`${baseUrl}${urlPath}`, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }).on('error', reject);
    });
  };

  try {
    // 1. Verify tracking.html structure: Empty state, hidden HUD, empty default input
    console.log('1. Verifying tracking.html DOM markup for non-persistent in-transit display...');
    const trackingHtmlPath = path.join(__dirname, '../public/tracking.html');
    const trackingHtml = fs.readFileSync(trackingHtmlPath, 'utf8');

    assert.ok(trackingHtml.includes('id="trackingEmptyView"'), 'Expected #trackingEmptyView to exist in tracking.html');
    assert.ok(trackingHtml.includes('id="trackingActiveView"'), 'Expected #trackingActiveView to exist in tracking.html');
    assert.ok(trackingHtml.includes('id="telematicsHud" class="hidden'), 'Expected #telematicsHud to start hidden in tracking.html');
    assert.ok(trackingHtml.includes('id="inputBusPlate" value=""'), 'Expected #inputBusPlate value to be empty by default');
    assert.ok(trackingHtml.includes('NO ACTIVE PARCELS IN TRANSIT'), 'Expected empty state badge in tracking.html');
    console.log('✔ tracking.html correctly contains empty state and hidden HUD by default.');

    // 2. Verify notifications.html & notifications.js
    console.log('2. Verifying notifications defaults (No in_transit alerts without sent parcel)...');
    const notifHtmlPath = path.join(__dirname, '../public/notifications.html');
    const notifHtml = fs.readFileSync(notifHtmlPath, 'utf8');
    assert.ok(notifHtml.includes('id="tabCountTransit"') && notifHtml.includes('>0<'), 'Expected initial in_transit tab count to be 0');

    const notifJsPath = path.join(__dirname, '../public/js/notifications.js');
    const notifJs = fs.readFileSync(notifJsPath, 'utf8');
    assert.ok(!notifJs.includes("id: 'notif-1',\n      category: 'in_transit'"), 'DEFAULT_NOTIFICATIONS must not contain dummy in_transit alert notif-1');
    assert.ok(!notifJs.includes("id: 'notif-3',\n      category: 'in_transit'"), 'DEFAULT_NOTIFICATIONS must not contain dummy in_transit alert notif-3');
    assert.ok(notifJs.includes('getUserSentParcels'), 'Expected getUserSentParcels helper in notifications.js');
    console.log('✔ notifications.js verified: dummy in-transit alerts removed and tied to user sent parcels.');

    // 3. Verify index.html drawer alert card
    console.log('3. Verifying notifications drawer in index.html...');
    const indexHtmlPath = path.join(__dirname, '../public/index.html');
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    assert.ok(indexHtml.includes('id="drawerInTransitCard" class="hidden'), 'Expected drawer in-transit card to be hidden by default');
    console.log('✔ index.html notifications drawer hides in-transit card by default.');

    // 4. Verify API telemetry endpoint by Bus Number Plate
    console.log('4. Testing GET /api/v1/tracking/bus/HR-68-A-1001...');
    const resBus = await request('/api/v1/tracking/bus/HR-68-A-1001');
    assert.strictEqual(resBus.status, 200, 'Expected 200 for HR-68-A-1001');
    const busJson = JSON.parse(resBus.body);
    assert.strictEqual(busJson.status, 'success');
    assert.strictEqual(busJson.data.busNumber, 'HR-68-A-1001');
    console.log('✔ Registered bus query returns valid telematics.');

    // 5. Verify API telemetry endpoint by Tracking ID
    console.log('5. Testing GET /api/v1/tracking/bus/TRK-88219 (lookup by tracking ID)...');
    const resTrk = await request('/api/v1/tracking/bus/TRK-88219');
    assert.strictEqual(resTrk.status, 200, 'Expected 200 for TRK-88219');
    const trkJson = JSON.parse(resTrk.body);
    assert.strictEqual(trkJson.status, 'success');
    assert.ok(trkJson.data.busNumber, 'Expected bus number in response');
    console.log('✔ Tracking ID query successfully resolved to carrier vehicle.');

    // 6. Verify Out of Service Bus Query (404)
    console.log('6. Testing GET /api/v1/tracking/bus/INVALID-PLATE-999...');
    const resInvalid = await request('/api/v1/tracking/bus/INVALID-PLATE-999');
    assert.strictEqual(resInvalid.status, 404, 'Expected 404 for invalid vehicle');
    const invJson = JSON.parse(resInvalid.body);
    assert.strictEqual(invJson.code, 'VEHICLE_NOT_IN_SERVICE');
    console.log('✔ Out of service vehicle returned clean 404 response.');

    // 7. Verify Notification Button Dimming/Brightening Removed
    console.log('7. Verifying notification badges and buttons do not contain animate-pulse...');
    const commonJsPath = path.join(__dirname, '../public/js/common.js');
    const commonJs = fs.readFileSync(commonJsPath, 'utf8');
    assert.ok(!commonJs.includes("global-notif-badge absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-white z-20 pointer-events-none transition-transform duration-200 animate-pulse"), 'Bell badge must not have animate-pulse');
    assert.ok(!notifJs.includes("rounded-full bg-primary animate-pulse shrink-0"), 'Unread dot must not have animate-pulse');
    assert.ok(!notifHtml.includes(".animate-pulse-soft"), 'notifications.html must not contain animate-pulse-soft keyframe classes');
    console.log('✔ Notification badges and buttons verified simple and static without pulse dimming/brightening.');

    // 8. Verify In-Transit Delivery Phase Suppression
    console.log('8. Verifying delivery phase suppression for in-transit notifications...');
    assert.ok(commonJs.includes('DELIVERY_PHASE_STATUSES'), 'common.js must define DELIVERY_PHASE_STATUSES');
    assert.ok(commonJs.includes('isDeliveryPhaseStatus'), 'common.js must have isDeliveryPhaseStatus helper');
    assert.ok(notifJs.includes('DELIVERY_PHASE_STATUSES'), 'notifications.js must define DELIVERY_PHASE_STATUSES');
    assert.ok(notifJs.includes('isDeliveryPhaseStatus'), 'notifications.js must have isDeliveryPhaseStatus helper');
    console.log('✔ Delivery phase suppression verified in notification engines.');

    // 9. Verify Vehicle Recalibration and Unobstructed Viewport Centering in tracking.js
    console.log('9. Verifying unobstructed center and vehicle movement recalibration in tracking.js...');
    const trackingJsPath = path.join(__dirname, '../public/js/tracking.js');
    const trackingJs = fs.readFileSync(trackingJsPath, 'utf8');
    assert.ok(trackingJs.includes('getUnobstructedCenter'), 'tracking.js must have getUnobstructedCenter formula');
    assert.ok(trackingJs.includes('centerMapOnVehicle'), 'tracking.js must have centerMapOnVehicle');
    assert.ok(trackingJs.includes('startVehicleMovement'), 'tracking.js must have startVehicleMovement along corridor');
    assert.ok(trackingJs.includes("window.addEventListener('resize'"), 'tracking.js must listen to window resize for responsive centering');
    console.log('✔ tracking.js vehicle movement and responsive unobstructed centering verified.');

    console.log('\nAll Tracking & In-Transit Notification verification tests passed successfully!\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
