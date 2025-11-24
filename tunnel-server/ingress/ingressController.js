const express = require('express');
const httpProxy = require('http-proxy');

class IngressController {
  constructor() {
    this.routes = new Map();
    this.proxy = httpProxy.createProxyServer({
      changeOrigin: true,
      ws: true
    });
    
    this.proxy.on('error', (err, req, res) => {
      console.error('Proxy error:', err);
      if (res.writeHead) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Bad Gateway');
      }
    });
  }

  // Add ingress rule
  addRule(tunnel) {
    if (!tunnel.ingress || !tunnel.ingress.enabled) {
      return;
    }

    const domain = tunnel.customDomain || `${tunnel.subdomain}.tunnel.arm.dev`;
    const rules = tunnel.ingress.rules || [];

    this.routes.set(domain, {
      tunnelId: tunnel._id,
      rules: rules.map(rule => ({
        path: rule.path,
        pathType: rule.pathType || 'Prefix',
        backend: {
          host: rule.backend.host,
          port: rule.backend.port
        }
      })),
      tls: tunnel.ingress.tls
    });

    console.log(`Ingress rule added for ${domain}`);
  }

  // Remove ingress rule
  removeRule(tunnel) {
    const domain = tunnel.customDomain || `${tunnel.subdomain}.tunnel.arm.dev`;
    this.routes.delete(domain);
    console.log(`Ingress rule removed for ${domain}`);
  }

  // Get matching route
  findRoute(hostname, path) {
    const route = this.routes.get(hostname);
    if (!route) {
      return null;
    }

    // Find matching rule
    for (const rule of route.rules) {
      if (this.matchPath(path, rule.path, rule.pathType)) {
        return {
          backend: rule.backend,
          tls: route.tls,
          tunnelId: route.tunnelId
        };
      }
    }

    return null;
  }

  // Match path based on pathType
  matchPath(requestPath, rulePath, pathType) {
    switch (pathType) {
      case 'Exact':
        return requestPath === rulePath;
      
      case 'Prefix':
        return requestPath.startsWith(rulePath);
      
      case 'ImplementationSpecific':
        // Use regex matching
        try {
          const regex = new RegExp(rulePath);
          return regex.test(requestPath);
        } catch (e) {
          return false;
        }
      
      default:
        return false;
    }
  }

  // Handle incoming request
  handleRequest(req, res) {
    const hostname = req.headers.host?.split(':')[0];
    const path = req.url;

    const route = this.findRoute(hostname, path);
    
    if (!route) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    // Proxy to backend
    const target = `http://${route.backend.host}:${route.backend.port}`;
    
    this.proxy.web(req, res, {
      target,
      headers: {
        'X-Forwarded-For': req.connection.remoteAddress,
        'X-Forwarded-Proto': req.connection.encrypted ? 'https' : 'http',
        'X-Forwarded-Host': hostname
      }
    });
  }

  // Handle WebSocket upgrade
  handleUpgrade(req, socket, head) {
    const hostname = req.headers.host?.split(':')[0];
    const path = req.url;

    const route = this.findRoute(hostname, path);
    
    if (!route) {
      socket.destroy();
      return;
    }

    const target = `ws://${route.backend.host}:${route.backend.port}`;
    
    this.proxy.ws(req, socket, head, { target });
  }

  // Get all routes
  listRoutes() {
    return Array.from(this.routes.entries()).map(([domain, config]) => ({
      domain,
      rules: config.rules,
      tls: config.tls,
      tunnelId: config.tunnelId
    }));
  }

  // Update route
  updateRule(tunnel) {
    this.removeRule(tunnel);
    this.addRule(tunnel);
  }
}

module.exports = new IngressController();
