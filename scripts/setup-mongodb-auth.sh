#!/bin/bash
# MongoDB Authentication Setup Script
# This script sets up authentication on an existing MongoDB instance
# while preserving existing data

set -e

echo "🔐 MongoDB Authentication Setup"
echo "================================"

# Load environment variables
source .env

# Check if required variables are set
if [ -z "$MONGO_ROOT_USER" ] || [ -z "$MONGO_ROOT_PASSWORD" ]; then
    echo "❌ Error: MONGO_ROOT_USER and MONGO_ROOT_PASSWORD must be set in .env"
    exit 1
fi

if [ -z "$MONGO_APP_USER" ] || [ -z "$MONGO_APP_PASSWORD" ]; then
    echo "❌ Error: MONGO_APP_USER and MONGO_APP_PASSWORD must be set in .env"
    exit 1
fi

echo "📦 Step 1: Creating admin user on existing MongoDB..."

# Create admin user (MongoDB must be running without auth first)
docker exec arm-mongodb mongosh admin --eval "
db.createUser({
  user: '$MONGO_ROOT_USER',
  pwd: '$MONGO_ROOT_PASSWORD',
  roles: [
    { role: 'userAdminAnyDatabase', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' },
    { role: 'dbAdminAnyDatabase', db: 'admin' }
  ]
});
print('✓ Admin user created');
"

echo "📦 Step 2: Creating application user..."

docker exec arm-mongodb mongosh admin -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --eval "
db = db.getSiblingDB('api-response-manager');
db.createUser({
  user: '$MONGO_APP_USER',
  pwd: '$MONGO_APP_PASSWORD',
  roles: [
    { role: 'readWrite', db: 'api-response-manager' }
  ]
});
print('✓ Application user created');
"

echo ""
echo "✅ MongoDB users created successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Update docker-compose.prod.yml to enable auth (already done)"
echo "   2. Restart MongoDB with: docker compose -f docker-compose.prod.yml up -d mongodb"
echo "   3. Restart backend with: docker compose -f docker-compose.prod.yml up -d backend"
echo ""
echo "🔗 MongoDB Compass Connection String:"
echo "   mongodb://$MONGO_APP_USER:$MONGO_APP_PASSWORD@YOUR_SERVER_IP:27017/api-response-manager?authSource=api-response-manager"
echo ""
