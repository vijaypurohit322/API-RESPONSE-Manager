---
sidebar_position: 3
title: Nginx Setup
description: Configure Nginx reverse proxy
---

# Nginx Setup

Configure Nginx as a reverse proxy for TunnelAPI.

## Install Nginx

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

## Configuration

Create `/etc/nginx/sites-available/tunnelapi`:

```nginx
# Frontend
server {
    server_name tunnelapi.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# API
server {
    server_name api.tunnelapi.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Tunnel Server
server {
    server_name tunnel.tunnelapi.yourdomain.com *.tunnelapi.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

## Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/tunnelapi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificates

```bash
sudo certbot --nginx -d tunnelapi.yourdomain.com \
  -d api.tunnelapi.yourdomain.com \
  -d tunnel.tunnelapi.yourdomain.com \
  -d "*.tunnelapi.yourdomain.com"
```
