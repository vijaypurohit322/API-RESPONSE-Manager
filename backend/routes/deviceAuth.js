const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory store for device codes (in production, use Redis)
const deviceCodes = new Map();

// Generate device code and user code
router.post('/code', async (req, res) => {
  try {
    const { provider } = req.body;

    if (!['google', 'github', 'microsoft'].includes(provider)) {
      return res.status(400).json({ msg: 'Invalid provider' });
    }

    // Generate codes
    const device_code = crypto.randomBytes(32).toString('hex');
    const user_code = generateUserCode();
    const expires_in = 600; // 10 minutes

    // Store device code
    deviceCodes.set(device_code, {
      user_code,
      provider,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (expires_in * 1000)
    });

    // Clean up expired codes
    cleanupExpiredCodes();

    res.json({
      device_code,
      user_code,
      verification_uri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/device`,
      expires_in,
      interval: 5 // Poll every 5 seconds
    });
  } catch (error) {
    console.error('Device code error:', error);
    res.status(500).json({ msg: 'Failed to generate device code' });
  }
});

// Poll for token
router.post('/token', async (req, res) => {
  try {
    const { device_code, provider } = req.body;

    const deviceData = deviceCodes.get(device_code);

    if (!deviceData) {
      return res.status(400).json({ msg: 'Invalid device code' });
    }

    if (Date.now() > deviceData.expiresAt) {
      deviceCodes.delete(device_code);
      return res.status(400).json({ msg: 'Device code expired' });
    }

    if (deviceData.status === 'pending') {
      return res.status(428).json({ msg: 'Authorization pending' });
    }

    if (deviceData.status === 'denied') {
      deviceCodes.delete(device_code);
      return res.status(403).json({ msg: 'Authorization denied' });
    }

    if (deviceData.status === 'approved') {
      // Get user from stored data
      const user = await User.findById(deviceData.userId);

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Generate JWT
      const payload = {
        user: {
          id: user.id
        }
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      // Clean up device code
      deviceCodes.delete(device_code);

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    }
  } catch (error) {
    console.error('Device token error:', error);
    res.status(500).json({ msg: 'Failed to get token' });
  }
});

// Verify user code (called from web UI)
router.post('/verify', async (req, res) => {
  try {
    const { user_code } = req.body;

    // Find device code by user code
    let foundDeviceCode = null;
    for (const [deviceCode, data] of deviceCodes.entries()) {
      if (data.user_code === user_code && data.status === 'pending') {
        if (Date.now() < data.expiresAt) {
          foundDeviceCode = deviceCode;
          break;
        }
      }
    }

    if (!foundDeviceCode) {
      return res.status(400).json({ msg: 'Invalid or expired code' });
    }

    const deviceData = deviceCodes.get(foundDeviceCode);

    res.json({
      device_code: foundDeviceCode,
      provider: deviceData.provider,
      valid: true
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ msg: 'Failed to verify code' });
  }
});

// Approve device code (called after OAuth in web UI)
router.post('/approve', async (req, res) => {
  try {
    const { device_code, user_id } = req.body;

    const deviceData = deviceCodes.get(device_code);

    if (!deviceData) {
      return res.status(400).json({ msg: 'Invalid device code' });
    }

    if (Date.now() > deviceData.expiresAt) {
      deviceCodes.delete(device_code);
      return res.status(400).json({ msg: 'Device code expired' });
    }

    // Update status
    deviceData.status = 'approved';
    deviceData.userId = user_id;
    deviceCodes.set(device_code, deviceData);

    res.json({ msg: 'Device approved' });
  } catch (error) {
    console.error('Approve device error:', error);
    res.status(500).json({ msg: 'Failed to approve device' });
  }
});

// Helper functions
function generateUserCode() {
  // Generate a user-friendly code like "ABCD-EFGH"
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [deviceCode, data] of deviceCodes.entries()) {
    if (now > data.expiresAt) {
      deviceCodes.delete(deviceCode);
    }
  }
}

module.exports = router;
