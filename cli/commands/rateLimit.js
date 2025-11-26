const chalk = require('chalk');
const ora = require('ora');
const api = require('../utils/api');

// Configure rate limits
async function configure(tunnelId, options) {
  const spinner = ora('Updating rate limits...').start();

  try {
    // Get current tunnel
    const tunnel = await api.getTunnel(tunnelId);
    const currentRateLimit = tunnel.tunnel.rateLimit || {};

    // Build update object
    const updates = {
      rateLimit: {
        enabled: options.disable ? false : (options.enable ? true : currentRateLimit.enabled),
        requestsPerMinute: options.rpm || currentRateLimit.requestsPerMinute,
        requestsPerHour: options.rph || currentRateLimit.requestsPerHour,
        requestsPerDay: options.rpd || currentRateLimit.requestsPerDay
      }
    };

    await api.updateTunnel(tunnelId, updates);

    spinner.succeed(chalk.green('Rate limits updated successfully'));

    console.log(chalk.blue.bold('\n⚡ Rate Limit Configuration\n'));
    console.log(chalk.gray('┌─────────────────────────────────────┐'));
    console.log(chalk.gray('│') + chalk.white('  Status:       ') + (updates.rateLimit.enabled ? chalk.green('Enabled') : chalk.red('Disabled')).padEnd(28) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.white('  Per Minute:   ') + chalk.cyan(String(updates.rateLimit.requestsPerMinute)).padEnd(20) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.white('  Per Hour:     ') + chalk.cyan(String(updates.rateLimit.requestsPerHour)).padEnd(20) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.white('  Per Day:      ') + chalk.cyan(String(updates.rateLimit.requestsPerDay)).padEnd(20) + chalk.gray('│'));
    console.log(chalk.gray('└─────────────────────────────────────┘\n'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to update rate limits'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Show current rate limits
async function show(tunnelId) {
  const spinner = ora('Fetching rate limits...').start();

  try {
    const tunnel = await api.getTunnel(tunnelId);
    const rateLimit = tunnel.tunnel.rateLimit || {};

    spinner.stop();

    console.log(chalk.blue.bold('\n⚡ Rate Limit Configuration\n'));
    console.log(chalk.gray('┌─────────────────────────────────────┐'));
    console.log(chalk.gray('│') + chalk.white('  Status:       ') + (rateLimit.enabled ? chalk.green('Enabled') : chalk.red('Disabled')).padEnd(28) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.white('  Per Minute:   ') + chalk.cyan(String(rateLimit.requestsPerMinute || 60)).padEnd(20) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.white('  Per Hour:     ') + chalk.cyan(String(rateLimit.requestsPerHour || 1000)).padEnd(20) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.white('  Per Day:      ') + chalk.cyan(String(rateLimit.requestsPerDay || 10000)).padEnd(20) + chalk.gray('│'));
    console.log(chalk.gray('└─────────────────────────────────────┘\n'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch rate limits'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

module.exports = {
  configure,
  show
};
