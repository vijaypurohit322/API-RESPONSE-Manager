#!/usr/bin/env node

const TunnelClient = require('./client');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('Usage: node start-tunnel.js <tunnelId> <subdomain> <localPort>');
  console.log('');
  console.log('Example:');
  console.log('  node start-tunnel.js 6915c471919d6dc2901a39e3 8d112a2c 30003');
  console.log('');
  console.log('Note: Make sure you are logged in to the web app first.');
  console.log('The script will automatically get your auth token from the browser.');
  process.exit(1);
}

const [tunnelId, subdomain, localPort] = args;

console.log('🔍 Looking for authentication token...');
console.log('');
console.log('⚠️  IMPORTANT: You need to provide your auth token and user ID');
console.log('');
console.log('To get your token:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Console tab');
console.log('3. Run: JSON.parse(localStorage.getItem("user"))');
console.log('4. Copy the "token" and "user.id" values');
console.log('');
console.log('Then run:');
console.log(`node client.js ${tunnelId} ${subdomain} ${localPort} <YOUR_TOKEN> <YOUR_USER_ID>`);
console.log('');
