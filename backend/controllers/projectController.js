const Project = require('../models/Project');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Security: Input validation helpers
const sanitizeName = (name) => {
  if (typeof name !== 'string') return '';
  return name.replace(/[<>]/g, '').trim().substring(0, 100);
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && 
         new mongoose.Types.ObjectId(id).toString() === id;
};

exports.createProject = async (req, res) => {
  const { name } = req.body;
  
  try {
    // Security: Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        msg: 'Invalid project name',
        error: 'Project name is required and must be a non-empty string'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({ 
        msg: 'Project name too long',
        error: 'Project name must be 100 characters or less'
      });
    }

    // Security: Generate cryptographically secure share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    
    const newProject = new Project({
      name: sanitizeName(name),
      user: req.user.id,
      shareToken,
    });
    
    const project = await newProject.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.getProjectByShareToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Validate token format
    if (!token || token.trim() === '') {
      console.warn('Empty share token provided');
      return res.status(400).json({ 
        msg: 'Invalid share token',
        error: 'Share token is required'
      });
    }

    console.log(`Attempting to find project with share token: ${token.substring(0, 8)}...`);
    
    const project = await Project.findOne({ shareToken: token });
    
    if (!project) {
      console.warn(`Project not found for share token: ${token.substring(0, 8)}...`);
      return res.status(404).json({ 
        msg: 'Project not found',
        error: 'This project does not exist or the share link is invalid'
      });
    }

    console.log(`Successfully found project: ${project._id} with name: ${project.name}`);
    res.json(project);
  } catch (err) {
    console.error('Error in getProjectByShareToken:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Security: Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        msg: 'Invalid project ID format',
        error: 'Project ID must be a valid identifier'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ 
        msg: 'Project not found',
        error: 'The requested project does not exist'
      });
    }
    
    // Security: Verify ownership (403 Forbidden, not 401)
    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        msg: 'Access denied',
        error: 'You do not have permission to access this project'
      });
    }
    
    res.json(project);
  } catch (err) {
    console.error('Error getting project:', err.message);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.updateProject = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  
  try {
    // Security: Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        msg: 'Invalid project ID format',
        error: 'Project ID must be a valid identifier'
      });
    }

    // Security: Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        msg: 'Invalid project name',
        error: 'Project name is required'
      });
    }

    let project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ 
        msg: 'Project not found',
        error: 'The requested project does not exist'
      });
    }
    
    // Security: Verify ownership
    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        msg: 'Access denied',
        error: 'You do not have permission to modify this project'
      });
    }
    
    project = await Project.findByIdAndUpdate(
      id,
      { $set: { name: sanitizeName(name) } },
      { new: true }
    );
    
    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err.message);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Security: Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        msg: 'Invalid project ID format',
        error: 'Project ID must be a valid identifier'
      });
    }

    let project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ 
        msg: 'Project not found',
        error: 'The requested project does not exist'
      });
    }
    
    // Security: Verify ownership
    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        msg: 'Access denied',
        error: 'You do not have permission to delete this project'
      });
    }
    
    await Project.findByIdAndDelete(id);
    res.json({ msg: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err.message);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};
