const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter based on environment
const createTransporter = () => {
  // Use SMTP settings from environment
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Gmail if GMAIL credentials provided
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // Development: log emails to console
  logger.warn('No email configuration found. Emails will be logged to console.');
  return null;
};

const transporter = createTransporter();

/**
 * Send verification email to user
 */
const sendVerificationEmail = async (email, name, verificationToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"TunnelAPI" <${process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@tunnelapi.in'}>`,
    to: email,
    subject: 'Verify your TunnelAPI account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <!-- TunnelAPI Logo SVG -->
            <svg width="48" height="48" viewBox="0 0 100 100" style="display: block; margin: 0 auto 12px;">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#e0e7ff;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGrad)" stroke-width="3" opacity="0.3"/>
              <circle cx="50" cy="50" r="32" fill="none" stroke="url(#logoGrad)" stroke-width="3" opacity="0.5"/>
              <circle cx="50" cy="50" r="18" fill="url(#logoGrad)"/>
              <path d="M30 50 L44 50 M56 50 L70 50" stroke="url(#logoGrad)" stroke-width="3" stroke-linecap="round"/>
              <path d="M50 30 L50 44 M50 56 L50 70" stroke="url(#logoGrad)" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">TunnelAPI</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <h2 style="color: #18181b; margin: 0 0 16px;">Verify your email address</h2>
            <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px;">
              Hi${name ? ` ${name}` : ''},<br><br>
              Thanks for signing up for TunnelAPI! Please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
            
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationLink}" style="color: #6366f1; word-break: break-all;">${verificationLink}</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #fafafa; padding: 20px 32px; text-align: center;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
              © 2025 TunnelAPI. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Verify your TunnelAPI account
      
      Hi${name ? ` ${name}` : ''},
      
      Thanks for signing up for TunnelAPI! Please verify your email address by clicking the link below:
      
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, you can safely ignore this email.
      
      - TunnelAPI Team
    `,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      logger.info('Verification email sent', { email: email.substring(0, 3) + '***' });
      return true;
    } catch (error) {
      logger.error('Failed to send verification email', { error: error.message });
      throw error;
    }
  } else {
    // Development mode: log to console
    logger.info('=== VERIFICATION EMAIL (Dev Mode) ===');
    logger.info(`To: ${email}`);
    logger.info(`Verification Link: ${verificationLink}`);
    logger.info('=====================================');
    return true;
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"TunnelAPI" <${process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@tunnelapi.in'}>`,
    to: email,
    subject: 'Reset your TunnelAPI password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <!-- TunnelAPI Logo SVG -->
            <svg width="48" height="48" viewBox="0 0 100 100" style="display: block; margin: 0 auto 12px;">
              <defs>
                <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#e0e7ff;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGrad2)" stroke-width="3" opacity="0.3"/>
              <circle cx="50" cy="50" r="32" fill="none" stroke="url(#logoGrad2)" stroke-width="3" opacity="0.5"/>
              <circle cx="50" cy="50" r="18" fill="url(#logoGrad2)"/>
              <path d="M30 50 L44 50 M56 50 L70 50" stroke="url(#logoGrad2)" stroke-width="3" stroke-linecap="round"/>
              <path d="M50 30 L50 44 M50 56 L50 70" stroke="url(#logoGrad2)" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">TunnelAPI</h1>
          </div>
          
          <div style="padding: 32px;">
            <h2 style="color: #18181b; margin: 0 0 16px;">Reset your password</h2>
            <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px;">
              Hi${name ? ` ${name}` : ''},<br><br>
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="background: #fafafa; padding: 20px 32px; text-align: center;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
              © 2025 TunnelAPI. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Reset your TunnelAPI password
      
      Hi${name ? ` ${name}` : ''},
      
      We received a request to reset your password. Click the link below to create a new password:
      
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
      
      - TunnelAPI Team
    `,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      logger.info('Password reset email sent', { email: email.substring(0, 3) + '***' });
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email', { error: error.message });
      throw error;
    }
  } else {
    logger.info('=== PASSWORD RESET EMAIL (Dev Mode) ===');
    logger.info(`To: ${email}`);
    logger.info(`Reset Link: ${resetLink}`);
    logger.info('========================================');
    return true;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
