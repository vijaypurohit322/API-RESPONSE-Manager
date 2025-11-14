#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');

// Check for updates (optional feature, can be added later with dynamic import)
// const updateNotifier = require('update-notifier');
// const notifier = updateNotifier({ pkg });
// notifier.notify();

// Import commands
const loginCommand = require('../commands/login');
const logoutCommand = require('../commands/logout');
const tunnelCommand = require('../commands/tunnel');
const webhookCommand = require('../commands/webhook');
const projectCommand = require('../commands/project');
const logsCommand = require('../commands/logs');
const configCommand = require('../commands/config');

// CLI setup
program
  .name('arm')
  .description('API Response Manager CLI - Tunneling, Webhooks, and API Testing')
  .version(pkg.version);

// Login command
program
  .command('login')
  .description('Authenticate with API Response Manager')
  .option('-e, --email <email>', 'Email address')
  .option('-p, --password <password>', 'Password')
  .action(loginCommand);

// Logout command
program
  .command('logout')
  .description('Logout from API Response Manager')
  .action(logoutCommand);

// Tunnel commands
program
  .command('tunnel')
  .description('Manage tunnels')
  .argument('[port]', 'Local port to expose')
  .option('-s, --subdomain <subdomain>', 'Custom subdomain')
  .option('-n, --name <name>', 'Tunnel name')
  .option('-a, --auth', 'Enable basic authentication')
  .option('-r, --rate-limit <limit>', 'Rate limit (requests per minute)', '60')
  .action(tunnelCommand.start);

program
  .command('tunnel:list')
  .description('List all active tunnels')
  .action(tunnelCommand.list);

program
  .command('tunnel:stop')
  .description('Stop a tunnel')
  .argument('<tunnelId>', 'Tunnel ID to stop')
  .action(tunnelCommand.stop);

program
  .command('tunnel:logs')
  .description('View tunnel request logs')
  .argument('<tunnelId>', 'Tunnel ID')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action(tunnelCommand.logs);

// Webhook commands
program
  .command('webhook')
  .description('Create a new webhook')
  .option('-n, --name <name>', 'Webhook name')
  .option('-f, --forward <url>', 'Forward URL')
  .option('-t, --tunnel <tunnelId>', 'Forward to tunnel')
  .option('-e, --expires <hours>', 'Expiration time in hours', '24')
  .action(webhookCommand.create);

program
  .command('webhook:list')
  .description('List all webhooks')
  .action(webhookCommand.list);

program
  .command('webhook:id')
  .description('Get webhook ID by name')
  .argument('<name>', 'Webhook name')
  .action(webhookCommand.getIdByName);

program
  .command('webhook:delete')
  .description('Delete a webhook')
  .argument('<webhookId>', 'Webhook ID to delete')
  .action(webhookCommand.delete);

program
  .command('webhook:logs')
  .description('View webhook request logs')
  .argument('<webhookId>', 'Webhook ID')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action(webhookCommand.logs);

program
  .command('webhook:replay')
  .description('Replay a webhook request')
  .argument('<webhookId>', 'Webhook ID')
  .argument('<requestId>', 'Request ID to replay')
  .action(webhookCommand.replay);

// Project commands
program
  .command('projects')
  .description('List all projects')
  .action(projectCommand.list);

program
  .command('project:create')
  .description('Create a new project')
  .argument('<name>', 'Project name')
  .option('-d, --description <description>', 'Project description')
  .action(projectCommand.create);

program
  .command('project:id')
  .description('Get project ID by name')
  .argument('<name>', 'Project name')
  .action(projectCommand.getIdByName);

program
  .command('project:share')
  .description('Get shareable link for a project')
  .argument('<projectId>', 'Project ID')
  .action(projectCommand.share);

program
  .command('project:responses')
  .description('View project API responses')
  .argument('<projectId>', 'Project ID')
  .option('-n, --limit <number>', 'Number of responses to show', '10')
  .action(projectCommand.responses);

// Logs command
program
  .command('logs')
  .description('View logs for tunnels or webhooks')
  .argument('<id>', 'Tunnel or Webhook ID')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action(logsCommand);

// Config commands
program
  .command('config:set')
  .description('Set configuration value')
  .argument('<key>', 'Configuration key')
  .argument('<value>', 'Configuration value')
  .action(configCommand.set);

program
  .command('config:get')
  .description('Get configuration value')
  .argument('[key]', 'Configuration key (omit to show all)')
  .action(configCommand.get);

program
  .command('config:delete')
  .description('Delete configuration value')
  .argument('<key>', 'Configuration key')
  .action(configCommand.delete);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
