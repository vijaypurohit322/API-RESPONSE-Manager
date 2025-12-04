const chalk = require('chalk');
const ora = require('ora');
const WebSocket = require('ws');
const Table = require('cli-table3');
const axios = require('axios');
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
      protocol: options.protocol || 'http',
      sslEnabled: options.ssl || options.protocol === 'https',
      customDomain: options.domain,
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

    // Safe string padding function
    const safePadEnd = (str, length) => {
      const s = String(str || '');
      return s.length >= length ? s : s + ' '.repeat(length - s.length);
    };

    console.log(chalk.gray('\n┌─────────────────────────────────────────────┐'));
    console.log(chalk.gray('│') + chalk.white.bold('  Tunnel Information                        ') + chalk.gray('│'));
    console.log(chalk.gray('├─────────────────────────────────────────────┤'));
    console.log(chalk.gray('│') + chalk.gray('  Name:        ') + chalk.white(safePadEnd(tunnel.subdomain || 'Unknown', 28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Public URL:  ') + chalk.cyan(safePadEnd(tunnel.publicUrl || 'Unknown', 28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Local Port:  ') + chalk.white(safePadEnd(tunnel.localPort || 'Unknown', 28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Tunnel ID:   ') + chalk.yellow(safePadEnd(tunnel.id || tunnel._id || 'Unknown', 28)) + chalk.gray('│'));
    console.log(chalk.gray('└─────────────────────────────────────────────┘\n'));

    // Connect tunnel client
    console.log(chalk.blue('Connecting tunnel client...\n'));
    await connectTunnelClient(tunnel.id || tunnel._id, tunnel.subdomain, tunnel.localPort);

  } catch (error) {
    spinner.fail(chalk.red('Failed to create tunnel'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Connect tunnel client
async function connectTunnelClient(tunnelId, subdomain, localPort) {
  const tunnelServerUrl = config.get('tunnelServerUrl') || 'ws://localhost:8080';
  const token = api.getToken();
  const userId = config.get('userId');

  const ws = new WebSocket(tunnelServerUrl);

  let heartbeatInterval;

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

    // Send heartbeat every 30 seconds to keep connection alive (industry standard)
    heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat', tunnelId, subdomain }));
      }
    }, 30000);
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
      
      // Forward request to local server
      try {
        const localUrl = `http://localhost:${localPort}${message.path}`;
        const response = await axios({
          method: message.method.toLowerCase(),
          url: localUrl,
          headers: message.headers || {},
          data: message.body,
          validateStatus: () => true // Accept any status code
        });
        
        // Clean up headers to avoid conflicts
        const cleanHeaders = { ...response.headers };
        delete cleanHeaders['transfer-encoding'];
        delete cleanHeaders['content-length'];
        
        // Send response back to tunnel server
        ws.send(JSON.stringify({
          type: 'response',
          requestId: message.requestId,
          statusCode: response.status,
          headers: cleanHeaders,
          body: response.data
        }));
      } catch (error) {
        console.error(chalk.red(`Error forwarding request: ${error.message}`));
        ws.send(JSON.stringify({
          type: 'response',
          requestId: message.requestId,
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Tunnel client error', message: error.message }
        }));
      }
    } else if (message.type === 'timeout') {
      // Handle server-side timeout notifications
      if (message.reason === 'idle') {
        console.log(chalk.yellow('\n⏰ Tunnel closed due to 2 hours of inactivity.'));
      } else if (message.reason === 'max_session') {
        console.log(chalk.yellow('\n⏰ Tunnel session expired after 24 hours.'));
      }
      console.log(chalk.gray(message.message || 'Please reconnect to continue.'));
    } else if (message.type === 'error') {
      console.error(chalk.red(`Error: ${message.error}`));
    }
  });

  ws.on('close', () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    console.log(chalk.yellow('\n⚠ Tunnel disconnected'));
    process.exit(0);
  });

  ws.on('error', (error) => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    console.error(chalk.red(`\n✗ Connection error: ${error.message}`));
    process.exit(1);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
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

// Set custom domain
async function setDomain(tunnelId, domain) {
  const spinner = ora('Setting custom domain...').start();

  try {
    await api.setTunnelDomain(tunnelId, domain);
    spinner.succeed(chalk.green('Custom domain set successfully'));
    console.log(chalk.cyan(`\n✓ Tunnel now accessible at: https://${domain}\n`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to set custom domain'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Upload SSL certificate
async function uploadSSL(tunnelId, options) {
  const spinner = ora('Uploading SSL certificate...').start();

  try {
    const fs = require('fs');
    const cert = fs.readFileSync(options.cert, 'utf8');
    const key = fs.readFileSync(options.key, 'utf8');
    const ca = options.ca ? fs.readFileSync(options.ca, 'utf8') : null;

    await api.uploadTunnelSSL(tunnelId, { cert, key, ca });
    spinner.succeed(chalk.green('SSL certificate uploaded successfully'));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to upload SSL certificate'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Configure OAuth
async function configureOAuth(tunnelId, options) {
  const spinner = ora('Configuring OAuth...').start();

  try {
    await api.configureTunnelOAuth(tunnelId, {
      provider: options.provider,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      callbackUrl: options.callbackUrl,
      scope: options.scope ? options.scope.split(',') : ['openid', 'email', 'profile']
    });
    spinner.succeed(chalk.green('OAuth configured successfully'));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to configure OAuth'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Configure OIDC
async function configureOIDC(tunnelId, options) {
  const spinner = ora('Configuring OIDC...').start();

  try {
    await api.configureTunnelOIDC(tunnelId, {
      issuer: options.issuer,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      callbackUrl: options.callbackUrl
    });
    spinner.succeed(chalk.green('OIDC configured successfully'));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to configure OIDC'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Configure SAML
async function configureSAML(tunnelId, options) {
  const spinner = ora('Configuring SAML...').start();

  try {
    const fs = require('fs');
    const cert = fs.readFileSync(options.cert, 'utf8');

    await api.configureTunnelSAML(tunnelId, {
      entryPoint: options.entryPoint,
      issuer: options.issuer,
      cert,
      callbackUrl: options.callbackUrl
    });
    spinner.succeed(chalk.green('SAML configured successfully'));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to configure SAML'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Configure ingress
async function configureIngress(tunnelId, rules, options) {
  const spinner = ora('Configuring ingress...').start();

  try {
    // Parse rules: "/api=localhost:3000,/admin=localhost:4000"
    const parsedRules = rules.split(',').map(rule => {
      const [path, backend] = rule.split('=');
      const [host, port] = backend.split(':');
      return {
        path: path.trim(),
        pathType: 'Prefix',
        backend: {
          host: host.trim(),
          port: parseInt(port)
        }
      };
    });

    await api.configureTunnelIngress(tunnelId, {
      enabled: true,
      rules: parsedRules,
      tls: { enabled: options.tls || false }
    });
    spinner.succeed(chalk.green('Ingress configured successfully'));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to configure ingress'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

module.exports = {
  start,
  list,
  stop,
  logs,
  setDomain,
  uploadSSL,
  configureOAuth,
  configureOIDC,
  configureSAML,
  configureIngress
};
