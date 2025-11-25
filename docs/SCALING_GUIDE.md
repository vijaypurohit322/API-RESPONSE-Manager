# Scaling Guide for 1000+ Users

Complete guide for deploying API Response Manager at scale.

## 📊 Recommended VM Configuration for 1000+ Users

### Single Server Setup (Recommended Start)

```
CPU:      8-16 vCPUs (Intel Xeon or AMD EPYC)
RAM:      16-32 GB
Storage:  200-500 GB SSD (NVMe preferred)
Network:  1-2 Gbps
OS:       Ubuntu 22.04 LTS

Estimated Cost: $80-160/month
Providers: DigitalOcean, AWS, GCP, Linode, Vultr
```

### Specific Provider Recommendations

**DigitalOcean:**
- Droplet: `s-8vcpu-16gb` ($96/month)
- Or: `s-16vcpu-32gb` ($192/month) for 2000+ users

**AWS:**
- Instance: `c5.2xlarge` (8 vCPU, 16GB) ~$120/month
- Or: `c5.4xlarge` (16 vCPU, 32GB) ~$240/month

**Google Cloud:**
- Instance: `n2-standard-8` (8 vCPU, 32GB) ~$150/month
- Or: `n2-standard-16` (16 vCPU, 64GB) ~$300/month

**Linode:**
- Instance: `Dedicated 16GB` (8 vCPU, 16GB) $96/month
- Or: `Dedicated 32GB` (16 vCPU, 32GB) $192/month

## 🔧 Docker Resource Allocation (16GB RAM)

Update `docker-compose.prod.yml`:

```yaml
services:
  mongodb:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 6G
        reservations:
          cpus: '2'
          memory: 4G

  backend:
    deploy:
      resources:
        limits:
          cpus: '3'
          memory: 4G
        reservations:
          cpus: '1.5'
          memory: 2G
      replicas: 2  # Run 2 instances

  frontend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G

  tunnel-server:
    deploy:
      resources:
        limits:
          cpus: '3'
          memory: 4G
        reservations:
          cpus: '1.5'
          memory: 2G

  proxy:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

## 🚀 Performance Optimizations

### 1. MongoDB Indexing

```javascript
// Connect to MongoDB and create indexes
use api-response-manager

db.users.createIndex({ email: 1 }, { unique: true });
db.projects.createIndex({ userId: 1, createdAt: -1 });
db.webhooks.createIndex({ userId: 1, isActive: 1 });
db.webhookRequests.createIndex({ webhookId: 1, createdAt: -1 });
db.apiResponses.createIndex({ projectId: 1, createdAt: -1 });
db.tunnels.createIndex({ userId: 1, isActive: 1 });
db.comments.createIndex({ projectId: 1, createdAt: -1 });

// Enable compression
db.adminCommand({
  setParameter: 1,
  wiredTigerEngineRuntimeConfig: "cache_size=4GB"
});
```

### 2. Enable Node.js Clustering

Create `backend/cluster.js`:

```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = Math.min(os.cpus().length, 4); // Max 4 workers
  
  console.log(`Master ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  require('./server.js');
  console.log(`Worker ${process.pid} started`);
}
```

Update `backend/package.json`:
```json
{
  "scripts": {
    "start": "node cluster.js"
  }
}
```

### 3. Add Redis for Caching

Update `docker-compose.prod.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: arm-redis
  restart: always
  command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
  volumes:
    - redis_data:/data
  networks:
    - arm-network
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 2G

volumes:
  redis_data:
```

Install Redis client in backend:
```bash
npm install redis
```

### 4. Nginx Optimization

Update nginx configuration:

```nginx
# Add to http block
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Enable caching
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;
    
    # Connection pooling
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
}
```

## 💾 System Optimization

### 1. Increase File Descriptors

```bash
# Edit limits
sudo nano /etc/security/limits.conf

# Add these lines
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536

# Apply immediately
ulimit -n 65536
```

### 2. Network Tuning

```bash
# Edit sysctl
sudo nano /etc/sysctl.conf

# Add these lines
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15
net.core.netdev_max_backlog = 5000
net.ipv4.ip_local_port_range = 1024 65535

# Apply changes
sudo sysctl -p
```

### 3. Add Swap Space

```bash
# Create 8GB swap (for 16GB RAM)
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swappiness
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

## 📊 Monitoring Setup

### 1. Install Monitoring Stack

Create `docker-compose.monitoring.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: arm-prometheus
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    networks:
      - arm-network

  grafana:
    image: grafana/grafana:latest
    container_name: arm-grafana
    restart: always
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - arm-network

  node-exporter:
    image: prom/node-exporter:latest
    container_name: arm-node-exporter
    restart: always
    ports:
      - "9100:9100"
    networks:
      - arm-network

volumes:
  prometheus_data:
  grafana_data:

networks:
  arm-network:
    external: true
```

### 2. Prometheus Configuration

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb:27017']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:5000']
```

## 🔒 Security Hardening

### 1. Firewall Setup

```bash
# Install UFW
sudo apt install ufw

# Configure rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS

# Enable firewall
sudo ufw enable
```

### 2. Fail2Ban for SSH Protection

```bash
# Install
sudo apt install fail2ban

# Configure
sudo nano /etc/fail2ban/jail.local

# Add:
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600

# Start service
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. SSL/TLS Configuration

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx \
  -d your-domain.com \
  -d api.your-domain.com \
  -d tunnel.your-domain.com \
  -d proxy.your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## 💾 Backup Strategy

### 1. MongoDB Backup Script

Create `backup-mongodb.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup
docker exec arm-mongodb mongodump \
  --out=/backup/$DATE \
  --gzip \
  --db=api-response-manager

# Compress
tar -czf $BACKUP_DIR/mongodb-$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/mongodb-$DATE.tar.gz s3://your-bucket/backups/

# Cleanup old backups
find $BACKUP_DIR -name "mongodb-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: mongodb-$DATE.tar.gz"
```

### 2. Automated Backups

```bash
# Make executable
chmod +x backup-mongodb.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1") | crontab -
```

## 📈 Load Testing

### 1. Install k6

```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 2. Load Test Script

Create `load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 1000 }, // Ramp up to 1000 users
    { duration: '5m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  let res = http.get('https://api.your-domain.com/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

Run test:
```bash
k6 run load-test.js
```

## 💰 Cost Breakdown (Monthly)

### For 1000 Users

```
VM (8 vCPU, 16GB):        $96/month   (DigitalOcean)
Storage (200GB SSD):      $20/month
Bandwidth (2TB):          $20/month
Backups (100GB):          $10/month
Domain + SSL:             $15/month
Monitoring:               $0 (self-hosted)
────────────────────────────────────
Total:                    $161/month
```

### For 2000+ Users

```
VM (16 vCPU, 32GB):       $192/month
Storage (500GB SSD):      $50/month
Bandwidth (5TB):          $50/month
Backups (200GB):          $20/month
Domain + SSL:             $15/month
Monitoring:               $0 (self-hosted)
────────────────────────────────────
Total:                    $327/month
```

## 🚀 Deployment Checklist

- [ ] Provision VM with recommended specs
- [ ] Install Docker & Docker Compose
- [ ] Configure firewall (UFW)
- [ ] Setup Fail2Ban
- [ ] Increase file descriptors
- [ ] Optimize network settings
- [ ] Add swap space
- [ ] Clone repository
- [ ] Configure environment variables
- [ ] Setup Nginx reverse proxy
- [ ] Obtain SSL certificates
- [ ] Create MongoDB indexes
- [ ] Enable Node.js clustering
- [ ] Setup Redis caching
- [ ] Configure monitoring
- [ ] Setup automated backups
- [ ] Run load tests
- [ ] Configure log rotation
- [ ] Setup alerting

## 📞 Support

- **GitHub:** https://github.com/vijaypurohit322/api-response-manager
- **Issues:** https://github.com/vijaypurohit322/api-response-manager/issues
- **Email:** vijaypurohit322@gmail.com
