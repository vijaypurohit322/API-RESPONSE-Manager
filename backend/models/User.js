const mongoose = require('mongoose');
const { encrypt, decrypt, hashForSearch, isEncrypted } = require('../utils/encryption');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    get: function(val) { return val ? decrypt(val) : val; },
    set: function(val) { 
      if (val && !isEncrypted(val)) {
        return encrypt(val);
      }
      return val;
    }
  },
  email: {
    type: String,
    required: true,
    get: function(val) { return val ? decrypt(val) : val; },
    set: function(val) {
      if (val && !isEncrypted(val)) {
        // Store hash for searching when setting new email
        this.emailHash = hashForSearch(val.toLowerCase().trim());
        return encrypt(val);
      }
      return val;
    }
  },
  emailHash: {
    type: String,
    unique: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: false,
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'github', 'microsoft'],
    default: 'local',
  },
  providerId: {
    type: String,
    required: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    required: false,
  },
  emailVerificationExpires: {
    type: Date,
    required: false,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  defaultPort: {
    type: Number,
    default: 3000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  // Enable getters when converting to JSON/Object
  toJSON: { getters: true },
  toObject: { getters: true },
});

// Static method to find user by email (using hash)
UserSchema.statics.findByEmail = async function(email) {
  const emailHash = hashForSearch(email.toLowerCase().trim());
  const user = await this.findOne({ emailHash });
  return user;
};

module.exports = mongoose.model('User', UserSchema);
