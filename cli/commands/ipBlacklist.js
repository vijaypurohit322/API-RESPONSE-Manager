const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');
const api = require('../utils/api');

// Add IP to blacklist
async function add(tunnelId, ip) {
  const spinner = ora('Adding IP to blacklist...').start();

  try {
    // Get current tunnel
    const tunnel = await api.getTunnel(tunnelId);
    const currentBlacklist = tunnel.tunnel.ipBlacklist || [];

    // Check if IP already exists
    if (currentBlacklist.includes(ip)) {
      spinner.fail(chalk.yellow(`IP ${ip} is already in the blacklist`));
      return;
    }

    // Add new IP
    const updatedBlacklist = [...currentBlacklist, ip];
    await api.updateIPBlacklist(tunnelId, updatedBlacklist);

    spinner.succeed(chalk.green(`IP ${ip} added to blacklist`));
    console.log(chalk.gray(`\nTotal blacklisted IPs: ${updatedBlacklist.length}\n`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to add IP to blacklist'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Remove IP from blacklist
async function remove(tunnelId, ip) {
  const spinner = ora('Removing IP from blacklist...').start();

  try {
    // Get current tunnel
    const tunnel = await api.getTunnel(tunnelId);
    const currentBlacklist = tunnel.tunnel.ipBlacklist || [];

    // Check if IP exists
    if (!currentBlacklist.includes(ip)) {
      spinner.fail(chalk.yellow(`IP ${ip} is not in the blacklist`));
      return;
    }

    // Remove IP
    const updatedBlacklist = currentBlacklist.filter(item => item !== ip);
    await api.updateIPBlacklist(tunnelId, updatedBlacklist);

    spinner.succeed(chalk.green(`IP ${ip} removed from blacklist`));
    console.log(chalk.gray(`\nTotal blacklisted IPs: ${updatedBlacklist.length}\n`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to remove IP from blacklist'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// List blacklisted IPs
async function list(tunnelId) {
  const spinner = ora('Fetching IP blacklist...').start();

  try {
    const tunnel = await api.getTunnel(tunnelId);
    const blacklist = tunnel.tunnel.ipBlacklist || [];

    spinner.stop();

    if (blacklist.length === 0) {
      console.log(chalk.yellow('\n⚠ No IP blacklist configured. No IPs are blocked.\n'));
      return;
    }

    console.log(chalk.blue.bold(`\n🚫 IP Blacklist (${blacklist.length} IPs)\n`));

    const table = new Table({
      head: [chalk.white('IP Address / CIDR')],
      style: {
        head: ['cyan'],
        border: ['gray']
      }
    });

    blacklist.forEach(ip => {
      table.push([chalk.red(ip)]);
    });

    console.log(table.toString());
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch IP blacklist'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Clear all blacklisted IPs
async function clear(tunnelId) {
  const spinner = ora('Clearing IP blacklist...').start();

  try {
    await api.updateIPBlacklist(tunnelId, []);

    spinner.succeed(chalk.green('IP blacklist cleared'));
    console.log(chalk.gray('\nNo IPs are blocked.\n'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to clear IP blacklist'));
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
