const chalk = require('chalk');
const api = require('../utils/api');
const config = require('../utils/config');

async function logout() {
  const email = config.get('email');
  
  if (!email) {
    console.log(chalk.yellow('\n⚠ You are not logged in\n'));
    return;
  }

  // Clear stored credentials
  api.clearToken();
  config.delete('userId');
  config.delete('email');

  console.log(chalk.green(`\n✓ Logged out successfully (${email})\n`));
}

module.exports = logout;
