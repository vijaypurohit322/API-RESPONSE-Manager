const crypto = require('crypto');
const axios = require('axios');

// Configuration
const WEBHOOK_URL = 'http://localhost:5000/webhook/YOUR_WEBHOOK_ID'; // Replace with actual webhook ID
const SECRET = 'my-secret-key'; // Same secret configured in webhook
const ALGORITHM = 'sha256';

// Test payload
const payload = {
  event: 'test',
  data: {
    message: 'Hello from signature test',
    timestamp: new Date().toISOString()
  }
};

// Generate HMAC signature
function generateSignature(payload, secret, algorithm = 'sha256') {
  const payloadString = JSON.stringify(payload);
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payloadString);
  return `${algorithm}=${hmac.digest('hex')}`;
}

// Test webhook with signature
async function testWebhookWithSignature() {
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payload, SECRET, ALGORITHM);

  console.log('📤 Sending webhook with signature...');
  console.log('Payload:', payloadString);
  console.log('Signature:', signature);
  console.log('');

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature
      }
    });

    console.log('✅ Success!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test webhook with invalid signature
async function testWebhookWithInvalidSignature() {
  const payloadString = JSON.stringify(payload);
  const invalidSignature = 'sha256=invalid_signature_here';

  console.log('\n📤 Sending webhook with INVALID signature...');
  console.log('Payload:', payloadString);
  console.log('Signature:', invalidSignature);
  console.log('');

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': invalidSignature
      }
    });

    console.log('✅ Success (unexpected!)');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Rejected (expected):', error.response?.data?.error);
  }
}

// Test webhook without signature
async function testWebhookWithoutSignature() {
  const payloadString = JSON.stringify(payload);

  console.log('\n📤 Sending webhook WITHOUT signature...');
  console.log('Payload:', payloadString);
  console.log('');

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success (unexpected!)');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Rejected (expected):', error.response?.data?.error);
  }
}

// Run tests
async function runTests() {
  console.log('🔐 Webhook Signature Validation Test\n');
  console.log('='.repeat(50));
  
  await testWebhookWithSignature();
  await testWebhookWithInvalidSignature();
  await testWebhookWithoutSignature();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests completed!');
}

runTests();
