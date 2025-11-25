# Nginx Reverse Proxy Setup Guide

Complete guide to configure Nginx as a reverse proxy for API Response Manager running in Docker.

## 📋 Prerequisites

- Nginx running in Docker on VM
- Docker Compose services running
- Domain names configured (DNS A records)

## 🌐 Domain Setup

You'll need 4 subdomains pointing to your VM IP:

```
your-domain.com          → Main frontend
api.your-domain.com      → Backend API
tunnel.your-domain.com   → Tunnel server (WebSocket)
proxy.your-domain.com    → Proxy server
```

**DNS Configuration:**
```
A     @                    → YOUR_VM_IP
A     api                  → YOUR_VM_IP
A     tunnel               → YOUR_VM_IP
A     proxy                → YOUR_VM_IP
```

## 🚀 Quick Setup

### 1. Copy Nginx Configuration

```bash
# On your VM
cd /path/to/api-response-manager

# Copy the config file
sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/arm.conf

# Edit and replace 'your-domain.com' with your actual domain
sudo nano /etc/nginx/sites-available/arm.conf
```

### 2. Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/arm.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo nginx -s reload
```

### 3. Start Docker Services

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Verify all services are running
docker-compose -f docker-compose.prod.yml ps
```

### 4. Update Environment Variables

Edit `.env` file:
```bash
# Frontend URL
FRONTEND_URL=https://your-domain.com

# API URL
VITE_API_URL=https://api.your-domain.com/api

# WebSocket URL
VITE_WS_URL=wss://tunnel.your-domain.com

# Tunnel domain
BASE_DOMAIN=tunnel.your-domain.com
```

Restart services:
```bash
docker-compose -f docker-compose.prod.yml restart
```

## 🔒 SSL/HTTPS Setup (Recommended)

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificates for all domains
sudo certbot --nginx -d your-domain.com \
  -d www.your-domain.com \
  -d api.your-domain.com \
  -d tunnel.your-domain.com \
  -d proxy.your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### Enable HTTPS in Nginx Config

After obtaining SSL certificates, uncomment the HTTPS sections in `arm.conf`:

```bash
sudo nano /etc/nginx/sites-available/arm.conf

# Uncomment all the SSL server blocks
# Update certificate paths if needed

sudo nginx -t
sudo nginx -s reload
```

## 🐳 Nginx in Docker Setup

If your Nginx is running in Docker, use this approach:

### 1. Create Nginx Configuration Directory

```bash
mkdir -p nginx/conf.d
cp nginx-reverse-proxy.conf nginx/conf.d/arm.conf
```

### 2. Update docker-compose.prod.yml

Add Nginx service:

```yaml
services:
  # ... existing services ...

  nginx:
    image: nginx:alpine
    container_name: arm-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
      - tunnel-server
      - proxy
    networks:
      - arm-network
```

### 3. Update Nginx Config for Docker Network

In `nginx/conf.d/arm.conf`, change localhost to service names:

```nginx
# Frontend
location / {
    proxy_pass http://frontend:5173;
    # ...
}

# Backend
location / {
    proxy_pass http://backend:5000;
    # ...
}

# Tunnel Server
location / {
    proxy_pass http://tunnel-server:8080;
    # ...
}

# Proxy
location / {
    proxy_pass http://proxy:3001;
    # ...
}
```

### 4. Start with Nginx

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Port Mapping

| Service | Internal Port | External Port | Domain |
|---------|--------------|---------------|---------|
| Frontend | 5173 | 80/443 | your-domain.com |
| Backend | 5000 | 80/443 | api.your-domain.com |
| Tunnel Server | 8080 | 80/443 | tunnel.your-domain.com |
| Proxy | 3001 | 80/443 | proxy.your-domain.com |
| MongoDB | 27017 | - | (internal only) |

## 🧪 Testing

### Test Each Service

```bash
# Frontend
curl http://your-domain.com

# Backend API
curl http://api.your-domain.com/api/health

# Tunnel Server (WebSocket)
wscat -c ws://tunnel.your-domain.com

# Proxy
curl http://proxy.your-domain.com/health
```

### Test HTTPS (after SSL setup)

```bash
curl https://your-domain.com
curl https://api.your-domain.com/api/health
```

## 🐛 Troubleshooting

### 502 Bad Gateway

**Issue:** Nginx can't connect to Docker services

**Solution:**
```bash
# Check if services are running
docker-compose ps

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify ports are listening
sudo netstat -tlnp | grep -E '5000|5173|8080|3001'
```

### WebSocket Connection Failed

**Issue:** Tunnel WebSocket not connecting

**Solution:**
```nginx
# Ensure these headers are set in tunnel server block
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 86400;
```

### CORS Errors

**Issue:** Frontend can't access backend API

**Solution:**
```nginx
# Add CORS headers to backend location
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
add_header Access-Control-Allow-Headers "Authorization, Content-Type";
```

### SSL Certificate Issues

**Issue:** Certificate errors after renewal

**Solution:**
```bash
# Reload Nginx after certificate renewal
sudo nginx -s reload

# Check certificate validity
sudo certbot certificates
```

## 📊 Monitoring

### Nginx Access Logs

```bash
# Real-time access logs
sudo tail -f /var/log/nginx/access.log

# Filter by domain
sudo tail -f /var/log/nginx/access.log | grep "api.your-domain.com"
```

### Nginx Error Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

### Service Health

```bash
# Check all Docker services
docker-compose -f docker-compose.prod.yml ps

# Check specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🔐 Security Best Practices

### 1. Rate Limiting

Already configured in the Nginx config:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;
```

### 2. Firewall Rules

```bash
# Allow only HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to service ports
sudo ufw deny 5000/tcp
sudo ufw deny 5173/tcp
sudo ufw deny 8080/tcp
sudo ufw deny 3001/tcp
```

### 3. Hide Nginx Version

```nginx
# Add to nginx.conf
http {
    server_tokens off;
}
```

### 4. Security Headers

Already included in config:
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

## 📝 Complete Setup Checklist

- [ ] DNS records configured
- [ ] Nginx configuration copied and edited
- [ ] Nginx configuration enabled
- [ ] Docker services started
- [ ] Environment variables updated
- [ ] SSL certificates obtained
- [ ] HTTPS enabled in Nginx
- [ ] Firewall rules configured
- [ ] All services tested
- [ ] Monitoring setup

## 🆘 Support

- **GitHub Issues:** https://github.com/vijaypurohit322/api-response-manager/issues
- **Email:** vijaypurohit322@gmail.com

## 📄 License

MIT License
