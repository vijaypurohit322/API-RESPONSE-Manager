import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import projectService from '../services/projectService';
import authService from '../services/authService';
import Navbar from '../components/Navbar';
import '../App.css';

const ProjectPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getProjects();
      setProjects(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load projects', error);
      setError('Failed to load projects');
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const response = await projectService.createProject(name);
      setProjects([...projects, response.data]);
      setName('');
      setShowCreateForm(false);
      setError('');
    } catch (error) {
      setError('Failed to create project');
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location = '/login';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="app">
      <Navbar />

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: '0.5rem' }}>My Projects</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>Manage your API response capture projects</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="btn btn-primary"
          >
            {showCreateForm ? '✕ Cancel' : '+ New Project'}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter project name"
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowCreateForm(false); setName(''); }} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📂</div>
            <h3 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.5rem' }}>No projects yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: 'var(--font-size-base)' }}>
              Create your first project to start capturing API responses
            </p>
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
              + Create Your First Project
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {projects.map((project) => (
              <div
                key={project._id}
                className="card"
                onClick={() => navigate(`/projects/${project._id}`)}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>📊</div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDate(project.createdAt)}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {project.name}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Project ID: {project._id}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '500' }}>
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;
