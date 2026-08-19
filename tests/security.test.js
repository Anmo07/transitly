const assert = require('assert');
const {
  generateOtp,
  hashOtp,
  verifyOtp,
  generateQrSealCode,
  calculateDistanceMeters,
  validateGeofence
} = require('../src/utils/security');

console.log('Running Security Utility Tests...');

// 1. Test OTP Generation and Verification
const otp = generateOtp(6);
assert.strictEqual(otp.length, 6, 'OTP length should be 6 digits');
assert.match(otp, /^\d{6}$/, 'OTP should only contain numbers');

const salt = 'shipment-12345';
const hashedOtp = hashOtp(otp, salt);
assert.ok(hashedOtp && hashedOtp.length === 64, 'SHA-256 hash length should be 64 chars');

const isCorrectOtp = verifyOtp(otp, hashedOtp, salt);
assert.strictEqual(isCorrectOtp, true, 'Valid OTP should verify successfully');

const isWrongOtp = verifyOtp('000000', hashedOtp, salt);
assert.strictEqual(isWrongOtp, false, 'Invalid OTP should fail verification');

console.log('✔ OTP generation and cryptographic verification tests passed.');

// 2. Test QR Seal Generation
const sealCode = generateQrSealCode();
assert.match(sealCode, /^SEAL-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/, 'QR Seal code should match SEAL-XXXX-XXXX-XXXX');
console.log('✔ QR Seal generation tests passed.');

// 3. Test Geofence Validation (Haversine formula)
// Reference Coordinates: Connaught Place, New Delhi (28.6315, 77.2167)
const targetGeofence = {
  latitude: 28.6315,
  longitude: 77.2167,
  radiusMeters: 100
};

// Coordinate ~30 meters away
const insideCoord = {
  latitude: 28.6317,
  longitude: 77.2169
};

const insideResult = validateGeofence(insideCoord, targetGeofence);
assert.strictEqual(insideResult.isWithinGeofence, true, 'Coordinate within 100m should pass geofence');
assert.ok(insideResult.distanceMeters < 100, 'Distance should be less than 100m');

// Coordinate ~2.5km away (India Gate: 28.6129, 77.2295)
const outsideCoord = {
  latitude: 28.6129,
  longitude: 77.2295
};

const outsideResult = validateGeofence(outsideCoord, targetGeofence);
assert.strictEqual(outsideResult.isWithinGeofence, false, 'Coordinate >100m away should fail geofence');
assert.ok(outsideResult.distanceMeters > 2000, 'Distance should be ~2km+');

console.log('✔ Geofence boundary calculation and validation tests passed.');
console.log('\nAll security tests passed successfully!');
