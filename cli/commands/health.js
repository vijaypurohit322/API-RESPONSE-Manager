const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const config = require('../utils/config');

// Check basic health
async function check(options) {
  const apiUrl = config.get('apiUrl') || 'http://localhost:5000/api';
  // Remove /api prefix since apiUrl already includes it
  const endpoint = options.detailed ? '/health/detailed' : '/health';
  
  const spinner = ora('Checking server health...').start();

  try {
    const response = await axios.get(`${apiUrl}${endpoint}`, {
      validateStatus: (status) => status < 500 || status === 503 // Accept 503 for degraded status
    });
    const health = response.data;

    spinner.stop();

    if (options.detailed) {
      displayDetailedHealth(health);
    } else {
      displayBasicHealth(health);
    }

    // Exit with 0 for ok/degraded, 1 for error
    process.exit(health.status === 'ok' || health.status === 'degraded' ? 0 : 1);
  } catch (error) {
    spinner.fail(chalk.red('Server is unreachable'));
    console.error(chalk.red(`\n✗ ${error.message}\n`));
    process.exit(1);
  }
}

function displayBasicHealth(health) {
  console.log(chalk.blue.bold('\n🏥 Server Health Check\n'));
  
  const statusColor = health.status === 'ok' ? chalk.green : chalk.red;
  const statusIcon = health.status === 'ok' ? '✓' : '✗';
  
  console.log(chalk.gray('┌─────────────────────────────────────┐'));
  console.log(chalk.gray('│') + chalk.white('  Status:       ') + statusColor(`${statusIcon} ${health.status.toUpperCase()}`).padEnd(28) + chalk.gray('│'));
  console.log(chalk.gray('│') + chalk.white('  Uptime:       ') + chalk.cyan(formatUptime(health.uptime)).padEnd(20) + chalk.gray('│'));
  console.log(chalk.gray('│') + chalk.white('  Environment:  ') + chalk.cyan(health.environment).padEnd(20) + chalk.gray('│'));
  console.log(chalk.gray('│') + chalk.white('  Timestamp:    ') + chalk.gray(new Date(health.timestamp).toLocaleString()).padEnd(20) + chalk.gray('│'));
  console.log(chalk.gray('└─────────────────────────────────────┘\n'));
}

function displayDetailedHealth(health) {
  console.log(chalk.blue.bold('\n🏥 Detailed Server Health Check\n'));
  
  const statusColor = health.status === 'ok' ? chalk.green : (health.status === 'degraded' ? chalk.yellow : chalk.red);
  const statusIcon = health.status === 'ok' ? '✓' : (health.status === 'degraded' ? '⚠' : '✗');
  
  console.log(chalk.gray('┌─────────────────────────────────────────────────────┐'));
  console.log(chalk.gray('│') + chalk.white.bold('  Overall Status                                    ') + chalk.gray('│'));
  console.log(chalk.gray('├─────────────────────────────────────────────────────┤'));
  console.log(chalk.gray('│') + chalk.white('  Status:       ') + statusColor(`${statusIcon} ${health.status.toUpperCase()}`).padEnd(42) + chalk.gray('│'));
  console.log(chalk.gray('│') + chalk.white('  Uptime:       ') + chalk.cyan(formatUptime(health.uptime)).padEnd(34) + chalk.gray('│'));
  console.log(chalk.gray('│') + chalk.white('  Environment:  ') + chalk.cyan(health.environment).padEnd(34) + chalk.gray('│'));
  console.log(chalk.gray('│') + chalk.white('  Version:      ') + chalk.cyan(health.version || 'N/A').padEnd(34) + chalk.gray('│'));
  console.log(chalk.gray('└─────────────────────────────────────────────────────┘\n'));

  if (health.checks) {
    // Database
    console.log(chalk.white.bold('Database:'));
    displayCheckStatus(health.checks.database);
    
    // Redis
    console.log(chalk.white.bold('\nRedis:'));
    displayCheckStatus(health.checks.redis);
    
    // Memory
    console.log(chalk.white.bold('\nMemory:'));
    displayCheckStatus(health.checks.memory);
    
    console.log();
  }
}

function displayCheckStatus(check) {
  const statusColor = check.status === 'ok' ? chalk.green : 
                      check.status === 'warning' ? chalk.yellow : 
                      check.status === 'not configured' ? chalk.gray : chalk.red;
  const statusIcon = check.status === 'ok' ? '✓' : 
                     check.status === 'warning' ? '⚠' : 
                     check.status === 'not configured' ? '○' : '✗';
  
  console.log(`  ${statusColor(statusIcon)} ${statusColor(check.status.toUpperCase())}`);
  
  Object.keys(check).forEach(key => {
    if (key !== 'status') {
      console.log(`     ${chalk.gray(key + ':')} ${chalk.white(check[key])}`);
    }
  });
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

module.exports = {
  check
};
