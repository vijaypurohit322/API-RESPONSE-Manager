const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const Webhook = require('./backend/models/Webhook');

async function checkWebhook() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const webhookId = '61c53d9c6c354f9e11831445ab3d88e0';
    
    const webhook = await Webhook.findOne({ webhookId });
    
    if (!webhook) {
      console.log('❌ Webhook not found');
      return;
    }

    console.log('📋 Webhook Details:');
    console.log('Name:', webhook.name);
    console.log('ID:', webhook.webhookId);
    console.log('\n🔔 Notifications:');
    console.log(JSON.stringify(webhook.notifications, null, 2));

    if (!webhook.notifications) {
      console.log('\n⚠️  No notifications configured!');
      console.log('The webhook was created without notification settings.');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

checkWebhook();
