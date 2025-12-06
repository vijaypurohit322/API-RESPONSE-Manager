const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { token, code, redirect_uri } = req.body;

    let email, name, picture, googleId;

    // Handle both flows: ID token (web) and OAuth code (CLI)
    if (token) {
      // Web UI flow - ID token verification
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
      );
      email = response.data.email;
      name = response.data.name;
      picture = response.data.picture;
      googleId = response.data.sub;
    } else if (code) {
      // OAuth code exchange (web or CLI)
      console.log('Google OAuth - Received code:', code ? 'Yes' : 'No');
      console.log('Google OAuth - Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
      console.log('Google OAuth - Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
      console.log('Google OAuth - Redirect URI:', redirect_uri || 'Using default');

      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('Google OAuth credentials not configured');
        return res.status(500).json({ msg: 'Google OAuth not configured on server' });
      }

      // Use redirect_uri from request, or fall back to FRONTEND_URL
      const callbackUri = redirect_uri || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`;

      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          redirect_uri: callbackUri,
          grant_type: 'authorization_code'
        }
      );

      console.log('Google token response:', tokenResponse.data);

      const accessToken = tokenResponse.data.access_token;

      // Get user info
      const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      email = userResponse.data.email;
      name = userResponse.data.name;
      picture = userResponse.data.picture;
      googleId = userResponse.data.id;
    } else {
      return res.status(400).json({ msg: 'Either token or code is required' });
    }

    if (!email) {
      return res.status(400).json({ msg: 'Email not provided by Google' });
    }

    // Check if user exists (using hash for encrypted email lookup)
    let user = await User.findByEmail(email);

    if (!user) {
      // Create new user
      user = new User({
        name,
        email,
        password: Math.random().toString(36).slice(-8), // Random password (won't be used)
        avatar: picture,
        provider: 'google',
        providerId: googleId,
        emailVerified: true // Google emails are verified
      });
      await user.save();
    } else if (!user.provider) {
      // Update existing user with Google info
      user.provider = 'google';
      user.providerId = googleId;
      user.avatar = picture;
      user.emailVerified = true;
      await user.save();
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, jwtToken) => {
        if (err) throw err;
        res.json({ 
          token: jwtToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
          }
        });
      }
    );
  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.status(500).json({ msg: 'Google authentication failed', error: error.message });
  }
});

// GitHub OAuth
router.post('/github', async (req, res) => {
  try {
    const { code } = req.body;

    console.log('GitHub OAuth - Received code:', code ? 'Yes' : 'No');
    console.log('GitHub OAuth - Client ID:', process.env.GITHUB_CLIENT_ID ? 'Set' : 'Missing');
    console.log('GitHub OAuth - Client Secret:', process.env.GITHUB_CLIENT_SECRET ? 'Set' : 'Missing');

    if (!code) {
      return res.status(400).json({ msg: 'Authorization code is required' });
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error('GitHub OAuth credentials not configured');
      return res.status(500).json({ msg: 'GitHub OAuth not configured on server' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    console.log('GitHub token response:', tokenResponse.data);

    const accessToken = tokenResponse.data.access_token;

    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const { login, name, email, avatar_url, id: githubId } = userResponse.data;

    // Get email if not public
    let userEmail = email;
    if (!userEmail) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const primaryEmail = emailResponse.data.find(e => e.primary);
      userEmail = primaryEmail?.email;
    }

    if (!userEmail) {
      return res.status(400).json({ msg: 'Email not provided by GitHub' });
    }

    // Check if user exists (using hash for encrypted email lookup)
    let user = await User.findByEmail(userEmail);

    if (!user) {
      // Create new user
      user = new User({
        name: name || login,
        email: userEmail,
        password: Math.random().toString(36).slice(-8),
        avatar: avatar_url,
        provider: 'github',
        providerId: githubId.toString(),
        emailVerified: true
      });
      await user.save();
    } else if (!user.provider) {
      // Update existing user
      user.provider = 'github';
      user.providerId = githubId.toString();
      user.avatar = avatar_url;
      user.emailVerified = true;
      await user.save();
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
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
    );
  } catch (error) {
    console.error('GitHub OAuth error:', error.response?.data || error.message);
    res.status(500).json({ msg: 'GitHub authentication failed' });
  }
});

// Microsoft OAuth
router.post('/microsoft', async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
        grant_type: 'authorization_code'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Get user info
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const { displayName, mail, userPrincipalName, id: microsoftId } = userResponse.data;
    const email = mail || userPrincipalName;

    if (!email) {
      return res.status(400).json({ msg: 'Email not provided by Microsoft' });
    }

    // Check if user exists (using hash for encrypted email lookup)
    let user = await User.findByEmail(email);

    if (!user) {
      // Create new user
      user = new User({
        name: displayName,
        email,
        password: Math.random().toString(36).slice(-8),
        provider: 'microsoft',
        providerId: microsoftId,
        emailVerified: true
      });
      await user.save();
    } else if (!user.provider) {
      // Update existing user
      user.provider = 'microsoft';
      user.providerId = microsoftId;
      user.emailVerified = true;
      await user.save();
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
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
    );
  } catch (error) {
    console.error('Microsoft OAuth error:', error.response?.data || error.message);
    res.status(500).json({ msg: 'Microsoft authentication failed' });
  }
});

module.exports = router;
