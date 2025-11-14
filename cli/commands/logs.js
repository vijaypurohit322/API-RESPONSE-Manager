const chalk = require('chalk');
const api = require('../utils/api');

async function logs(id, options) {
  // Try to determine if it's a tunnel or webhook ID
  // Tunnel IDs are MongoDB ObjectIds (24 chars), Webhook IDs are 32 chars hex
  
  if (id.length === 32) {
    // Webhook ID
    const webhookCommand = require('./webhook');
    await webhookCommand.logs(id, options);
  } else if (id.length === 24) {
    // Tunnel ID
    const tunnelCommand = require('./tunnel');
    await tunnelCommand.logs(id, options);
  } else {
    console.error(chalk.red('\n✗ Invalid ID format\n'));
    console.log(chalk.gray('Tunnel IDs are 24 characters'));
    console.log(chalk.gray('Webhook IDs are 32 characters\n'));
    process.exit(1);
  }
}

module.exports = logs;
