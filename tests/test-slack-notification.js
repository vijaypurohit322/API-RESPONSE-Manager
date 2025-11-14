const axios = require('axios');

// Test Slack notification by updating webhook
async function testSlackNotification() {
  const WEBHOOK_ID = 'e35b43d0f96fd9119693594b84c655ed'; // Your webhook ID
  const AUTH_TOKEN = 'YOUR_JWT_TOKEN'; // Replace with your actual JWT token
  const SLACK_WEBHOOK_URL = 'YOUR_SLACK_WEBHOOK_URL'; // Replace with your Slack webhook URL

  console.log('🔧 Updating webhook with Slack notification...\n');

  try {
    // Update webhook to add Slack notification
    const updateResponse = await axios.put(
      `http://localhost:5000/api/webhooks/${WEBHOOK_ID}`,
      {
        notifications: {
          slack: {
            enabled: true,
            webhookUrl: SLACK_WEBHOOK_URL,
            channel: '#general',
            events: ['received', 'forwarded', 'failed']
          }
        }
      },
      {
        headers: {
          'x-auth-token': AUTH_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook updated successfully!');
    console.log('Slack notifications enabled\n');

    // Now send a test webhook
    console.log('📤 Sending test webhook...\n');

    const webhookResponse = await axios.post(
      `http://localhost:5000/webhook/${WEBHOOK_ID}`,
      {
        test: 'Slack notification test',
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook sent!');
    console.log('Response:', webhookResponse.data);
    console.log('\n📬 Check your Slack channel for the notification!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Instructions
console.log('📝 Instructions:');
console.log('1. Get your JWT token from browser localStorage (key: "token")');
console.log('2. Create a Slack incoming webhook: https://api.slack.com/messaging/webhooks');
console.log('3. Update the WEBHOOK_ID, AUTH_TOKEN, and SLACK_WEBHOOK_URL in this file');
console.log('4. Run: node test-slack-notification.js\n');
console.log('='.repeat(60) + '\n');

// Uncomment to run
// testSlackNotification();
