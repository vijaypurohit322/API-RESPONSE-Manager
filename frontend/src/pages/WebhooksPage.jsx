import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import webhookService from '../services/webhookService';
import tunnelService from '../services/tunnelService';
import Navbar from '../components/Navbar';
import '../App.css';

const WebhooksPage = () => {
  const navigate = useNavigate();
  const [webhooks, setWebhooks] = useState([]);
  const [tunnels, setTunnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    forwardingEnabled: false,
    targetType: 'none',
    tunnelId: '',
    targetUrl: '',
    expiresIn: 86400, // 24 hours default
    signatureEnabled: false,
    signatureAlgorithm: 'sha256',
    signatureSecret: '',
    signatureHeader: 'x-hub-signature-256',
    // Notifications
    slackEnabled: false,
    slackWebhookUrl: '',
    slackChannel: '',
    slackEvents: ['received', 'forwarded', 'failed'],
    discordEnabled: false,
    discordWebhookUrl: '',
    discordEvents: ['received', 'forwarded', 'failed'],
    emailEnabled: false,
    emailRecipients: '',
    emailEvents: ['received', 'forwarded', 'failed']
  });

  useEffect(() => {
    loadWebhooks();
    loadTunnels();
    const interval = setInterval(loadWebhooks, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadWebhooks = async () => {
    try {
      const data = await webhookService.getWebhooks();
      setWebhooks(data.webhooks);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      setError('Failed to load webhooks');
      setLoading(false);
    }
  };

  const loadTunnels = async () => {
    try {
      const data = await tunnelService.getTunnels({ status: 'active' });
      setTunnels(data.tunnels);
    } catch (error) {
      console.error('Failed to load tunnels:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const webhookData = {
        name: formData.name,
        description: formData.description,
        expiresIn: parseInt(formData.expiresIn)
      };

      if (formData.forwardingEnabled) {
        webhookData.forwarding = {
          enabled: true,
          targetType: formData.targetType,
          tunnelId: formData.targetType === 'tunnel' ? formData.tunnelId : undefined,
          targetUrl: formData.targetType === 'url' ? formData.targetUrl : undefined
        };
      }

      if (formData.signatureEnabled) {
        webhookData.security = {
          signatureValidation: {
            enabled: true,
            algorithm: formData.signatureAlgorithm,
            secret: formData.signatureSecret,
            headerName: formData.signatureHeader,
            encoding: 'hex'
          }
        };
      }

      // Add notifications
      const notifications = {};
      if (formData.slackEnabled) {
        notifications.slack = {
          enabled: true,
          webhookUrl: formData.slackWebhookUrl,
          channel: formData.slackChannel,
          events: formData.slackEvents
        };
      }
      if (formData.discordEnabled) {
        notifications.discord = {
          enabled: true,
          webhookUrl: formData.discordWebhookUrl,
          events: formData.discordEvents
        };
      }
      if (formData.emailEnabled) {
        notifications.email = {
          enabled: true,
          recipients: formData.emailRecipients.split(',').map(e => e.trim()),
          events: formData.emailEvents
        };
      }
      if (Object.keys(notifications).length > 0) {
        webhookData.notifications = notifications;
      }

      const result = await webhookService.createWebhook(webhookData);
      
      setSuccess(`Webhook created! URL: ${result.webhook.webhookUrl}`);
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        forwardingEnabled: false,
        targetType: 'none',
        tunnelId: '',
        targetUrl: '',
        expiresIn: 86400,
        signatureEnabled: false,
        signatureAlgorithm: 'sha256',
        signatureSecret: '',
        signatureHeader: 'x-hub-signature-256',
        slackEnabled: false,
        slackWebhookUrl: '',
        slackChannel: '',
        slackEvents: ['received', 'forwarded', 'failed'],
        discordEnabled: false,
        discordWebhookUrl: '',
        discordEvents: ['received', 'forwarded', 'failed'],
        emailEnabled: false,
        emailRecipients: '',
        emailEvents: ['received', 'forwarded', 'failed']
      });
      loadWebhooks();
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to create webhook');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await webhookService.deleteWebhook(id);
      setSuccess('Webhook deleted successfully');
      loadWebhooks();
    } catch (error) {
      setError('Failed to delete webhook');
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
      case 'paused': return '#f59e0b';
      case 'expired': return 'var(--text-secondary)';
      default: return 'var(--text-secondary)';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="app">
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <h2>Loading webhooks...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>
            🪝 Webhooks
          </h1>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Create Webhook
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

        {webhooks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🪝</div>
            <h2 style={{ marginBottom: '1rem' }}>No Webhooks Yet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Create your first webhook to start receiving and testing webhook requests
            </p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              Create Your First Webhook
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {webhooks.map((webhook) => (
              <div key={webhook._id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/webhooks/${webhook._id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                        {webhook.name}
                      </h3>
                      <span style={{ 
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        backgroundColor: `${getStatusColor(webhook.status)}20`,
                        color: getStatusColor(webhook.status)
                      }}>
                        {webhook.status}
                      </span>
                    </div>
                    
                    {webhook.description && (
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        {webhook.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <code style={{ 
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: 'var(--bg-color)',
                        borderRadius: '0.25rem',
                        fontSize: 'var(--font-size-sm)',
                        wordBreak: 'break-all'
                      }}>
                        {webhook.webhookUrl}
                      </code>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(webhook.webhookUrl);
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: 'var(--font-size-sm)' }}
                      >
                        Copy
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      <div>
                        <strong>{webhook.stats.totalRequests}</strong> requests
                      </div>
                      {webhook.forwarding.enabled && (
                        <div>
                          ↗️ Forwarding to {webhook.forwarding.targetType}
                        </div>
                      )}
                      <div>
                        Created {formatDate(webhook.createdAt)}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(webhook._id);
                    }}
                    className="btn btn-logout"
                    style={{ marginLeft: '1rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Webhook Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  🪝 Create Webhook
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '1.5rem', 
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '0.25rem'
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                {/* Basic Info Section */}
                <div style={{ 
                  marginBottom: '1.5rem',
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: '0.5rem'
                }}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem' }}>
                    Basic Information
                  </h3>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                      Webhook Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., GitHub Push Events, Stripe Payments"
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What is this webhook for?"
                      rows="3"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Forwarding Section */}
                <div style={{ 
                  marginBottom: '1.5rem',
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <input
                      type="checkbox"
                      id="forwarding"
                      checked={formData.forwardingEnabled}
                      onChange={(e) => setFormData({ ...formData, forwardingEnabled: e.target.checked })}
                      style={{ marginRight: '0.75rem', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="forwarding" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', margin: 0 }}>
                      Enable Request Forwarding
                    </label>
                  </div>
                  
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Automatically forward incoming webhooks to your local server or URL
                  </p>

                  {formData.forwardingEnabled && (
                    <div style={{ 
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                          Forward To
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, targetType: 'tunnel' })}
                            style={{
                              padding: '0.75rem',
                              border: `2px solid ${formData.targetType === 'tunnel' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                              borderRadius: '0.5rem',
                              backgroundColor: formData.targetType === 'tunnel' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                              cursor: 'pointer',
                              fontWeight: 'var(--font-weight-medium)',
                              color: formData.targetType === 'tunnel' ? 'var(--primary-color)' : 'var(--text-color)'
                            }}
                          >
                            🚇 Tunnel
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, targetType: 'url' })}
                            style={{
                              padding: '0.75rem',
                              border: `2px solid ${formData.targetType === 'url' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                              borderRadius: '0.5rem',
                              backgroundColor: formData.targetType === 'url' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                              cursor: 'pointer',
                              fontWeight: 'var(--font-weight-medium)',
                              color: formData.targetType === 'url' ? 'var(--primary-color)' : 'var(--text-color)'
                            }}
                          >
                            🌐 URL
                          </button>
                        </div>
                      </div>

                      {formData.targetType === 'tunnel' && (
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                            Select Active Tunnel
                          </label>
                          {tunnels.length === 0 ? (
                            <div style={{ 
                              padding: '1rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              borderRadius: '0.5rem',
                              fontSize: 'var(--font-size-sm)',
                              color: '#ef4444'
                            }}>
                              ⚠️ No active tunnels found. Create a tunnel first.
                            </div>
                          ) : (
                            <select
                              value={formData.tunnelId}
                              onChange={(e) => setFormData({ ...formData, tunnelId: e.target.value })}
                              required
                              style={{ width: '100%' }}
                            >
                              <option value="">Choose a tunnel...</option>
                              {tunnels.map((tunnel) => (
                                <option key={tunnel._id} value={tunnel._id}>
                                  {tunnel.subdomain} - {tunnel.publicUrl} ({tunnel.status})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      {formData.targetType === 'url' && (
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                            Target URL
                          </label>
                          <input
                            type="url"
                            value={formData.targetUrl}
                            onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                            placeholder="https://example.com/webhook"
                            required
                            style={{ width: '100%' }}
                          />
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Enter the full URL where webhooks should be forwarded
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expiration Section */}
                <div style={{ 
                  marginBottom: '1.5rem',
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: '0.5rem'
                }}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem' }}>
                    Expiration
                  </h3>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                      Webhook expires in
                    </label>
                    <select
                      value={formData.expiresIn}
                      onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="3600">1 hour</option>
                      <option value="86400">24 hours (recommended)</option>
                      <option value="604800">7 days</option>
                      <option value="2592000">30 days</option>
                    </select>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      The webhook URL will automatically expire after this duration
                    </p>
                  </div>
                </div>

                {/* Security Section */}
                <div style={{ 
                  marginBottom: '1.5rem',
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <input
                      type="checkbox"
                      id="signature"
                      checked={formData.signatureEnabled}
                      onChange={(e) => setFormData({ ...formData, signatureEnabled: e.target.checked })}
                      style={{ marginRight: '0.75rem', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="signature" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', margin: 0 }}>
                      🔐 Enable Signature Validation
                    </label>
                  </div>
                  
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Verify webhook authenticity using HMAC signatures (like GitHub, Stripe)
                  </p>

                  {formData.signatureEnabled && (
                    <div style={{ 
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                          Algorithm
                        </label>
                        <select
                          value={formData.signatureAlgorithm}
                          onChange={(e) => setFormData({ ...formData, signatureAlgorithm: e.target.value })}
                          style={{ width: '100%' }}
                        >
                          <option value="sha1">SHA-1 (GitHub legacy)</option>
                          <option value="sha256">SHA-256 (recommended)</option>
                          <option value="sha512">SHA-512</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                          Secret Key *
                        </label>
                        <input
                          type="text"
                          value={formData.signatureSecret}
                          onChange={(e) => setFormData({ ...formData, signatureSecret: e.target.value })}
                          placeholder="Enter your webhook secret"
                          required={formData.signatureEnabled}
                          style={{ width: '100%' }}
                        />
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                          This secret will be used to validate webhook signatures
                        </p>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                          Signature Header Name
                        </label>
                        <input
                          type="text"
                          value={formData.signatureHeader}
                          onChange={(e) => setFormData({ ...formData, signatureHeader: e.target.value })}
                          placeholder="x-hub-signature-256"
                          style={{ width: '100%' }}
                        />
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                          Header name where signature will be sent (e.g., x-hub-signature-256 for GitHub)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications Section */}
                <div style={{ 
                  marginBottom: '1.5rem',
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: '0.5rem'
                }}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem' }}>
                    📢 Notifications
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Get notified when webhooks are received, forwarded, or fail
                  </p>

                  {/* Slack */}
                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="slack"
                        checked={formData.slackEnabled}
                        onChange={(e) => setFormData({ ...formData, slackEnabled: e.target.checked })}
                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                      />
                      <label htmlFor="slack" style={{ fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', margin: 0 }}>
                        💬 Slack
                      </label>
                    </div>
                    {formData.slackEnabled && (
                      <div style={{ marginLeft: '1.5rem' }}>
                        <input
                          type="url"
                          value={formData.slackWebhookUrl}
                          onChange={(e) => setFormData({ ...formData, slackWebhookUrl: e.target.value })}
                          placeholder="https://hooks.slack.com/services/..."
                          required={formData.slackEnabled}
                          style={{ width: '100%', marginBottom: '0.5rem' }}
                        />
                        <input
                          type="text"
                          value={formData.slackChannel}
                          onChange={(e) => setFormData({ ...formData, slackChannel: e.target.value })}
                          placeholder="#channel-name (optional)"
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Discord */}
                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="discord"
                        checked={formData.discordEnabled}
                        onChange={(e) => setFormData({ ...formData, discordEnabled: e.target.checked })}
                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                      />
                      <label htmlFor="discord" style={{ fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', margin: 0 }}>
                        🎮 Discord
                      </label>
                    </div>
                    {formData.discordEnabled && (
                      <div style={{ marginLeft: '1.5rem' }}>
                        <input
                          type="url"
                          value={formData.discordWebhookUrl}
                          onChange={(e) => setFormData({ ...formData, discordWebhookUrl: e.target.value })}
                          placeholder="https://discord.com/api/webhooks/..."
                          required={formData.discordEnabled}
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="email"
                        checked={formData.emailEnabled}
                        onChange={(e) => setFormData({ ...formData, emailEnabled: e.target.checked })}
                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                      />
                      <label htmlFor="email" style={{ fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', margin: 0 }}>
                        📧 Email
                      </label>
                    </div>
                    {formData.emailEnabled && (
                      <div style={{ marginLeft: '1.5rem' }}>
                        <input
                          type="text"
                          value={formData.emailRecipients}
                          onChange={(e) => setFormData({ ...formData, emailRecipients: e.target.value })}
                          placeholder="email1@example.com, email2@example.com"
                          required={formData.emailEnabled}
                          style={{ width: '100%' }}
                        />
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                          Comma-separated email addresses
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="btn btn-secondary"
                    style={{ minWidth: '100px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ minWidth: '150px' }}
                  >
                    Create Webhook
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

export default WebhooksPage;
