import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import authService from '../services/authService';
import '../App.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.tunnelapi.in/api';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // General settings state
  const [displayName, setDisplayName] = useState('');
  const [defaultPort, setDefaultPort] = useState('3000');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSession, setRevokingSession] = useState(null);

  const user = authService.getCurrentUser()?.user;
  
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
    }
    fetchSessions();
  }, []);
  
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/auth/sessions`, {
        headers: { 'x-auth-token': token }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };
  
  const handleSaveGeneral = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ name: displayName, defaultPort: parseInt(defaultPort) })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update local storage with new user data
        const currentData = authService.getCurrentUser();
        if (currentData) {
          currentData.user = { ...currentData.user, name: displayName };
          localStorage.setItem('user', JSON.stringify(currentData));
        }
        setMessage({ type: 'success', text: 'Settings saved successfully' });
        setHasChanges(false);
      } else {
        const errData = await response.json();
        setMessage({ type: 'error', text: errData.msg || 'Failed to save settings' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };
  
  const handleRevokeSession = async (sessionId) => {
    setRevokingSession(sessionId);
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      
      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        setMessage({ type: 'success', text: 'Session revoked successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to revoke session' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to revoke session' });
    } finally {
      setRevokingSession(null);
    }
  };
  
  const handleRevokeAllSessions = async () => {
    if (!confirm('This will log you out of all devices except this one. Continue?')) return;
    
    setSaving(true);
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/auth/sessions/revoke-all`, {
        method: 'POST',
        headers: { 'x-auth-token': token }
      });
      
      if (response.ok) {
        fetchSessions();
        setMessage({ type: 'success', text: 'All other sessions revoked' });
      } else {
        setMessage({ type: 'error', text: 'Failed to revoke sessions' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to revoke sessions' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setMessage({ 
        type: 'error', 
        text: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)' 
      });
      return;
    }

    setSaving(true);
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.msg || 'Failed to change password' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )},
    { id: 'security', label: 'Security', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    )},
    { id: 'notifications', label: 'Notifications', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    )}
  ];

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '2rem', maxWidth: '900px' }}>
        <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </h1>

        {message && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>
            {message.text}
            <button onClick={() => setMessage(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Sidebar */}
          <div style={{ minWidth: '200px' }}>
            <div className="card">
              <div className="card-body" style={{ padding: '0.5rem' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                      color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            {activeTab === 'general' && (
              <div className="card">
                <div className="card-header">
                  <h3>General Settings</h3>
                </div>
                <div className="card-body">
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="form-control"
                      style={{ background: 'var(--bg-secondary)' }}
                    />
                    <small style={{ color: 'var(--text-secondary)' }}>
                      Email cannot be changed
                    </small>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => { setDisplayName(e.target.value); setHasChanges(true); }}
                      placeholder="Enter your name"
                      className="form-control"
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Default Tunnel Port
                    </label>
                    <input
                      type="number"
                      value={defaultPort}
                      onChange={(e) => { setDefaultPort(e.target.value); setHasChanges(true); }}
                      className="form-control"
                      style={{ maxWidth: '150px' }}
                      min="1"
                      max="65535"
                    />
                  </div>

                  <button 
                    className="btn btn-primary" 
                    onClick={handleSaveGeneral}
                    disabled={saving || !hasChanges}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-small"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                          <polyline points="17 21 17 13 7 13 7 21"/>
                          <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="card">
                <div className="card-header">
                  <h3>Security Settings</h3>
                </div>
                <div className="card-body">
                  {user?.provider && user.provider !== 'local' ? (
                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <p style={{ margin: 0 }}>
                        You signed in with <strong style={{ textTransform: 'capitalize' }}>{user.provider}</strong>. 
                        Password management is handled by your identity provider.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordChange}>
                      <h4 style={{ marginBottom: '1rem' }}>Change Password</h4>
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="form-control"
                          required
                        />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="form-control"
                          required
                          minLength={8}
                        />
                        <small style={{ color: 'var(--text-secondary)' }}>
                          Min 8 characters with uppercase, lowercase, number, and special character
                        </small>
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="form-control"
                          required
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Change Password'}
                      </button>
                    </form>
                  )}

                  <hr style={{ margin: '2rem 0', borderColor: 'var(--border-color)' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Active Sessions</h4>
                    {sessions.length > 1 && (
                      <button 
                        className="btn btn-secondary" 
                        onClick={handleRevokeAllSessions}
                        disabled={saving}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                      >
                        Revoke All Other Sessions
                      </button>
                    )}
                  </div>
                  
                  {loadingSessions ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <span className="spinner-small"></span>
                      <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Loading sessions...</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {/* Current Session - Always show */}
                      <div style={{ 
                        padding: '1rem', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        borderRadius: '8px', 
                        border: '2px solid #10b981',
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '8px', 
                            background: '#10b981', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                              <line x1="8" y1="21" x2="16" y2="21"/>
                              <line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong>Current Session</strong>
                              <span style={{ 
                                background: '#10b981', 
                                color: 'white', 
                                padding: '0.125rem 0.5rem', 
                                borderRadius: '9999px', 
                                fontSize: '0.7rem',
                                fontWeight: '600'
                              }}>
                                THIS DEVICE
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                               navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                               navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'} 
                              {' • '}
                              {navigator.platform}
                            </p>
                          </div>
                        </div>
                        <span className="badge" style={{ background: '#10b981', color: 'white' }}>Active Now</span>
                      </div>
                      
                      {/* Other Sessions */}
                      {sessions.filter(s => !s.isCurrent).map((session) => (
                        <div key={session.id} style={{ 
                          padding: '1rem', 
                          background: 'var(--bg-secondary)', 
                          borderRadius: '8px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '8px', 
                              background: 'var(--border-color)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                <line x1="8" y1="21" x2="16" y2="21"/>
                                <line x1="12" y1="17" x2="12" y2="21"/>
                              </svg>
                            </div>
                            <div>
                              <strong>{session.device || 'Unknown Device'}</strong>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {session.location || 'Unknown location'} • Last active: {session.lastActive || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <button 
                            className="btn" 
                            style={{ 
                              background: 'transparent', 
                              color: '#ef4444', 
                              border: '1px solid #ef4444',
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem'
                            }}
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={revokingSession === session.id}
                          >
                            {revokingSession === session.id ? 'Revoking...' : 'Revoke'}
                          </button>
                        </div>
                      ))}
                      
                      {sessions.filter(s => !s.isCurrent).length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                          No other active sessions
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="card">
                <div className="card-header">
                  <h3>Notification Preferences</h3>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <strong>Email Notifications</strong>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Receive updates about your tunnels and webhooks
                      </p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <strong>Tunnel Alerts</strong>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Get notified when tunnels disconnect
                      </p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
                    <div>
                      <strong>Webhook Failures</strong>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Alert when webhook deliveries fail
                      </p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
