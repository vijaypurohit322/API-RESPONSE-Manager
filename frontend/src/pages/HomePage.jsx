import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../App.css';

const HomePage = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    window.location = '/login';
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">📡 API Response Manager</div>
        <ul className="navbar-nav">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/projects">Projects</Link></li>
          <li>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </li>
        </ul>
      </nav>

      <div className="container">
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Welcome to API Response Manager
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Capture, share, and collaborate on API responses with your team
          </p>
          <Link to="/projects">
            <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
              View Projects →
            </button>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Capture Responses</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Use our proxy server to automatically capture API responses from your local backend</p>
          </div>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔗</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Share Links</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Generate unique shareable links for your projects to collaborate with your team</p>
          </div>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Collaborate</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Add comments to API responses to facilitate team communication</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
