import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tunnelService from '../services/tunnelService';
import Navbar from '../components/Navbar';
import '../App.css';

const TunnelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tunnel, setTunnel] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTunnelData();
    const interval = setInterval(loadTunnelData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [id]);

  const loadTunnelData = async () => {
    try {
      const [tunnelData, statsData] = await Promise.all([
        tunnelService.getTunnelById(id),
        tunnelService.getTunnelStats(id)
      ]);
      setTunnel(tunnelData.tunnel);
      setStats(statsData.stats);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load tunnel:', error);
      setError('Failed to load tunnel details');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tunnel?')) return;

    try {
      await tunnelService.deleteTunnel(id);
      navigate('/tunnels');
    } catch (error) {
      setError('Failed to delete tunnel');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
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

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="app">
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <h2>Loading tunnel details...</h2>
        </div>
      </div>
    );
  }

  if (error && !tunnel) {
    return (
      <div className="app">
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="alert alert-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => navigate('/tunnels')}
            className="btn btn-secondary"
            style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Tunnels
          </button>

          <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9, marginBottom: '0.5rem' }}>TUNNEL</div>
                <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: '0.5rem' }}>
                  {tunnel.subdomain}
                </h1>
                <div style={{ 
                  fontSize: 'var(--font-size-base)', 
                  opacity: 0.9,
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '1rem',
                  textTransform: 'uppercase',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  {tunnel.status}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '3rem' }}>🚇</div>
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Connection Info */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem' }}>
            Connection Information
          </h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Public URL
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <code style={{ 
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: '0.5rem',
                  fontSize: 'var(--font-size-base)',
                  wordBreak: 'break-all'
                }}>
                  {tunnel.publicUrl}
                </code>
                <button 
                  onClick={() => copyToClipboard(tunnel.publicUrl)}
                  className="btn btn-secondary"
                >
                  Copy
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Local Port
                </label>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                  {tunnel.localPort}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Subdomain
                </label>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                  {tunnel.subdomain}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Status
                </label>
                <div style={{ 
                  fontSize: 'var(--font-size-lg)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: getStatusColor(tunnel.status)
                }}>
                  {tunnel.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem' }}>
              Statistics
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Total Requests
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--primary-color)' }}>
                  {stats.requestCount.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Data Transferred
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--secondary-color)' }}>
                  {formatBytes(stats.bytesTransferred)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Uptime
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  {formatUptime(stats.uptime)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Last Heartbeat
                </div>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-medium)' }}>
                  {formatDate(stats.lastHeartbeat)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem' }}>
            Configuration
          </h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Rate Limit</span>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {tunnel.rateLimit.requestsPerMinute} requests/min
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Authentication</span>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {tunnel.authentication.enabled ? tunnel.authentication.type : 'Disabled'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Created</span>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {formatDate(tunnel.createdAt)}
              </span>
            </div>

            {tunnel.expiresAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem' }}>
                <span style={{ color: '#f59e0b' }}>⏰ Expires</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)', color: '#f59e0b' }}>
                  {formatDate(tunnel.expiresAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Connection Command */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem' }}>
            Connect Tunnel Client
          </h2>
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Run this command to connect your local server to the tunnel:
          </p>

          <div style={{ position: 'relative' }}>
            <pre style={{ 
              padding: '1rem',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: 'var(--font-size-sm)'
            }}>
cd tunnel-client{'\n'}
node client.js {tunnel._id} {tunnel.subdomain} {tunnel.localPort} &lt;your-auth-token&gt; &lt;your-user-id&gt;
            </pre>
            <button 
              onClick={() => copyToClipboard(`cd tunnel-client\nnode client.js ${tunnel._id} ${tunnel.subdomain} ${tunnel.localPort} <your-auth-token> <your-user-id>`)}
              className="btn btn-secondary"
              style={{ 
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              Copy
            </button>
          </div>

          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: 'var(--font-size-sm)' }}>
            💡 Replace <code>&lt;your-auth-token&gt;</code> and <code>&lt;your-user-id&gt;</code> with your actual credentials
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleDelete}
            className="btn btn-logout"
          >
            Delete Tunnel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TunnelDetailPage;
