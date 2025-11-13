import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import tunnelService from '../services/tunnelService';
import Navbar from '../components/Navbar';
import '../App.css';

const TunnelsPage = () => {
  const [tunnels, setTunnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [localPort, setLocalPort] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [customSubdomain, setCustomSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [rateLimit, setRateLimit] = useState(60);
  const [expiresIn, setExpiresIn] = useState('');

  useEffect(() => {
    loadTunnels();
    const interval = setInterval(loadTunnels, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTunnels = async () => {
    try {
      const data = await tunnelService.getTunnels();
      setTunnels(data.tunnels);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load tunnels:', error);
      setError('Failed to load tunnels');
      setLoading(false);
    }
  };

  const checkSubdomainAvailability = async (sub) => {
    if (!sub || sub.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setCheckingSubdomain(true);
    try {
      const data = await tunnelService.checkSubdomain(sub);
      setSubdomainAvailable(data.available);
    } catch (error) {
      console.error('Failed to check subdomain:', error);
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const handleSubdomainChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(value);
    
    // Debounce check
    clearTimeout(window.subdomainCheckTimeout);
    window.subdomainCheckTimeout = setTimeout(() => {
      checkSubdomainAvailability(value);
    }, 500);
  };

  const handleCreateTunnel = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!localPort || localPort < 1 || localPort > 65535) {
      setError('Please enter a valid port number (1-65535)');
      return;
    }

    if (customSubdomain && subdomain && !subdomainAvailable) {
      setError('Subdomain is not available');
      return;
    }

    try {
      const tunnelData = {
        localPort: parseInt(localPort),
        subdomain: customSubdomain ? subdomain : undefined,
        rateLimit: {
          requestsPerMinute: parseInt(rateLimit),
          enabled: true
        },
        expiresIn: expiresIn ? parseInt(expiresIn) * 3600 : undefined
      };

      const data = await tunnelService.createTunnel(tunnelData);
      setSuccess('Tunnel created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadTunnels();

      // Show connection instructions
      alert(`Tunnel Created!\n\nPublic URL: ${data.tunnel.publicUrl}\n\nTo connect, run:\ncd tunnel-client\nnode client.js ${data.tunnel.id} ${data.tunnel.subdomain} ${localPort} <your-auth-token> <your-user-id>`);
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to create tunnel');
    }
  };

  const handleDeleteTunnel = async (id) => {
    if (!confirm('Are you sure you want to delete this tunnel?')) return;

    try {
      await tunnelService.deleteTunnel(id);
      setSuccess('Tunnel deleted successfully');
      loadTunnels();
    } catch (error) {
      setError('Failed to delete tunnel');
    }
  };

  const resetForm = () => {
    setLocalPort('');
    setSubdomain('');
    setCustomSubdomain(false);
    setSubdomainAvailable(null);
    setRateLimit(60);
    setExpiresIn('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--secondary-color)';
      case 'connecting': return '#f59e0b';
      case 'inactive': return 'var(--text-secondary)';
      case 'error': return '#ef4444';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'connecting': return '🟡';
      case 'inactive': return '⚫';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  if (loading) {
    return (
      <div className="app">
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <h2>Loading tunnels...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: '0.5rem' }}>
              Tunnels
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Expose your local APIs to the internet with secure public URLs
            </p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Tunnel
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        {tunnels.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚇</div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.5rem' }}>No Tunnels Yet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Create your first tunnel to expose your local API to the internet
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Create Your First Tunnel
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tunnels.map((tunnel) => (
              <div key={tunnel._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{getStatusIcon(tunnel.status)}</span>
                      <div>
                        <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.25rem' }}>
                          {tunnel.subdomain}
                        </h3>
                        <span style={{ 
                          fontSize: 'var(--font-size-sm)', 
                          color: getStatusColor(tunnel.status),
                          fontWeight: 'var(--font-weight-medium)',
                          textTransform: 'uppercase'
                        }}>
                          {tunnel.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: 'var(--font-size-sm)' }}>Public URL:</strong>
                        <code style={{ 
                          fontSize: 'var(--font-size-sm)', 
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'var(--bg-color)',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => copyToClipboard(tunnel.publicUrl)}>
                          {tunnel.publicUrl}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(tunnel.publicUrl)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: 'var(--font-size-xs)' }}
                        >
                          Copy
                        </button>
                      </div>

                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        <strong>Local Port:</strong> {tunnel.localPort} • 
                        <strong> Requests:</strong> {tunnel.requestCount} • 
                        <strong> Created:</strong> {formatDate(tunnel.createdAt)}
                      </div>

                      {tunnel.expiresAt && (
                        <div style={{ fontSize: 'var(--font-size-sm)', color: '#f59e0b' }}>
                          ⏰ Expires: {formatDate(tunnel.expiresAt)}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link 
                        to={`/tunnels/${tunnel._id}`}
                        className="btn btn-secondary"
                        style={{ fontSize: 'var(--font-size-sm)' }}
                      >
                        View Details
                      </Link>
                      <button 
                        onClick={() => handleDeleteTunnel(tunnel._id)}
                        className="btn btn-logout"
                        style={{ fontSize: 'var(--font-size-sm)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Tunnel Modal */}
        {showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ 
              maxWidth: '500px', 
              width: '90%', 
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  Create New Tunnel
                </h2>
                <button 
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '1.5rem', 
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateTunnel}>
                <div className="form-group">
                  <label className="form-label">Local Port *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={localPort}
                    onChange={(e) => setLocalPort(e.target.value)}
                    placeholder="3000"
                    min="1"
                    max="65535"
                    required
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                    The port your local server is running on
                  </small>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={customSubdomain}
                      onChange={(e) => setCustomSubdomain(e.target.checked)}
                    />
                    <span className="form-label" style={{ margin: 0 }}>Custom Subdomain</span>
                  </label>
                  
                  {customSubdomain && (
                    <>
                      <input
                        type="text"
                        className="form-control"
                        value={subdomain}
                        onChange={handleSubdomainChange}
                        placeholder="myapi"
                        pattern="[a-z0-9-]+"
                        minLength="3"
                      />
                      {checkingSubdomain && (
                        <small style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                          Checking availability...
                        </small>
                      )}
                      {!checkingSubdomain && subdomain && subdomainAvailable !== null && (
                        <small style={{ 
                          color: subdomainAvailable ? 'var(--secondary-color)' : '#ef4444',
                          fontSize: 'var(--font-size-xs)'
                        }}>
                          {subdomainAvailable ? '✓ Available' : '✗ Not available'}
                        </small>
                      )}
                      <small style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', display: 'block', marginTop: '0.25rem' }}>
                        Only lowercase letters, numbers, and hyphens
                      </small>
                    </>
                  )}
                  {!customSubdomain && (
                    <small style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                      A random subdomain will be generated
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Rate Limit (requests/minute)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    min="1"
                    max="1000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expires In (hours)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    placeholder="Leave empty for no expiration"
                    min="1"
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                    Optional: Tunnel will automatically close after this time
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Create Tunnel
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TunnelsPage;
