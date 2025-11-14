import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import webhookService from '../services/webhookService';
import Navbar from '../components/Navbar';
import '../App.css';

const WebhookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [webhook, setWebhook] = useState(null);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [editedRequest, setEditedRequest] = useState({
    headers: {},
    body: {},
    method: 'POST'
  });

  useEffect(() => {
    loadWebhookData();
    const interval = setInterval(loadWebhookData, 3000);
    return () => clearInterval(interval);
  }, [id, filter]);

  const loadWebhookData = async () => {
    try {
      console.log('Loading webhook data for ID:', id);
      
      const [webhookData, statsData, requestsData] = await Promise.all([
        webhookService.getWebhookById(id),
        webhookService.getWebhookStats(id),
        webhookService.getWebhookRequests(id, filter !== 'all' ? { status: filter } : {})
      ]);
      
      console.log('Webhook data loaded:', { webhookData, statsData, requestsData });
      
      setWebhook(webhookData.webhook);
      setStats(statsData.stats);
      setRequests(requestsData.requests);
      setLoading(false);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Failed to load webhook:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError(error.response?.data?.msg || 'Failed to load webhook details');
      setLoading(false);
    }
  };

  const handleReplay = async (requestId) => {
    try {
      await webhookService.replayWebhookRequest(id, requestId);
      setSuccess('Webhook replayed successfully');
      loadWebhookData();
    } catch (error) {
      setError('Failed to replay webhook');
    }
  };

  const handleEdit = (request) => {
    setEditedRequest({
      headers: request.headers || {},
      body: request.body || {},
      method: request.method || 'POST'
    });
    setEditMode(true);
    setSelectedRequest(request);
  };

  const handleResend = async () => {
    try {
      await webhookService.resendWebhookRequest(id, selectedRequest._id, editedRequest);
      setSuccess('Modified webhook sent successfully');
      setEditMode(false);
      loadWebhookData();
    } catch (error) {
      setError('Failed to resend webhook');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await webhookService.deleteWebhook(id);
      navigate('/webhooks');
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
      case 'forwarded': return 'var(--secondary-color)';
      case 'received': return '#3b82f6';
      case 'failed': return '#ef4444';
      case 'replayed': return '#f59e0b';
      default: return 'var(--text-secondary)';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="app">
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <h2>Loading webhook details...</h2>
        </div>
      </div>
    );
  }

  if (error && !webhook) {
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
            onClick={() => navigate('/webhooks')}
            className="btn btn-secondary"
            style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Webhooks
          </button>

          <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9, marginBottom: '0.5rem' }}>WEBHOOK</div>
                <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: '0.5rem' }}>
                  {webhook.name}
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
                  {webhook.status}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '3rem' }}>🪝</div>
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

        {/* Webhook URL */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem' }}>
            Webhook URL
          </h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <code style={{ 
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '0.5rem',
              fontSize: 'var(--font-size-base)',
              wordBreak: 'break-all'
            }}>
              {webhook.webhookUrl}
            </code>
            <button 
              onClick={() => copyToClipboard(webhook.webhookUrl)}
              className="btn btn-secondary"
            >
              Copy
            </button>
          </div>

          {webhook.description && (
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
              {webhook.description}
            </p>
          )}
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
                  {stats.totalRequests}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Forwarded
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--secondary-color)' }}>
                  {stats.forwardedCount}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Failed
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: '#ef4444' }}>
                  {stats.failedCount}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Success Rate
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  {stats.successRate}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request History */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
              Request History
            </h2>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.25rem' }}
            >
              <option value="all">All Requests</option>
              <option value="received">Received</option>
              <option value="forwarded">Forwarded</option>
              <option value="failed">Failed</option>
              <option value="replayed">Replayed</option>
            </select>
          </div>

          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No requests yet. Send a request to {webhook.webhookUrl}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {requests.map((request) => (
                <div 
                  key={request._id} 
                  className="card"
                  style={{ 
                    cursor: 'pointer',
                    padding: '1rem',
                    backgroundColor: selectedRequest?._id === request._id ? 'var(--bg-color)' : 'transparent'
                  }}
                  onClick={() => setSelectedRequest(selectedRequest?._id === request._id ? null : request)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        backgroundColor: 'var(--bg-color)'
                      }}>
                        {request.method}
                      </span>
                      <span style={{ 
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        backgroundColor: `${getStatusColor(request.status)}20`,
                        color: getStatusColor(request.status)
                      }}>
                        {request.status}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        {formatDate(request.createdAt)}
                      </span>
                      {request.forwarding?.duration && (
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                          {formatDuration(request.forwarding.duration)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(request);
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: 'var(--font-size-sm)' }}
                      >
                        Edit & Resend
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReplay(request._id);
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: 'var(--font-size-sm)' }}
                      >
                        Replay
                      </button>
                    </div>
                  </div>

                  {selectedRequest?._id === request._id && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <strong>Headers:</strong>
                        <pre style={{ 
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          backgroundColor: 'var(--bg-color)',
                          borderRadius: '0.25rem',
                          fontSize: 'var(--font-size-sm)',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(request.headers || {}, null, 2)}
                        </pre>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <strong>Body:</strong>
                        <pre style={{ 
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          backgroundColor: 'var(--bg-color)',
                          borderRadius: '0.25rem',
                          fontSize: 'var(--font-size-sm)',
                          overflow: 'auto',
                          maxHeight: '300px'
                        }}>
                          {JSON.stringify(request.body || {}, null, 2)}
                        </pre>
                      </div>

                      {request.forwarding?.attempted && (
                        <div>
                          <strong>Forwarding Result:</strong>
                          <div style={{ 
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            backgroundColor: request.forwarding.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '0.25rem',
                            fontSize: 'var(--font-size-sm)'
                          }}>
                            {request.forwarding.success ? (
                              <>
                                <div>✅ Successfully forwarded to {request.forwarding.targetUrl}</div>
                                <div>Status: {request.forwarding.statusCode}</div>
                              </>
                            ) : (
                              <>
                                <div>❌ Failed to forward</div>
                                <div>Error: {request.forwarding.error}</div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleDelete}
            className="btn btn-logout"
          >
            Delete Webhook
          </button>
        </div>

        {/* Edit Request Modal */}
        {editMode && selectedRequest && (
          <div className="modal-overlay" onClick={() => setEditMode(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  ✏️ Edit & Resend Request
                </h2>
                <button 
                  onClick={() => setEditMode(false)}
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                  HTTP Method
                </label>
                <select
                  value={editedRequest.method}
                  onChange={(e) => setEditedRequest({ ...editedRequest, method: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                  Headers (JSON)
                </label>
                <textarea
                  value={JSON.stringify(editedRequest.headers, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditedRequest({ ...editedRequest, headers: JSON.parse(e.target.value) });
                    } catch (err) {
                      // Invalid JSON, keep editing
                    }
                  }}
                  rows="8"
                  style={{ 
                    width: '100%', 
                    fontFamily: 'monospace',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
                  Body (JSON)
                </label>
                <textarea
                  value={JSON.stringify(editedRequest.body, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditedRequest({ ...editedRequest, body: JSON.parse(e.target.value) });
                    } catch (err) {
                      // Invalid JSON, keep editing
                    }
                  }}
                  rows="12"
                  style={{ 
                    width: '100%', 
                    fontFamily: 'monospace',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setEditMode(false)}
                  className="btn btn-secondary"
                  style={{ minWidth: '100px' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResend}
                  className="btn btn-primary"
                  style={{ minWidth: '150px' }}
                >
                  Send Modified Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhookDetailPage;
