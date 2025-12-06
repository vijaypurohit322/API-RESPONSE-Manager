// MongoDB initialization script - creates users with authentication
// This runs only on first container start when no data exists

// Create application database user
db = db.getSiblingDB('api-response-manager');

db.createUser({
  user: process.env.MONGO_APP_USER || 'armapp',
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [
    {
      role: 'readWrite',
      db: 'api-response-manager'
    }
  ]
});

print('✓ Application user created for api-response-manager database');
