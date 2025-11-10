const mongoose = require('mongoose');

const ApiResponseSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  requestMethod: {
    type: String,
    required: true,
  },
  requestUrl: {
    type: String,
    required: true,
  },
  requestHeaders: {
    type: Object,
  },
  requestBody: {
    type: Object,
  },
  responseStatusCode: {
    type: Number,
  },
  responseHeaders: {
    type: Object,
  },
  responseBody: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ApiResponse', ApiResponseSchema);
