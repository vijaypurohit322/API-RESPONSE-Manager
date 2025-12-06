const mongoose = require('mongoose');
const { encrypt, decrypt, isEncrypted } = require('../utils/encryption');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    get: function(val) { return val ? decrypt(val) : val; },
    set: function(val) { 
      if (val && !isEncrypted(val)) {
        return encrypt(val);
      }
      return val;
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  shareToken: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: { getters: true },
  toObject: { getters: true },
});

module.exports = mongoose.model('Project', ProjectSchema);
