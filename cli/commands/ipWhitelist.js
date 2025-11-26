const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');
const api = require('../utils/api');

// Add IP to whitelist
async function add(tunnelId, ip) {
  const spinner = ora('Adding IP to whitelist...').start();

  try {
    // Get current tunnel
    const tunnel = await api.getTunnel(tunnelId);
    const currentWhitelist = tunnel.tunnel.ipWhitelist || [];

    // Check if IP already exists
    if (currentWhitelist.includes(ip)) {
      spinner.fail(chalk.yellow(`IP ${ip} is already in the whitelist`));
      return;
    }

    // Add new IP
    const updatedWhitelist = [...currentWhitelist, ip];
    await api.updateIPWhitelist(tunnelId, updatedWhitelist);

    spinner.succeed(chalk.green(`IP ${ip} added to whitelist`));
    console.log(chalk.gray(`\nTotal whitelisted IPs: ${updatedWhitelist.length}\n`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to add IP to whitelist'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Remove IP from whitelist
async function remove(tunnelId, ip) {
  const spinner = ora('Removing IP from whitelist...').start();

  try {
    // Get current tunnel
    const tunnel = await api.getTunnel(tunnelId);
    const currentWhitelist = tunnel.tunnel.ipWhitelist || [];

    // Check if IP exists
    if (!currentWhitelist.includes(ip)) {
      spinner.fail(chalk.yellow(`IP ${ip} is not in the whitelist`));
      return;
    }

    // Remove IP
    const updatedWhitelist = currentWhitelist.filter(item => item !== ip);
    await api.updateIPWhitelist(tunnelId, updatedWhitelist);

    spinner.succeed(chalk.green(`IP ${ip} removed from whitelist`));
    console.log(chalk.gray(`\nTotal whitelisted IPs: ${updatedWhitelist.length}\n`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to remove IP from whitelist'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// List whitelisted IPs
async function list(tunnelId) {
  const spinner = ora('Fetching IP whitelist...').start();

  try {
    const tunnel = await api.getTunnel(tunnelId);
    const whitelist = tunnel.tunnel.ipWhitelist || [];

    spinner.stop();

    if (whitelist.length === 0) {
      console.log(chalk.yellow('\n⚠ No IP whitelist configured. All IPs are allowed.\n'));
      return;
    }

    console.log(chalk.blue.bold(`\n🔒 IP Whitelist (${whitelist.length} IPs)\n`));

    const table = new Table({
      head: [chalk.white('IP Address / CIDR')],
      style: {
        head: ['cyan'],
        border: ['gray']
      }
    });

    whitelist.forEach(ip => {
      table.push([chalk.green(ip)]);
    });

    console.log(table.toString());
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch IP whitelist'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Clear all whitelisted IPs
async function clear(tunnelId) {
  const spinner = ora('Clearing IP whitelist...').start();

  try {
    await api.updateIPWhitelist(tunnelId, []);

    spinner.succeed(chalk.green('IP whitelist cleared'));
    console.log(chalk.gray('\nAll IPs are now allowed.\n'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to clear IP whitelist'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

module.exports = {
  add,
  remove,
  list,
  clear
};
