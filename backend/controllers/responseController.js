const ApiResponse = require('../models/ApiResponse');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// Input validation helper
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potential XSS/injection characters
    return input.replace(/[<>]/g, '').trim().substring(0, 10000);
  }
  return input;
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && 
         new mongoose.Types.ObjectId(id).toString() === id;
};

exports.createResponse = async (req, res) => {
  const {
    projectId,
    requestMethod,
    requestUrl,
    requestHeaders,
    requestBody,
    responseStatusCode,
    responseHeaders,
    responseBody,
  } = req.body;
  
  try {
    // Security: Validate projectId format
    if (!projectId || !isValidObjectId(projectId)) {
      return res.status(400).json({ 
        msg: 'Invalid project ID format',
        error: 'projectId must be a valid MongoDB ObjectId'
      });
    }

    // Security: Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        msg: 'Project not found',
        error: 'The specified project does not exist'
      });
    }

    // Security: Validate request method
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(requestMethod?.toUpperCase())) {
      return res.status(400).json({ 
        msg: 'Invalid request method',
        error: 'requestMethod must be a valid HTTP method'
      });
    }

    // Security: Validate URL format
    if (!requestUrl || typeof requestUrl !== 'string') {
      return res.status(400).json({ 
        msg: 'Invalid request URL',
        error: 'requestUrl is required and must be a string'
      });
    }

    const newResponse = new ApiResponse({
      project: projectId,
      requestMethod: requestMethod.toUpperCase(),
      requestUrl: sanitizeInput(requestUrl),
      requestHeaders: requestHeaders || {},
      requestBody: requestBody || {},
      responseStatusCode: parseInt(responseStatusCode) || 200,
      responseHeaders: responseHeaders || {},
      responseBody: responseBody || {},
    });
    
    const response = await newResponse.save();
    res.status(201).json(response);
  } catch (err) {
    console.error('Error creating response:', err.message);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.getResponses = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Security: Validate projectId format
    if (!projectId || !isValidObjectId(projectId)) {
      return res.status(400).json({ 
        msg: 'Invalid project ID format',
        error: 'projectId must be a valid MongoDB ObjectId'
      });
    }

    // Security: Verify project exists before returning responses
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        msg: 'Project not found',
        error: 'The specified project does not exist'
      });
    }

    console.log(`Fetching responses for project: ${projectId}`);
    
    // Limit response count to prevent DoS
    const responses = await ApiResponse.find({ project: projectId })
      .sort({ createdAt: -1 })
      .limit(1000);
    
    console.log(`Found ${responses.length} responses for project: ${projectId}`);
    res.json(responses);
  } catch (err) {
    console.error('Error in getResponses:', err.message);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.deleteResponse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Security: Validate response ID format
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        msg: 'Invalid response ID format',
        error: 'id must be a valid MongoDB ObjectId'
      });
    }

    const response = await ApiResponse.findById(id).populate('project');
    
    if (!response) {
      return res.status(404).json({ msg: 'Response not found' });
    }

    // Security: Verify user owns the project
    if (response.project.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        msg: 'Access denied',
        error: 'You do not have permission to delete this response'
      });
    }

    await ApiResponse.findByIdAndDelete(id);
    res.json({ msg: 'Response deleted successfully' });
  } catch (err) {
    console.error('Error deleting response:', err.message);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};
