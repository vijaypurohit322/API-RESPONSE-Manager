# Docker Setup Guide

Complete guide to run API Response Manager using Docker Compose.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/vijaypurohit322/api-response-manager.git
cd api-response-manager
```

### 2. Create Environment File
```bash
cp .env.example .env
```

**Edit `.env` and set your configuration:**
```bash
# IMPORTANT: Change this in production!
JWT_SECRET=your-super-secret-jwt-key-change-this
```

### 3. Start All Services
```bash
docker-compose up -d
```

### 4. Verify Services
```bash
docker-compose ps
```

All services should show as "Up" or "healthy".

### 5. Access Applications

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Tunnel Server:** ws://localhost:8080
- **Proxy Server:** http://localhost:3001
- **MongoDB:** mongodb://localhost:27017

## 📦 Services

### MongoDB (Port 27017)
- Database for storing all application data
- Persistent volume: `mongodb_data`
- Health check enabled

### Backend (Port 5000)
- Express.js API server
- Handles authentication, projects, webhooks
- Connects to MongoDB

### Frontend (Port 5173)
- React + Vite development server
- Hot reload enabled
- Connects to backend API

### Tunnel Server (Port 8080)
- WebSocket server for tunneling
- Manages tunnel connections
- Ports 3000-3100 for tunnel traffic

### Proxy Server (Port 3001)
- Captures API responses
- Forwards requests to backend
- Optional service

## 🛠️ Common Commands

### Start Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with logs
docker-compose up
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuild Services
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Execute Commands in Container
```bash
# Backend shell
docker-compose exec backend sh

# MongoDB shell
docker-compose exec mongodb mongosh

# Run npm commands
docker-compose exec backend npm install
docker-compose exec frontend npm run build
```

## 🔧 Configuration

### Environment Variables

Edit `.env` file to configure:

```env
# Database
MONGODB_URI=mongodb://mongodb:27017/api-response-manager

# Security
JWT_SECRET=change-this-secret-key

# URLs
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000/api
```

### Port Mapping

Change ports in `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "5000:5000"  # Change left side: "8000:5000"
```

### Volume Mounting

Development mode with live reload:
```yaml
volumes:
  - ./backend:/app
  - /app/node_modules
```

Production mode (remove volumes):
```yaml
# Remove volumes section for production
```

## 🐛 Troubleshooting

### Service Won't Start

**Check logs:**
```bash
docker-compose logs backend
```

**Check service status:**
```bash
docker-compose ps
```

**Restart service:**
```bash
docker-compose restart backend
```

### Port Already in Use

**Find process using port:**
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

**Change port in docker-compose.yml:**
```yaml
ports:
  - "5001:5000"  # Use different external port
```

### MongoDB Connection Issues

**Check MongoDB is running:**
```bash
docker-compose ps mongodb
```

**Test connection:**
```bash
docker-compose exec mongodb mongosh
```

**Reset database:**
```bash
docker-compose down -v
docker-compose up -d
```

### Frontend Not Loading

**Check backend is running:**
```bash
curl http://localhost:5000/api/health
```

**Rebuild frontend:**
```bash
docker-compose build frontend
docker-compose up -d frontend
```

**Check environment variables:**
```bash
docker-compose exec frontend env | grep VITE
```

### Permission Issues

**Linux/Mac - Fix permissions:**
```bash
sudo chown -R $USER:$USER .
```

**Windows - Run as Administrator**

## 🔒 Production Deployment

### 1. Update Environment
```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
```

### 2. Use Production Dockerfile
```dockerfile
# Multi-stage build for frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Add Reverse Proxy (Nginx)
```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
    - ./ssl:/etc/nginx/ssl
```

### 4. Enable SSL
```bash
# Use Let's Encrypt
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone
```

### 5. Resource Limits
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 📊 Monitoring

### Health Checks
```bash
# Check all services
docker-compose ps

# Backend health
curl http://localhost:5000/api/health

# MongoDB health
docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"
```

### Resource Usage
```bash
# All containers
docker stats

# Specific container
docker stats arm-backend
```

### Database Backup
```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out=/backup

# Restore MongoDB
docker-compose exec mongodb mongorestore /backup
```

## 🧹 Cleanup

### Remove All Containers
```bash
docker-compose down
```

### Remove Volumes (Delete Data)
```bash
docker-compose down -v
```

### Remove Images
```bash
docker-compose down --rmi all
```

### Complete Cleanup
```bash
docker-compose down -v --rmi all --remove-orphans
docker system prune -a
```

## 📝 Development Workflow

### 1. Start Development Environment
```bash
docker-compose up -d
docker-compose logs -f
```

### 2. Make Code Changes
Files are mounted as volumes, changes reflect immediately.

### 3. Install New Dependencies
```bash
# Backend
docker-compose exec backend npm install <package>

# Frontend
docker-compose exec frontend npm install <package>

# Rebuild
docker-compose up -d --build
```

### 4. Run Tests
```bash
docker-compose exec backend npm test
docker-compose exec frontend npm test
```

### 5. Database Operations
```bash
# Access MongoDB
docker-compose exec mongodb mongosh api-response-manager

# View collections
show collections

# Query data
db.users.find()
```

## 🔗 Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [MongoDB Docker](https://hub.docker.com/_/mongo)
- [Node.js Docker](https://hub.docker.com/_/node)

## 🆘 Support

- **GitHub Issues:** https://github.com/vijaypurohit322/api-response-manager/issues
- **Email:** vijaypurohit322@gmail.com

## 📄 License

MIT License
