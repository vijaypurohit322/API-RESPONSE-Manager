const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');
const api = require('../utils/api');
const config = require('../utils/config');

// Create webhook
async function create(options) {
  console.log(chalk.blue.bold('\n🪝 Creating Webhook...\n'));

  const spinner = ora('Creating webhook...').start();

  try {
    const webhookData = {
      name: options.name || `Webhook-${Date.now()}`,
      expiresIn: parseInt(options.expires) * 3600 // Convert hours to seconds
    };

    // Add forwarding if specified
    if (options.forward) {
      webhookData.forwarding = {
        enabled: true,
        targetType: 'url',
        targetUrl: options.forward
      };
    } else if (options.tunnel) {
      webhookData.forwarding = {
        enabled: true,
        targetType: 'tunnel',
        tunnelId: options.tunnel
      };
    }

    const response = await api.createWebhook(webhookData);
    const webhook = response.webhook;

    spinner.succeed(chalk.green('Webhook created successfully!'));

    console.log(chalk.gray('\n┌─────────────────────────────────────────────┐'));
    console.log(chalk.gray('│') + chalk.white.bold('  Webhook Information                        ') + chalk.gray('│'));
    console.log(chalk.gray('├─────────────────────────────────────────────┤'));
    console.log(chalk.gray('│') + chalk.gray('  Name:        ') + chalk.white(webhook.name.padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Webhook URL: ') + chalk.cyan(webhook.webhookUrl.padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Webhook ID:  ') + chalk.yellow(webhook.webhookId.padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Expires:     ') + chalk.white(new Date(webhook.expiresAt).toLocaleString().padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('└─────────────────────────────────────────────┘\n'));

    console.log(chalk.white('Send requests to this URL to test your webhook:'));
    console.log(chalk.cyan.bold(`   curl -X POST ${webhook.webhookUrl} -d '{"test": "data"}'\n`));

  } catch (error) {
    spinner.fail(chalk.red('Failed to create webhook'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// List webhooks
async function list() {
  const spinner = ora('Fetching webhooks...').start();

  try {
    const response = await api.getWebhooks();
    const webhooks = response.webhooks || [];

    spinner.stop();

    if (webhooks.length === 0) {
      console.log(chalk.yellow('\n⚠ No webhooks found\n'));
      console.log(chalk.gray('Create a webhook with: arm webhook\n'));
      return;
    }

    console.log(chalk.blue.bold(`\n🪝 Webhooks (${webhooks.length})\n`));

    const table = new Table({
      head: ['Name', 'Status', 'Requests', 'Forwarding', 'Expires'],
      style: {
        head: ['cyan']
      }
    });

    webhooks.forEach(webhook => {
      const forwarding = webhook.forwarding?.enabled ? chalk.green('✓') : chalk.gray('✗');
      const status = webhook.status === 'active' ? chalk.green('Active') : chalk.red(webhook.status);
      const expires = new Date(webhook.expiresAt).toLocaleDateString();
      
      table.push([
        webhook.name,
        status,
        webhook.stats?.totalRequests || 0,
        forwarding,
        expires
      ]);
    });

    console.log(table.toString());
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch webhooks'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Delete webhook
async function deleteWebhook(webhookId) {
  const spinner = ora('Deleting webhook...').start();

  try {
    await api.deleteWebhook(webhookId);
    spinner.succeed(chalk.green('Webhook deleted successfully'));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to delete webhook'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// View webhook logs
async function logs(webhookId, options) {
  const spinner = ora('Fetching logs...').start();

  try {
    const response = await api.getWebhookRequests(webhookId, {
      limit: parseInt(options.lines)
    });
    const requests = response.requests || [];

    spinner.stop();

    if (requests.length === 0) {
      console.log(chalk.yellow('\n⚠ No requests found\n'));
      return;
    }

    console.log(chalk.blue.bold(`\n📊 Webhook Logs (${requests.length} requests)\n`));

    requests.forEach(req => {
      const timestamp = new Date(req.createdAt).toLocaleString();
      const method = req.method.padEnd(6);
      const status = req.status;
      const statusColor = status === 'forwarded' ? chalk.green : status === 'failed' ? chalk.red : chalk.yellow;
      
      console.log(
        chalk.gray(`[${timestamp}]`),
        chalk.blue(method),
        statusColor(status.padEnd(10)),
        chalk.white(JSON.stringify(req.body).substring(0, 50))
      );
    });

    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch logs'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Replay webhook request
async function replay(webhookId, requestId) {
  const spinner = ora('Replaying request...').start();

  try {
    await api.replayWebhookRequest(webhookId, requestId);
    spinner.succeed(chalk.green('Request replayed successfully'));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to replay request'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Get webhook ID by name
async function getIdByName(name) {
  const spinner = ora('Searching for webhook...').start();

  try {
    const response = await api.getWebhooks();
    const webhooks = response.webhooks || [];

    spinner.stop();

    // Search for webhook by name (case-insensitive)
    const webhook = webhooks.find(w => w.name.toLowerCase() === name.toLowerCase());

    if (!webhook) {
      console.log(chalk.yellow(`\n⚠ Webhook "${name}" not found\n`));
      console.log(chalk.gray('Available webhooks:'));
      webhooks.forEach(w => console.log(chalk.gray(`  - ${w.name}`)));
      console.log();
      return;
    }

    console.log(chalk.blue.bold('\n🪝 Webhook Found\n'));
    console.log(chalk.white('Name:'), chalk.cyan(webhook.name));
    console.log(chalk.white('Webhook ID:'), chalk.yellow(webhook.webhookId));
    console.log(chalk.white('MongoDB ID:'), chalk.gray(webhook._id));
    console.log(chalk.white('URL:'), chalk.cyan(webhook.webhookUrl));
    console.log(chalk.gray('\nUse the Webhook ID with commands:\n'));
    console.log(chalk.gray(`  arm webhook:logs ${webhook.webhookId}`));
    console.log(chalk.gray(`  arm webhook:delete ${webhook.webhookId}\n`));

  } catch (error) {
    spinner.fail(chalk.red('Failed to search webhooks'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

module.exports = {
  create,
  list,
  getIdByName,
  delete: deleteWebhook,
  logs,
  replay
};
