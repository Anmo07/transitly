const assert = require('assert');
const whatsappService = require('../src/modules/whatsapp/whatsappService');
const { WhatsAppTemplates } = require('../src/modules/whatsapp/whatsappTemplates');

console.log('=== Running WhatsApp Assistant & Chatbot Tests ===\n');

// 1. Test Outbound Notification Templates
console.log('1. Testing Notification Templates...');
const bookingMsg = WhatsAppTemplates.BOOKING_CONFIRMED({
  recipientName: 'Aarav Sharma',
  trackingId: 'TRK-DEL-JAI-9876',
  routeName: 'Delhi to Jaipur Express',
  eta: 'Today by 7:00 PM'
});
assert.match(bookingMsg, /Booking Confirmed!/);
assert.match(bookingMsg, /TRK-DEL-JAI-9876/);

const otpMsg = WhatsAppTemplates.DELIVERY_OTP_REQUIRED({
  trackingId: 'TRK-DEL-JAI-9876',
  otp: '849201'
});
assert.match(otpMsg, /849201/);
assert.match(otpMsg, /share this code ONLY with the delivery partner/);

const exceptionMsg = WhatsAppTemplates.DELIVERY_EXCEPTION({
  trackingId: 'TRK-DEL-JAI-9876',
  reason: 'Recipient unavailable at address',
  terminalName: 'Jaipur Central Depot'
});
assert.match(exceptionMsg, /Jaipur Central Depot/);
console.log('✔ All notification templates verified successfully.');

// 2. Test Inbound Conversational Chatbot
console.log('\n2. Testing Inbound Chatbot Intents & Opt-out...');

const testPhone = '+919876543210';

// Opt-out Intent
whatsappService.handleInboundMessage({
  fromPhoneNumber: testPhone,
  text: 'STOP all messages'
}).then((res) => {
  assert.strictEqual(res.intent, 'STOP_NOTIFICATIONS');
  assert.match(res.replyText, /unsubscribed/);
  console.log('✔ Opt-out handling verified.');

  // Verify that subsequent template messages are skipped for opted-out users
  return whatsappService.sendTemplateMessage(testPhone, 'BOOKING_CONFIRMED', {
    recipientName: 'Aarav',
    trackingId: 'TRK-123'
  });
}).then((res) => {
  assert.strictEqual(res.skipped, true);
  assert.strictEqual(res.reason, 'OPTED_OUT');
  console.log('✔ Opted-out message suppression verified.');

  // Opt back in
  return whatsappService.handleInboundMessage({
    fromPhoneNumber: testPhone,
    text: 'START notifications again'
  });
}).then((res) => {
  assert.strictEqual(res.intent, 'START_NOTIFICATIONS');
  assert.match(res.replyText, /Welcome back/);
  console.log('✔ Re-subscription handling verified.');

  // Support handoff
  return whatsappService.handleInboundMessage({
    fromPhoneNumber: testPhone,
    text: 'I want to talk to an agent / support'
  });
}).then((res) => {
  assert.strictEqual(res.intent, 'TALK_TO_SUPPORT');
  assert.match(res.replyText, /support team/);
  console.log('✔ Human support escalation intent verified.');

  // Privacy Redaction Check in Tracking Response
  const mockShipment = {
    trackingId: 'TRK-SAFE-99',
    status: 'IN_TRANSIT',
    recipient: { address: 'Sector 14, Gurgaon' },
    qrSeal: { isTampered: false },
    driverPrivatePhone: '+919999999999',
    rawGpsTrail: [{ lat: 28.5, lon: 77.1 }]
  };

  const sanitized = whatsappService._formatSanitizedTrackingResponse(mockShipment);
  assert.match(sanitized, /TRK-SAFE-99/);
  assert.match(sanitized, /IN_TRANSIT/);
  assert.strictEqual(sanitized.includes('+919999999999'), false, 'Private driver phone must NOT be leaked');
  assert.strictEqual(sanitized.includes('rawGpsTrail'), false, 'Raw GPS trail must NOT be leaked');
  console.log('✔ Privacy redaction filter verified.');

  console.log('\nAll WhatsApp Assistant tests passed successfully!');
}).catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
