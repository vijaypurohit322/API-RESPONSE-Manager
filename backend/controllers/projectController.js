const Project = require('../models/Project');
const crypto = require('crypto');

exports.createProject = async (req, res) => {
  const { name } = req.body;
  try {
    const shareToken = crypto.randomBytes(16).toString('hex');
    const newProject = new Project({
      name,
      user: req.user.id,
      shareToken,
    });
    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getProjectByShareToken = async (req, res) => {
  try {
    const project = await Project.findOne({ shareToken: req.params.token });
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
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
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateProject = async (req, res) => {
  const { name } = req.body;
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: { name } },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await Project.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
