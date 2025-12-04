import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import authService from '../services/authService';
import '../App.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.tunnelapi.in/api';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataCategories, setDataCategories] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchDataCategories();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = authService.getCurrentUser();
      if (userData?.user) {
        setUser(userData.user);
      }
    } catch (err) {
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDataCategories = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/gdpr/data-categories`, {
        headers: {
          'x-auth-token': token
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDataCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch data categories:', err);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    setError(null);
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/gdpr/export`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if user has any data
        const hasData = data.userData && (
          data.userData.projects?.length > 0 ||
          data.userData.responses?.length > 0 ||
          data.userData.tunnels?.length > 0
        );
        
        // Create export with proper structure even if empty
        const exportData = {
          ...data,
          exportInfo: {
            exportedAt: new Date().toISOString(),
            hasData: hasData,
            message: hasData 
              ? 'Your data export is ready.' 
              : 'You have no projects, responses, or tunnels yet. Your profile data is included.'
          }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        setError(null);
        alert(hasData 
          ? 'Data exported successfully!' 
          : 'Export complete. Note: You have no projects or tunnels yet, but your profile data is included.');
      } else {
        const errData = await response.json();
        throw new Error(errData.msg || 'Export failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/gdpr/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT' })
      });
      
      if (response.ok) {
        authService.logout();
        window.location.href = '/login';
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      setError('Failed to delete account');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ paddingTop: '2rem' }}>
          <div className="loading-spinner"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '2rem', maxWidth: '800px' }}>
        <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          My Profile
        </h1>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* User Info Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Account Information</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Avatar" 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: 'var(--primary-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: 'white'
                }}>
                  {user?.email?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h2 style={{ margin: 0 }}>{user?.name || 'User'}</h2>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>{user?.email}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>User ID</span>
                <code style={{ fontSize: '0.875rem' }}>{user?.id}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Login Provider</span>
                <span style={{ textTransform: 'capitalize' }}>{user?.provider || 'Email'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Privacy Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Your Data (GDPR)</h3>
          </div>
          <div className="card-body">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              We respect your privacy. You have the right to access, export, and delete your data.
            </p>

            {dataCategories && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem' }}>Data We Store</h4>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {dataCategories.dataCategories?.map((cat, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '0.75rem', 
                      background: 'var(--bg-secondary)', 
                      borderRadius: '8px',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong>{cat.category}</strong>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{cat.description}</p>
                      </div>
                      {cat.count !== undefined && (
                        <span className="badge">{cat.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleExportData}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <span className="spinner-small"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Export My Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ border: '2px solid #ef4444' }}>
          <div className="card-header" style={{ background: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h3 style={{ color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Danger Zone
            </h3>
          </div>
          <div className="card-body">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Once you delete your account, there is no going back. All your projects, responses, and tunnels will be <strong style={{ color: '#ef4444' }}>permanently deleted</strong>.
            </p>

            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>Note:</strong> Inactive accounts (no login for 15 days) may be automatically deleted.
              </p>
            </div>

            {!showDeleteConfirm ? (
              <button 
                className="btn btn-danger" 
                style={{ 
                  background: '#ef4444', 
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Delete My Account
              </button>
            ) : (
              <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <p style={{ marginBottom: '1rem', fontWeight: 'bold', color: '#ef4444' }}>
                  Are you absolutely sure? This action cannot be undone.
                </p>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  This will permanently delete your account and all associated data including projects, API responses, and tunnel configurations.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn" 
                    style={{ 
                      background: '#dc2626', 
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span className="spinner-small"></span>
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete Everything'
                    )}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '0.75rem 1.5rem' }}
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
