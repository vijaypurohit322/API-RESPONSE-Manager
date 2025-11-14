# Test Scripts

This directory contains various test scripts for the API Response Manager.

## Test Files

### Backend Tests
- **test-backend-simple.js** - Simple backend connectivity test
- **test-backend.js** - Comprehensive backend API tests
- **test-connection.js** - Database and server connection tests
- **test-server.js** - Server startup and health checks

### Feature Tests
- **test-webhook-signature.js** - HMAC signature validation tests
- **test-slack-notification.js** - Slack integration tests
- **check-webhook-notifications.js** - Webhook notification system tests

### Utilities
- **hash.js** - Hash generation utilities for testing
- **diagnose.bat** - System diagnostics script (Windows)

## Running Tests

### Individual Tests
```bash
# Backend tests
node tests/test-backend-simple.js
node tests/test-backend.js

# Connection tests
node tests/test-connection.js

# Feature tests
node tests/test-webhook-signature.js
node tests/test-slack-notification.js
```

### Diagnostics
```bash
# Windows
tests\diagnose.bat

# Or manually
node tests/test-connection.js
node tests/test-backend-simple.js
```

## Prerequisites

Make sure the following services are running:
- MongoDB (localhost:27017)
- Backend Server (localhost:5000)
- Frontend (localhost:5173)

## Environment Variables

Some tests require environment variables:
```bash
# .env file
MONGODB_URI=mongodb://localhost:27017/api-response-manager
JWT_SECRET=your_jwt_secret
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## Adding New Tests

When adding new test files:
1. Use descriptive names: `test-<feature>.js`
2. Add documentation to this README
3. Include error handling and clear output
4. Test both success and failure cases

## Test Coverage

- ✅ Backend API endpoints
- ✅ Database connectivity
- ✅ Webhook signature validation
- ✅ Slack notifications
- ✅ Server health checks
- ⏳ Tunnel functionality (coming soon)
- ⏳ CLI commands (coming soon)
- ⏳ Frontend components (coming soon)
