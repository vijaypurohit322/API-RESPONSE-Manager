/**
 * Field-Level Encryption for GDPR Compliance
 * Uses AES-256-GCM for authenticated encryption
 * 
 * GDPR Article 32: Security of processing
 * - Encryption of personal data
 * - Ability to ensure confidentiality, integrity
 */

const crypto = require('crypto');
const logger = require('./logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

// Get encryption key from environment
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    logger.warn('ENCRYPTION_KEY not set - using fallback (NOT SECURE FOR PRODUCTION)');
    return crypto.scryptSync('default-key-change-me', 'salt', 32);
  }
  // If key is hex string, convert to buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  // Otherwise derive key from string
  return crypto.scryptSync(key, 'tunnelapi-salt', 32);
};

/**
 * Encrypt sensitive data
 * @param {string} plaintext - Data to encrypt
 * @returns {string} - Encrypted data in format: iv:authTag:ciphertext (base64)
 */
const encrypt = (plaintext) => {
  if (!plaintext || typeof plaintext !== 'string') {
    return plaintext;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:ciphertext (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption error', { error: error.message });
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:ciphertext
 * @returns {string} - Decrypted plaintext
 */
const decrypt = (encryptedData) => {
  if (!encryptedData || typeof encryptedData !== 'string') {
    return encryptedData;
  }

  // Check if data is encrypted (has our format)
  if (!encryptedData.includes(':')) {
    return encryptedData; // Return as-is if not encrypted
  }

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      return encryptedData; // Not our encrypted format
    }

    const [ivBase64, authTagBase64, ciphertext] = parts;
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails, data might not be encrypted
    logger.debug('Decryption failed - data may not be encrypted', { error: error.message });
    return encryptedData;
  }
};

/**
 * Check if a string is encrypted
 * @param {string} data - Data to check
 * @returns {boolean}
 */
const isEncrypted = (data) => {
  if (!data || typeof data !== 'string') return false;
  const parts = data.split(':');
  if (parts.length !== 3) return false;
  
  try {
    // Check if parts are valid base64
    Buffer.from(parts[0], 'base64');
    Buffer.from(parts[1], 'base64');
    Buffer.from(parts[2], 'base64');
    return true;
  } catch {
    return false;
  }
};

/**
 * Hash data for searching (one-way, deterministic)
 * Used for searching encrypted fields without decrypting
 * @param {string} data - Data to hash
 * @returns {string} - SHA-256 hash
 */
const hashForSearch = (data) => {
  if (!data) return null;
  const key = getEncryptionKey();
  return crypto.createHmac('sha256', key).update(data.toLowerCase()).digest('hex');
};

/**
 * Encrypt an object's specified fields
 * @param {Object} obj - Object to encrypt fields in
 * @param {string[]} fields - Field names to encrypt
 * @returns {Object} - Object with encrypted fields
 */
const encryptFields = (obj, fields) => {
  if (!obj) return obj;
  
  const encrypted = { ...obj };
  for (const field of fields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  return encrypted;
};

/**
 * Decrypt an object's specified fields
 * @param {Object} obj - Object to decrypt fields in
 * @param {string[]} fields - Field names to decrypt
 * @returns {Object} - Object with decrypted fields
 */
const decryptFields = (obj, fields) => {
  if (!obj) return obj;
  
  const decrypted = { ...obj };
  for (const field of fields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field]);
    }
  }
  return decrypted;
};

// GDPR-sensitive fields that should be encrypted
const SENSITIVE_USER_FIELDS = ['email', 'name'];
const SENSITIVE_PROJECT_FIELDS = ['name', 'description'];

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
  hashForSearch,
  encryptFields,
  decryptFields,
  SENSITIVE_USER_FIELDS,
  SENSITIVE_PROJECT_FIELDS,
};
