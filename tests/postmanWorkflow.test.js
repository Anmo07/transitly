const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- [Transitly Postman Workflow Verification Test] ---');

const collectionPath = path.join(__dirname, '..', 'docs', 'transitly_postman_collection.json');
const environmentPath = path.join(__dirname, '..', 'docs', 'transitly_postman_environment.json');

// 1. Verify existence of artifacts
assert.strictEqual(fs.existsSync(collectionPath), true, 'Postman collection JSON must exist');
assert.strictEqual(fs.existsSync(environmentPath), true, 'Postman environment JSON must exist');
console.log('✔ Artifact files exist in docs/');

// 2. Validate JSON syntax
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
const environment = JSON.parse(fs.readFileSync(environmentPath, 'utf8'));
console.log('✔ JSON syntax parsed successfully');

// 3. Verify Collection Schema and Metadata
assert.strictEqual(collection.info.name, 'Transitly Secure & Encrypted API Workflows');
assert.strictEqual(collection.info.schema, 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json');
assert.strictEqual(collection.auth.type, 'bearer');
console.log('✔ Postman v2.1.0 schema and Bearer auth verified');

// 4. Verify Folder Coverage
const expectedFolders = [
  '01. Authentication & Session Security',
  '02. Intercity Parcel Logistics & Sagas',
  '03. Delivery Partner Cockpit & Geofenced Dispatch',
  '04. Custody Transfer & 4-Digit PIN Handoff',
  '05. Financial Ledger & Idempotent Payouts',
  '06. Highway Telematics & PostGIS Routes',
  '07. Meta WhatsApp Assistant & Secure Webhooks'
];

assert.strictEqual(collection.item.length, 7, 'Must have exactly 7 domain folders');
collection.item.forEach((folder, idx) => {
  assert.strictEqual(folder.name, expectedFolders[idx], `Folder ${idx + 1} must match ${expectedFolders[idx]}`);
});
console.log('✔ All 7 domain folders verified in sequence');

// 5. Verify Request Count & Automation Scripts
let totalRequests = 0;
let requestsWithTests = 0;

collection.item.forEach(folder => {
  folder.item.forEach(req => {
    totalRequests++;
    if (req.event && req.event.some(e => e.listen === 'test')) {
      requestsWithTests++;
    }
  });
});

assert.strictEqual(totalRequests, 32, 'Must contain all 32 curated requests');
assert.strictEqual(requestsWithTests, 32, 'All 32 requests must have automated assertion test scripts');
console.log(`✔ Verified ${totalRequests} requests, 100% have automated test scripts`);

// 6. Verify Critical Security Workflow Features
// A. Token Chaining in Auth
const verifyOtpReq = collection.item[0].item.find(r => r.name.includes('Verify OTP'));
assert(verifyOtpReq, 'Verify OTP request must exist');
const verifyTestScript = verifyOtpReq.event.find(e => e.listen === 'test').script.exec.join('\n');
assert(verifyTestScript.includes('jwt_token'), 'Verify OTP must extract and store jwt_token');
console.log('✔ Verified automated JWT token chaining');

// B. Idempotency Key Injection
const payoutReq = collection.item[4].item.find(r => r.name.includes('Instant Payout'));
assert(payoutReq, 'Instant Payout request must exist');
const payoutPreScript = payoutReq.event.find(e => e.listen === 'prerequest').script.exec.join('\n');
assert(payoutPreScript.includes('idempotency_key'), 'Payout must dynamically generate idempotency_key');
console.log('✔ Verified dynamic idempotency key generation');

// C. Webhook Challenge Echo
const webhookReq = collection.item[6].item.find(r => r.name.includes('Meta Webhook Subscription'));
assert(webhookReq, 'Meta webhook request must exist');
const webhookTestScript = webhookReq.event.find(e => e.listen === 'test').script.exec.join('\n');
assert(webhookTestScript.includes('hub_challenge'), 'Webhook handshake must verify hub_challenge');
console.log('✔ Verified Meta webhook challenge validation');

// 7. Verify Environment Variables
assert.strictEqual(environment.name, 'Transitly Secure & Encrypted Environment');
const secretVars = environment.values.filter(v => v.type === 'secret');
assert(secretVars.some(v => v.key === 'jwt_token'), 'jwt_token must be a secret variable');
assert(secretVars.some(v => v.key === 'auth_otp'), 'auth_otp must be a secret variable');
assert(secretVars.some(v => v.key === 'idempotency_key'), 'idempotency_key must be a secret variable');
assert(secretVars.some(v => v.key === 'webhook_verify_token'), 'webhook_verify_token must be a secret variable');
console.log(`✔ Verified environment variables (${secretVars.length} masked secret variables)`);

console.log('--- ✅ All Postman Workflow Verification Tests Passed! ---');
