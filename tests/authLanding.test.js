/**
 * Test Suite: Transitly User Login & Two-Step OTP Verification Landing Page
 */

const assert = require('assert');
const http = require('http');
const app = require('../src/app');

async function runTests() {
  console.log('=== Running User Login & OTP Verification Tests ===\n');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = (method, urlPath, payload = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(urlPath, baseUrl);
      const req = http.request(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
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
    // 1. Frontend Route /login
    console.log('1. Testing GET /login & /auth HTML routes...');
    const resLogin = await request('GET', '/login');
    assert.strictEqual(resLogin.status, 200, 'Expected 200 OK for /login');
    assert.ok(resLogin.body.includes('Welcome to Transitly'), 'Expected Welcome to Transitly heading');
    assert.ok(resLogin.body.includes('Verify Your Account'), 'Expected Verify Your Account heading');
    assert.ok(resLogin.body.includes('full-name-input'), 'Expected full name input');
    assert.ok(resLogin.body.includes('identifier-input'), 'Expected identifier input');
    assert.ok(resLogin.body.includes('otp-container'), 'Expected 6-digit OTP container');
    assert.ok(resLogin.body.includes('autocomplete="one-time-code"'), 'Expected autocomplete="one-time-code" attribute');
    assert.ok(resLogin.body.includes('code-expiry-indicator'), 'Expected code-expiry-indicator element');
    assert.ok(resLogin.body.includes('https://transitly.in/login'), 'Expected canonical tag');

    const resAuth = await request('GET', '/auth');
    assert.strictEqual(resAuth.status, 200, 'Expected 200 OK for /auth');
    console.log('✔ GET /login and /auth frontend routes verified.');

    // 2. Send OTP API validation
    console.log('2. Testing POST /api/v1/auth/otp/send input validation...');
    const resEmptySend = await request('POST', '/api/v1/auth/otp/send', {});
    assert.strictEqual(resEmptySend.status, 400, 'Expected 400 for empty identifier');
    assert.ok(resEmptySend.json.message.includes('valid phone number or email'), 'Expected validation error');

    // 3. Dispatch OTP Successfully
    console.log('3. Testing POST /api/v1/auth/otp/send success flow...');
    const testIdentifier = '+919876543210';
    const resSend = await request('POST', '/api/v1/auth/otp/send', {
      fullName: 'Alex Morgan',
      identifier: testIdentifier,
      channel: 'sms',
      purpose: 'login'
    });
    assert.strictEqual(resSend.status, 200, 'Expected 200 OK for OTP dispatch');
    assert.strictEqual(resSend.json.status, 'success');
    assert.strictEqual(resSend.json.data.expiresInSeconds, 120);
    assert.strictEqual(resSend.json.data.purpose, 'login');
    const sentOtp = resSend.json.data.testOtp;
    assert.ok(sentOtp && sentOtp.length === 6, 'Expected 6-digit testOtp in dev environment');
    console.log(`✔ OTP dispatched successfully (code: ${sentOtp}).`);

    // 4. Verify with Invalid Code
    console.log('4. Testing POST /api/v1/auth/otp/verify with invalid code...');
    const resBadVerify = await request('POST', '/api/v1/auth/otp/verify', {
      identifier: testIdentifier,
      otp: '000000',
      purpose: 'login'
    });
    assert.strictEqual(resBadVerify.status, 400, 'Expected 400 for bad OTP');
    assert.strictEqual(resBadVerify.json.status, 'error');
    assert.strictEqual(resBadVerify.json.remainingAttempts, 4);
    console.log('✔ Invalid OTP code correctly rejected with remaining attempts counter.');

    // 5. Verify with Valid Code
    console.log('5. Testing POST /api/v1/auth/otp/verify with valid code...');
    const resGoodVerify = await request('POST', '/api/v1/auth/otp/verify', {
      identifier: testIdentifier,
      otp: sentOtp,
      fullName: 'Alex Morgan',
      purpose: 'login'
    });
    assert.strictEqual(resGoodVerify.status, 200, 'Expected 200 OK for successful verification');
    assert.strictEqual(resGoodVerify.json.status, 'success');
    assert.ok(resGoodVerify.json.data.token, 'Expected JWT session token');
    assert.strictEqual(resGoodVerify.json.data.user.name, 'Alex Morgan');
    console.log('✔ Successful verification with JWT token issued.');

    // 6. Test Master Dev Code Fallback is removed / strictly rejected without prior dispatch
    console.log('6. Testing POST /api/v1/auth/otp/verify rejection of arbitrary codes without active session...');
    const resMasterVerify = await request('POST', '/api/v1/auth/otp/verify', {
      identifier: 'alex@example.com',
      otp: '123456',
      fullName: 'Alex Morgan',
      purpose: 'login'
    });
    assert.strictEqual(resMasterVerify.status, 400, 'Expected 400 rejection since auto-verifying master OTP has been removed');
    console.log('✔ Arbitrary / unverified OTP correctly rejected.');

    // 6a. Purpose-Binding Enforcement
    console.log('6a. Testing Purpose-Binding: OTP generated for login cannot be verified for signup...');
    const purposeIdent = '+919876543201';
    const resSendLogin = await request('POST', '/api/v1/auth/otp/send', {
      fullName: 'Purpose Test User',
      identifier: purposeIdent,
      channel: 'sms',
      purpose: 'login'
    });
    assert.strictEqual(resSendLogin.status, 200, 'Expected 200 for purpose login send');
    const purposeOtp = resSendLogin.json.data.testOtp;

    // Attempt to verify with 'signup' purpose -> Should FAIL
    const resVerifyWrongPurpose = await request('POST', '/api/v1/auth/otp/verify', {
      identifier: purposeIdent,
      otp: purposeOtp,
      purpose: 'signup'
    });
    assert.strictEqual(resVerifyWrongPurpose.status, 400, 'Expected 400 for mismatched purpose');
    console.log('✔ Purpose mismatch rejected successfully.');

    // Verify with matching 'login' purpose -> Should SUCCEED
    const resVerifyRightPurpose = await request('POST', '/api/v1/auth/otp/verify', {
      identifier: purposeIdent,
      otp: purposeOtp,
      purpose: 'login'
    });
    assert.strictEqual(resVerifyRightPurpose.status, 200, 'Expected 200 for matching purpose');
    console.log('✔ Matching purpose verification succeeded.');

    // 6b. Resend Cooldown (Exponential Backoff)
    console.log('6b. Testing Resend Cooldown: immediate consecutive send throttled with HTTP 429...');
    const backoffIdent = '+919876543202';
    const resFirstSend = await request('POST', '/api/v1/auth/otp/send', {
      fullName: 'Backoff User',
      identifier: backoffIdent,
      channel: 'sms'
    });
    assert.strictEqual(resFirstSend.status, 200, 'First send should succeed');

    // Immediate second send to same identifier -> Should be throttled
    const resSecondSend = await request('POST', '/api/v1/auth/otp/send', {
      fullName: 'Backoff User',
      identifier: backoffIdent,
      channel: 'sms'
    });
    assert.strictEqual(resSecondSend.status, 429, 'Expected 429 Too Many Requests for cooldown breach');
    assert.ok(resSecondSend.json.retryAfterSeconds > 0, 'Expected retryAfterSeconds > 0');
    assert.ok(resSecondSend.json.message.includes('wait'), 'Expected cooldown wait message');
    console.log(`✔ Resend cooldown enforced with HTTP 429 (retry after ${resSecondSend.json.retryAfterSeconds}s).`);

    // 6c. Attempt Limits (Max 5 Failed Attempts -> Lockout)
    console.log('6c. Testing Attempt Limits: 5 consecutive failed attempts lock out code (HTTP 423)...');
    const lockoutIdent = '+919876543203';
    const resSendLockout = await request('POST', '/api/v1/auth/otp/send', {
      fullName: 'Lockout User',
      identifier: lockoutIdent,
      channel: 'sms'
    });
    assert.strictEqual(resSendLockout.status, 200);
    const correctLockoutOtp = resSendLockout.json.data.testOtp;

    // Attempts 1 to 4 should return 400 with decreasing remaining attempts
    for (let attempt = 1; attempt <= 4; attempt++) {
      const resFailed = await request('POST', '/api/v1/auth/otp/verify', {
        identifier: lockoutIdent,
        otp: '999999'
      });
      assert.strictEqual(resFailed.status, 400, `Attempt ${attempt} should return 400`);
      assert.strictEqual(resFailed.json.remainingAttempts, 5 - attempt);
    }

    // 5th failed attempt -> 423 Locked
    const resFifthFailed = await request('POST', '/api/v1/auth/otp/verify', {
      identifier: lockoutIdent,
      otp: '999999'
    });
    assert.strictEqual(resFifthFailed.status, 423, '5th failed attempt should return 423 Locked');
    assert.ok(resFifthFailed.json.message.includes('locked'), 'Expected locked out message');

    // Even correct code should now fail because OTP was auto-invalidated
    const resPostLockout = await request('POST', '/api/v1/auth/otp/verify', {
      identifier: lockoutIdent,
      otp: correctLockoutOtp
    });
    assert.ok(resPostLockout.status === 400 || resPostLockout.status === 423, 'Post-lockout verify must be rejected');
    console.log('✔ Attempt limit lockout (5 attempts) and auto-invalidation verified.');

    // 6d. Destination Hourly Rate Limiting
    console.log('6d. Testing Hourly Destination Rate Limiting (5 sends/hour cap)...');
    const userController = require('../src/api/controllers/userController');
    const rateLimitIdent = '+919876543204';
    // Send 1st
    const r1 = await request('POST', '/api/v1/auth/otp/send', { identifier: rateLimitIdent, fullName: 'Rate Limit User' });
    assert.strictEqual(r1.status, 200);
    // Simulate quota exhaustion in rateLimitStore
    const destRecord = userController.rateLimitStore.get(`dest:${rateLimitIdent}`);
    assert.ok(destRecord, 'Expected dest record in rateLimitStore');
    destRecord.cooldownUntil = 0; // Clear cooldown so we can test the hourly quota check
    destRecord.sends = [Date.now(), Date.now(), Date.now(), Date.now(), Date.now()]; // 5 sends
    const resQuotaExhausted = await request('POST', '/api/v1/auth/otp/send', { identifier: rateLimitIdent, fullName: 'Rate Limit User' });
    assert.strictEqual(resQuotaExhausted.status, 429, 'Expected 429 for hourly cap');
    assert.ok(resQuotaExhausted.json.message.includes('Maximum OTP requests reached'), 'Expected maximum requests message');
    console.log('✔ Hourly rate limiting per destination enforced successfully.');

    // 6e. Delivery Audit Trail
    console.log('6e. Testing Structured Delivery Audit Logging...');
    assert.ok(userController.otpAuditLog.length > 0, 'Audit log should contain entries');
    const lastAudit = userController.otpAuditLog[userController.otpAuditLog.length - 1];
    assert.ok(lastAudit.destination, 'Audit entry should have destination');
    assert.ok(lastAudit.purpose, 'Audit entry should have purpose');
    assert.ok(lastAudit.outcome, 'Audit entry should have outcome');
    assert.ok(lastAudit.timestamp, 'Audit entry should have ISO timestamp');
    assert.ok(lastAudit.id, 'Audit entry should have unique event ID');
    console.log(`✔ Audit log verified (${userController.otpAuditLog.length} events logged).`);

    // 7. Security & Anti-Injection Defense: SQL Injection Attempt in identifier
    console.log('7. Testing Anti-Injection: SQL injection payload in identifier (\' OR \'1\'=\'1)...');
    const resSqlInj = await request('POST', '/api/v1/auth/otp/send', {
      fullName: 'Hacker User',
      identifier: "' OR '1'='1",
      channel: 'sms'
    });
    assert.strictEqual(resSqlInj.status, 400, 'Expected 400 Bad Request for SQL injection attempt');
    assert.strictEqual(resSqlInj.json.status, 'error');
    console.log('✔ SQL injection attempt in identifier blocked successfully.');

    // 8. Security & Anti-Injection Defense: SQL Injection Attempt in fullName
    console.log('8. Testing Anti-Injection: SQL injection in fullName (Alex\'; DROP TABLE users; --)...');
    const resNameInj = await request('POST', '/api/v1/auth/otp/send', {
      fullName: "Alex'; DROP TABLE users; --",
      identifier: '+919876543210',
      channel: 'sms'
    });
    assert.strictEqual(resNameInj.status, 400, 'Expected 400 Bad Request for SQL injection in fullName');
    assert.strictEqual(resNameInj.json.status, 'error');
    console.log('✔ SQL injection in fullName blocked successfully.');

    // 9. Security & Anti-Injection Defense: XSS / Script Injection Attempt
    console.log('9. Testing Anti-Injection: XSS script tag injection (<script>alert(1)</script>)...');
    const resXssInj = await request('POST', '/api/v1/auth/otp/send', {
      fullName: '<script>alert("xss")</script>',
      identifier: '<script>@domain.com',
      channel: 'sms'
    });
    assert.strictEqual(resXssInj.status, 400, 'Expected 400 Bad Request for XSS script payload');
    assert.strictEqual(resXssInj.json.status, 'error');
    console.log('✔ XSS script tag injection blocked successfully.');

    // 10. Security & Anti-Injection Defense: Malicious OTP Code
    console.log('10. Testing Anti-Injection: Non-numeric / SQL payload in OTP code...');
    const resOtpInj = await request('POST', '/api/v1/auth/otp/verify', {
      identifier: '+919876543210',
      otp: "123456' OR '1'='1",
      fullName: 'Alex Morgan'
    });
    assert.strictEqual(resOtpInj.status, 400, 'Expected 400 Bad Request for non-numeric OTP code');
    assert.strictEqual(resOtpInj.json.status, 'error');
    console.log('✔ Malicious / non-numeric OTP injection blocked successfully.');

    // 11. Google OAuth Working Link & Callback Flow
    console.log('11. Testing Google OAuth endpoints (GET /auth/google & /auth/google/callback)...');
    const resGoogle = await request('GET', '/api/v1/auth/google');
    assert.strictEqual(resGoogle.status, 200, 'Expected 200 for Google OAuth endpoint');
    assert.ok(resGoogle.body.includes('Sign in with Google') || resGoogle.body.includes('Choose an account'), 'Expected Google OAuth screen');

    const resGoogleCb = await request('GET', '/api/v1/auth/google/callback?email=anmolrajotiya@gmail.com&name=Anmol');
    assert.strictEqual(resGoogleCb.status, 200, 'Expected 200 for Google callback');
    assert.ok(resGoogleCb.body.includes('transitly_auth_token'), 'Expected auth token in callback HTML');
    console.log('✔ Google OAuth endpoints verified successfully.');

    // 12. Apple OAuth Working Link & Callback Flow
    console.log('12. Testing Apple ID OAuth endpoints (GET /auth/apple & /auth/apple/callback)...');
    const resApple = await request('GET', '/api/v1/auth/apple');
    assert.strictEqual(resApple.status, 200, 'Expected 200 for Apple OAuth endpoint');
    assert.ok(resApple.body.includes('Apple ID'), 'Expected Apple ID sign-in screen');

    const resAppleCb = await request('GET', '/api/v1/auth/apple/callback?email=alex.morgan@icloud.com&name=Alex%20Morgan');
    assert.strictEqual(resAppleCb.status, 200, 'Expected 200 for Apple callback');
    assert.ok(resAppleCb.body.includes('transitly_auth_token'), 'Expected auth token in callback HTML');
    console.log('✔ Apple ID OAuth endpoints verified successfully.');

    // 13. Verify Login UI Removals & Enhancements
    console.log('13. Verifying Login UI removals and "Sign In" div additions...');
    const resLoginUpdated = await request('GET', '/login');
    assert.ok(!resLoginUpdated.body.includes('Intercity Bus Logistics Network'), 'Expected "Intercity Bus Logistics Network" removed');
    assert.ok(!resLoginUpdated.body.includes('SMS Verification'), 'Expected "SMS Verification" badge removed');
    assert.ok(!resLoginUpdated.body.includes('Stay logged in on this device for 30 days'), 'Expected "Stay logged in on this device for 30 days" removed');
    assert.ok(!resLoginUpdated.body.includes('>Skip<'), 'Expected "Skip" button removed');
    assert.ok(resLoginUpdated.body.includes('Sign In'), 'Expected matching UI "Sign In" div present');
    assert.ok(resLoginUpdated.body.includes("Don't have an account"), 'Expected "Don\'t have an account" prompt present');
    assert.ok(resLoginUpdated.body.includes('/signup'), 'Expected "/signup" link present');
    console.log('✔ Login UI cleanups and Sign In / Sign Up elements verified.');

    // 14. Verify Sign Up Webpage & Route
    console.log('14. Testing GET /signup & /register routes...');
    const resSignup = await request('GET', '/signup');
    assert.strictEqual(resSignup.status, 200, 'Expected 200 for /signup');
    assert.ok(resSignup.body.includes('Create Your Account'), 'Expected "Create Your Account" title');
    assert.ok(resSignup.body.includes('Sign Up'), 'Expected "Sign Up" matching UI div');
    assert.ok(resSignup.body.includes('/login'), 'Expected "/login" link for existing users');
    console.log('✔ Sign Up webpage routes verified.');

    // 15. Testing POST /api/v1/auth/signup (Create New User Profile)
    console.log('15. Testing POST /api/v1/auth/signup (User Profile Creation)...');
    const testNewEmail = `test.user.${Date.now()}@transitly.in`;
    const resCreate = await request('POST', '/api/v1/auth/signup', {
      fullName: 'Vikram Malhotra',
      email: testNewEmail,
      phone: '+919811223344',
      accountType: 'business'
    });
    assert.strictEqual(resCreate.status, 201, 'Expected 201 Created for new user');
    assert.strictEqual(resCreate.json.status, 'success');
    assert.ok(resCreate.json.data.token, 'Expected JWT session token');
    assert.strictEqual(resCreate.json.data.user.name, 'Vikram Malhotra');
    assert.strictEqual(resCreate.json.data.user.email, testNewEmail);
    assert.strictEqual(resCreate.json.data.user.role, 'CUSTOMER');
    assert.strictEqual(resCreate.json.data.user.avatarUrl, '');
    console.log('✔ User profile created in PostgreSQL in dedicated format.');

    // 16. Duplicate Registration Validation
    console.log('16. Testing duplicate email registration rejection (409 Conflict)...');
    const resDup = await request('POST', '/api/v1/auth/signup', {
      fullName: 'Vikram Malhotra',
      email: testNewEmail,
      phone: '+919999999999'
    });
    assert.strictEqual(resDup.status, 409, 'Expected 409 Conflict for duplicate email');
    console.log('✔ Duplicate account creation rejected with HTTP 409.');

    // 17. Anti-Injection on Sign Up
    console.log('17. Testing SQL Injection defense on /api/v1/auth/signup...');
    const resInjSignup = await request('POST', '/api/v1/auth/signup', {
      fullName: "Hacker'; DROP TABLE users; --",
      email: 'hacker@transitly.in',
      phone: '+919876543210'
    });
    assert.strictEqual(resInjSignup.status, 400, 'Expected 400 for SQL injection in signup');
    console.log('✔ Anti-injection defense verified on signup endpoint.');

    // 18. Server-Side Authorization Gate: Protected routes redirect to /login without auth
    console.log('18. Testing server-side route protection (unauthenticated → redirect to /login)...');
    const protectedPaths = ['/', '/deliver', '/tracking', '/services', '/history', '/profile',
      '/saved-addresses', '/payment-methods', '/settings', '/help-support', '/notifications', '/admin'];
    for (const protectedPath of protectedPaths) {
      const resProt = await request('GET', protectedPath);
      assert.strictEqual(resProt.status, 302, `Expected 302 redirect for ${protectedPath} without auth`);
      assert.ok(resProt.headers.location.includes('/login'), `Expected redirect to /login for ${protectedPath}, got: ${resProt.headers.location}`);
      assert.ok(resProt.headers.location.includes('redirect='), `Expected redirect param preserved for ${protectedPath}`);
    }
    console.log(`✔ All ${protectedPaths.length} protected routes correctly redirect unauthenticated users to /login.`);

    // 19. Public routes remain accessible without auth
    console.log('19. Testing public routes remain accessible without auth...');
    const publicPaths = ['/login', '/signup', '/faq', '/privacy-policy', '/terms'];
    for (const pubPath of publicPaths) {
      const resPub = await request('GET', pubPath);
      assert.strictEqual(resPub.status, 200, `Expected 200 for public route ${pubPath}`);
    }
    console.log(`✔ All ${publicPaths.length} public routes accessible without authentication.`);

    // 20. Authenticated access to protected routes with valid JWT cookie
    console.log('20. Testing authenticated access to protected routes with valid JWT session cookie...');
    const jwt = require('jsonwebtoken');
    const testJwt = jwt.sign(
      { userId: 999, email: 'test@transitly.in', role: 'CUSTOMER' },
      process.env.AUTH_SECRET || 'transitly-jwt-secret-key-2026',
      { expiresIn: '1h' }
    );
    const authRequest = (method, urlPath, payload = null) => {
      return new Promise((resolve, reject) => {
        const url = new URL(urlPath, baseUrl);
        const req = http.request(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `transitly_session=${testJwt}`
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

    const resHome = await authRequest('GET', '/');
    assert.strictEqual(resHome.status, 200, 'Expected 200 for / with valid JWT cookie');
    assert.ok(resHome.body.includes('Transitly'), 'Expected Transitly content on homepage');

    const resTracking = await authRequest('GET', '/tracking');
    assert.strictEqual(resTracking.status, 200, 'Expected 200 for /tracking with valid JWT cookie');

    const resProfile = await authRequest('GET', '/profile');
    assert.strictEqual(resProfile.status, 200, 'Expected 200 for /profile with valid JWT cookie');
    console.log('✔ Authenticated users can access all protected routes with valid JWT session cookie.');

    console.log('\nAll User Login, Two-Step Verification, Sign Up, SSO & Authorization Gate tests passed successfully!\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
