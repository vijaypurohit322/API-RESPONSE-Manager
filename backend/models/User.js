const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
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
});

module.exports = mongoose.model('User', UserSchema);
