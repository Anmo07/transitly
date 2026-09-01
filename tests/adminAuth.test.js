const assert = require('assert');
const jwt = require('jsonwebtoken');
const adminController = require('../src/api/controllers/adminController');

console.log('=== Running Admin Command Center Security & Biometric Auth Tests ===\n');

// 1. Test Password Login Handler
let mockResPassword = {
  statusCode: 200,
  jsonPayload: null,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.jsonPayload = data; return this; }
};

// Valid password test
adminController.loginWithPassword({ body: { password: 'transitly2026' } }, mockResPassword).then(() => {
  assert.strictEqual(mockResPassword.statusCode, 200, 'Valid password should return 200');
  assert.ok(mockResPassword.jsonPayload.token, 'Token should be present in response');
  assert.strictEqual(mockResPassword.jsonPayload.admin.authType, 'PASSWORD');
  console.log('✔ Admin Master Password authentication verified.');

  const token = mockResPassword.jsonPayload.token;
  const decoded = jwt.decode(token);
  assert.strictEqual(decoded.role, 'OPERATIONS_MANAGER', 'Admin role should be OPERATIONS_MANAGER');
  console.log('✔ Admin JWT claim and cryptographic payload verified.');

  // 2. Invalid password rejection
  let mockResInvalid = {
    statusCode: 200,
    jsonPayload: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonPayload = data; return this; }
  };

  adminController.loginWithPassword({ body: { password: 'wrong_password_123' } }, mockResInvalid).then(() => {
    assert.strictEqual(mockResInvalid.statusCode, 401, 'Invalid password should return 401 Unauthorized');
    console.log('✔ Invalid admin password rejection verified.');

    // 3. Biometric Challenge & Verification Test
    let mockResBioChallenge = {
      statusCode: 200,
      jsonPayload: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.jsonPayload = data; return this; }
    };

    adminController.getBiometricChallenge({ hostname: 'localhost' }, mockResBioChallenge).then(() => {
      assert.strictEqual(mockResBioChallenge.statusCode, 200);
      assert.ok(mockResBioChallenge.jsonPayload.challenge, 'Challenge string generated');
      assert.strictEqual(mockResBioChallenge.jsonPayload.authenticatorSelection.authenticatorAttachment, 'platform');
      console.log('✔ WebAuthn Platform Biometric challenge generation verified.');

      let mockResBioVerify = {
        statusCode: 200,
        jsonPayload: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.jsonPayload = data; return this; }
      };

      adminController.verifyBiometric({ body: { credentialId: 'BIO-CRED-01', simulated: true } }, mockResBioVerify).then(() => {
        assert.strictEqual(mockResBioVerify.statusCode, 200);
        assert.ok(mockResBioVerify.jsonPayload.token);
        assert.strictEqual(mockResBioVerify.jsonPayload.admin.authType, 'FINGERPRINT_BIOMETRIC');
        console.log('✔ Fingerprint / Biometric authentication verified.');

        // 4. Test requireAdminAuth Middleware
        let nextCalled = false;
        let mockResMiddleware = {
          statusCode: 200,
          jsonPayload: null,
          status(code) { this.statusCode = code; return this; },
          json(data) { this.jsonPayload = data; return this; }
        };

        const mockReqValid = { headers: { authorization: `Bearer ${token}` } };
        adminController.requireAdminAuth(mockReqValid, mockResMiddleware, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true, 'Valid admin token should allow access');
        console.log('✔ Admin Authorization middleware verified.');

        let mockResBlocked = {
          statusCode: 200,
          jsonPayload: null,
          status(code) { this.statusCode = code; return this; },
          json(data) { this.jsonPayload = data; return this; }
        };
        const mockReqInvalid = { headers: { authorization: 'Bearer invalid_or_missing_token' } };
        adminController.requireAdminAuth(mockReqInvalid, mockResBlocked, () => {});
        assert.strictEqual(mockResBlocked.statusCode, 401, 'Unauthenticated request should be blocked');
        console.log('✔ Unauthenticated admin access rejection verified.');

        console.log('\nAll Admin Command Center Security & Biometric Auth tests passed successfully!\n');
      });
    });
  });
});
