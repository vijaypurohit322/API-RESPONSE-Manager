const chalk = require('chalk');
const ora = require('ora');
const WebSocket = require('ws');
const Table = require('cli-table3');
const api = require('../utils/api');
const config = require('../utils/config');

// Start tunnel
async function start(port, options) {
  console.log(chalk.blue.bold('\n🚇 Starting Tunnel...\n'));

  if (!port) {
    port = config.get('defaultTunnelPort');
    console.log(chalk.gray(`Using default port: ${port}`));
  }

  const spinner = ora('Creating tunnel...').start();

  try {
    const tunnelData = {
      name: options.name || `Tunnel-${port}`,
      subdomain: options.subdomain,
      localPort: parseInt(port),
      security: {
        requireAuth: options.auth || false
      },
      rateLimit: {
        enabled: true,
        maxRequests: parseInt(options.rateLimit)
      }
    };

    const response = await api.createTunnel(tunnelData);
    const tunnel = response.tunnel;

    spinner.succeed(chalk.green('Tunnel created successfully!'));

    console.log(chalk.gray('\n┌─────────────────────────────────────────────┐'));
    console.log(chalk.gray('│') + chalk.white.bold('  Tunnel Information                        ') + chalk.gray('│'));
    console.log(chalk.gray('├─────────────────────────────────────────────┤'));
    console.log(chalk.gray('│') + chalk.gray('  Name:        ') + chalk.white(tunnel.name.padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Public URL:  ') + chalk.cyan(tunnel.publicUrl.padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Local Port:  ') + chalk.white(String(tunnel.localPort).padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Tunnel ID:   ') + chalk.yellow(tunnel._id.padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('└─────────────────────────────────────────────┘\n'));

    // Connect tunnel client
    console.log(chalk.blue('Connecting tunnel client...\n'));
    await connectTunnelClient(tunnel._id, tunnel.subdomain, tunnel.localPort);

  } catch (error) {
    spinner.fail(chalk.red('Failed to create tunnel'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Connect tunnel client
async function connectTunnelClient(tunnelId, subdomain, localPort) {
  const tunnelServerUrl = config.get('tunnelServerUrl') || 'ws://localhost:9000';
  const token = api.getToken();
  const userId = config.get('userId');

  const ws = new WebSocket(tunnelServerUrl);

  ws.on('open', () => {
    console.log(chalk.green('✓ Connected to tunnel server'));
    
    ws.send(JSON.stringify({
      type: 'register',
      tunnelId,
      subdomain,
      localPort,
      authToken: token,
      userId
    }));
  });

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === 'registered') {
      console.log(chalk.green.bold('\n🎉 Tunnel Active!\n'));
      console.log(chalk.white('Your local server is now accessible at:'));
      console.log(chalk.cyan.bold(`   ${message.publicUrl}\n`));
      console.log(chalk.gray('Press Ctrl+C to stop the tunnel\n'));
    } else if (message.type === 'request') {
      const timestamp = new Date().toLocaleTimeString();
      console.log(chalk.gray(`[${timestamp}]`), chalk.blue(message.method), chalk.white(message.path));
    } else if (message.type === 'error') {
      console.error(chalk.red(`Error: ${message.error}`));
    }
  });

  ws.on('close', () => {
    console.log(chalk.yellow('\n⚠ Tunnel disconnected'));
    process.exit(0);
  });

  ws.on('error', (error) => {
    console.error(chalk.red(`\n✗ Connection error: ${error.message}`));
    process.exit(1);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⚠ Stopping tunnel...'));
    ws.close();
  });
}

// List tunnels
async function list() {
  const spinner = ora('Fetching tunnels...').start();

  try {
    const response = await api.getTunnels();
    const tunnels = response.tunnels || [];

    spinner.stop();

    if (tunnels.length === 0) {
      console.log(chalk.yellow('\n⚠ No active tunnels found\n'));
      console.log(chalk.gray('Create a tunnel with: arm tunnel <port>\n'));
      return;
    }

    console.log(chalk.blue.bold(`\n🚇 Active Tunnels (${tunnels.length})\n`));

    const table = new Table({
      head: ['Name', 'Public URL', 'Port', 'Status', 'Requests'],
      style: {
        head: ['cyan']
      }
    });

    // Fetch request counts for each tunnel
    for (const tunnel of tunnels) {
      let requestCount = 0;
      try {
        // Try to get stats from the tunnel stats endpoint
        const statsResponse = await api.getTunnelStats(tunnel._id);
        requestCount = statsResponse.stats?.requestCount || statsResponse.stats?.totalRequests || statsResponse.requestCount || 0;
      } catch (error) {
        // If stats endpoint fails, use the value from tunnel object
        requestCount = tunnel.stats?.requestCount || tunnel.stats?.totalRequests || tunnel.requestCount || 0;
      }

      table.push([
        tunnel.name || tunnel.subdomain,
        tunnel.publicUrl,
        tunnel.localPort,
        tunnel.status === 'active' ? chalk.green('Active') : chalk.red('Inactive'),
        requestCount
      ]);
    }

    console.log(table.toString());
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch tunnels'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Stop tunnel
async function stop(tunnelId) {
  const spinner = ora('Stopping tunnel...').start();

  try {
    await api.deleteTunnel(tunnelId);
    spinner.succeed(chalk.green('Tunnel stopped successfully'));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to stop tunnel'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// View tunnel logs
async function logs(tunnelId, options) {
  const spinner = ora('Fetching logs...').start();

  try {
    const response = await api.getTunnelRequests(tunnelId, {
      limit: parseInt(options.lines)
    });
    const requests = response.requests || [];

    spinner.stop();

    if (requests.length === 0) {
      console.log(chalk.yellow('\n⚠ No requests found\n'));
      return;
    }

    console.log(chalk.blue.bold(`\n📊 Tunnel Logs (${requests.length} requests)\n`));

    requests.forEach(req => {
      const timestamp = new Date(req.createdAt).toLocaleString();
      const method = req.method.padEnd(6);
      const status = req.statusCode || 'pending';
      const statusColor = status >= 200 && status < 300 ? chalk.green : chalk.red;
      
      console.log(
        chalk.gray(`[${timestamp}]`),
        chalk.blue(method),
        chalk.white(req.path),
        statusColor(`${status}`)
      );
    });

    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch logs'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

module.exports = {
  start,
  list,
  stop,
  logs
};
