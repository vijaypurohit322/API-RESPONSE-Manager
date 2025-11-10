# 🚀 Quick Start Guide

## The Problem You're Facing

You ran the test script but don't see any responses in the UI. This is because **3 servers need to be running** for the system to work:

1. ✅ **Backend Server** (port 5000) - Stores the captured responses
2. ✅ **Proxy Server** (port 8080) - Captures and forwards responses
3. ✅ **Test API Server** (port 3000) - Your test Python API

## Solution: Start All Servers

### Option 1: Use the Batch Script (Easiest)

Double-click this file:
```
start-all.bat
```

This will open 3 terminal windows and start all servers automatically.

### Option 2: Manual Start (3 Separate Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Wait for: `Server running on port 5000`

**Terminal 2 - Proxy:**
```bash
cd proxy
npm start
```
Wait for: `Proxy server started on port 8080`

**Terminal 3 - Test API:**
```bash
cd test-app
python app.py
```
Wait for: `Server running on: http://localhost:3000`

## Now Run the Tests

Once all 3 servers are running:

```bash
cd test-app
python test_requests.py
```

## Verify It's Working

1. **Check the terminal logs:**
   - Proxy terminal should show: `✅ Response captured and sent to API Response Manager`
   - Backend terminal should show incoming POST requests

2. **Check the UI:**
   - Open: `http://localhost:5173/projects/69119321dff6271fdce6e1fe`
   - You should see responses appearing in real-time
   - You'll get a 🎉 notification when new responses are captured

## Troubleshooting

### "Connection refused" error
- One or more servers aren't running
- Check all 3 terminals are active

### "Responses not appearing"
- Verify PROJECT_ID in `proxy/server.js` is: `69119321dff6271fdce6e1fe`
- Check backend terminal for errors
- Make sure MongoDB is running

### "Port already in use"
- Close any existing Node.js or Python processes
- Run: `taskkill /F /IM node.exe` (Windows)
- Run: `taskkill /F /IM python.exe` (Windows)

## Quick Test

After starting all servers, run this in a new terminal:

```bash
curl http://localhost:8080/api/users
```

You should see:
1. Response in your terminal
2. Log in proxy terminal: `✅ Response captured`
3. New response in the UI with notification

## Architecture

```
Your Request → Proxy (8080) → Test API (3000) → Response
                  ↓
            Backend (5000) → MongoDB
                  ↓
            Frontend (5173) displays it
```

The proxy sits in the middle, captures everything, and sends it to the backend for storage.
