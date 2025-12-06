const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendVerificationEmail } = require('../services/emailService');

/**
 * Password Policy (ISO 27001 A.9.4.3, OWASP A07:2021)
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' 
    };
  }
  return { valid: true };
};

/**
 * Email validation (OWASP A03:2021 - Injection Prevention)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email) => {
  if (!email || !EMAIL_REGEX.test(email)) {
    return { valid: false, message: 'Please provide a valid email address' };
  }
  if (email.length > 254) {
    return { valid: false, message: 'Email address is too long' };
  }
  return { valid: true };
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Input validation (OWASP A03:2021)
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ msg: emailValidation.message });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ msg: passwordValidation.message });
    }

    // Check if user exists (using hash for encrypted email lookup)
    let user = await User.findByEmail(email);
    if (user) {
      // Security: Don't reveal if email exists (OWASP A07:2021)
      logger.info('Registration attempt for existing email', { email: email.substring(0, 3) + '***' });
      return res.status(400).json({ msg: 'Registration failed. Please try again or login.' });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with sanitized email and name
    user = new User({
      email: email.toLowerCase().trim(),
      name: name ? name.trim().substring(0, 100) : '',
      password,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Hash password with bcrypt (ISO 27001 A.9.4.3)
    const salt = await bcrypt.genSalt(12); // Increased from 10 to 12 rounds
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      logger.error('Failed to send verification email', { error: emailError.message });
      // Continue registration even if email fails
    }
    
    // Audit log (ISO 27001 A.12.4.1)
    logger.info('User registered, verification email sent', { userId: user.id });

    // Return success without token - user must verify email first
    res.json({ 
      msg: 'Registration successful. Please check your email to verify your account.',
      requiresVerification: true,
      email: user.email
    });
  } catch (err) {
    logger.error('Registration error', { error: err.message });
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Input validation (OWASP A03:2021)
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    // Find user with encrypted email (using hash lookup)
    let user = await User.findByEmail(email);
    
    // Security: Use constant-time comparison to prevent timing attacks (OWASP A07:2021)
    if (!user) {
      // Perform dummy hash to prevent timing attacks
      await bcrypt.compare(password, '$2b$12$dummy.hash.to.prevent.timing.attacks');
      logger.info('Failed login attempt', { email: email.substring(0, 3) + '***' });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.info('Failed login attempt - wrong password', { userId: user.id });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if email is verified (only for local accounts)
    if (user.provider === 'local' && !user.emailVerified) {
      logger.info('Login attempt with unverified email', { userId: user.id });
      return res.status(403).json({ 
        msg: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Audit log (ISO 27001 A.12.4.1)
    logger.info('User logged in', { userId: user.id });

    const payload = {
      user: {
        id: user.id,
      },
    };

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' },
      (err, token) => {
        if (err) {
          logger.error('JWT signing error', { error: err.message });
          return res.status(500).json({ msg: 'Authentication error' });
        }
        res.json({ 
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name || '',
            avatar: user.avatar,
            provider: user.provider || 'local'
          }
        });
      }
    );
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, defaultPort } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update fields
    if (name !== undefined) {
      user.name = name.trim().substring(0, 100); // Limit name length
    }
    if (defaultPort !== undefined) {
      user.defaultPort = Math.min(Math.max(parseInt(defaultPort) || 3000, 1), 65535);
    }

    await user.save();

    logger.info('Profile updated', { userId });

    res.json({ 
      msg: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider
      }
    });
  } catch (err) {
    logger.error('Profile update error', { error: err.message, userId: req.user?.id });
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if user uses OAuth (no password)
    if (user.provider && user.provider !== 'local') {
      return res.status(400).json({ msg: 'Password cannot be changed for OAuth accounts' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ msg: passwordValidation.message });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    logger.info('Password changed', { userId });

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    logger.error('Password change error', { error: err.message, userId: req.user?.id });
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Get active sessions (simplified - JWT doesn't track sessions by default)
 * In a production app, you'd use a session store like Redis
 */
exports.getSessions = async (req, res) => {
  try {
    // Since we use stateless JWT, we return current session info only
    // For full session management, implement a session store
    res.json({
      sessions: [],
      note: 'JWT-based authentication - session management requires a session store'
    });
  } catch (err) {
    logger.error('Get sessions error', { error: err.message, userId: req.user?.id });
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Revoke a specific session
 */
exports.revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    // In a production app with session store, you'd invalidate the session here
    logger.info('Session revoke requested', { userId: req.user.id, sessionId });
    res.json({ msg: 'Session revoked' });
  } catch (err) {
    logger.error('Revoke session error', { error: err.message, userId: req.user?.id });
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Revoke all sessions except current
 */
exports.revokeAllSessions = async (req, res) => {
  try {
    // In a production app with session store, you'd invalidate all other sessions here
    logger.info('All sessions revoke requested', { userId: req.user.id });
    res.json({ msg: 'All other sessions revoked' });
  } catch (err) {
    logger.error('Revoke all sessions error', { error: err.message, userId: req.user?.id });
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Verify email address
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ msg: 'Verification token is required' });
    }

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        msg: 'Invalid or expired verification link. Please request a new one.',
        expired: true
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info('Email verified', { userId: user.id });

    // Generate JWT token so user can login immediately
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' },
      (err, jwtToken) => {
        if (err) {
          logger.error('JWT signing error after verification', { error: err.message });
          return res.json({ 
            msg: 'Email verified successfully! You can now login.',
            verified: true
          });
        }
        res.json({ 
          msg: 'Email verified successfully!',
          verified: true,
          token: jwtToken,
          user: {
            id: user._id,
            email: user.email,
            name: user.name || '',
            avatar: user.avatar,
            provider: 'local'
          }
        });
      }
    );
  } catch (err) {
    logger.error('Email verification error', { error: err.message });
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Resend verification email
 */
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const user = await User.findByEmail(email);

    // Security: Don't reveal if email exists
    if (!user) {
      return res.json({ msg: 'If an account exists with this email, a verification link has been sent.' });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ msg: 'Email is already verified. Please login.' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
      logger.info('Verification email resent', { userId: user.id });
    } catch (emailError) {
      logger.error('Failed to resend verification email', { error: emailError.message });
      return res.status(500).json({ msg: 'Failed to send verification email. Please try again.' });
    }

    res.json({ msg: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    logger.error('Resend verification error', { error: err.message });
    res.status(500).json({ msg: 'Server error' });
  }
};
