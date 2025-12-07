import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';
import '../App.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.tunnelapi.in/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (response.ok && data.verified) {
        setStatus('success');
        setMessage(data.msg);
        
        // If token is returned, auto-login
        if (data.token && data.user) {
          localStorage.setItem('user', JSON.stringify({
            token: data.token,
            user: data.user
          }));
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } else if (data.expired) {
        setStatus('expired');
        setMessage(data.msg);
      } else {
        setStatus('error');
        setMessage(data.msg || 'Verification failed.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to verify email. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage('Please enter your email address.');
      return;
    }

    setResending(true);
    setResendMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResendMessage(data.msg);
    } catch (error) {
      setResendMessage('Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-gradient"></div>
      
      <div className="auth-header">
        <Link to="/" className="auth-logo">
          <Logo size="small" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="auth-container" style={{ textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <div className="verification-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              ⏳
            </div>
            <h2>Verifying your email...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please wait while we verify your email address.</p>
            <div className="loading-spinner" style={{ margin: '2rem auto' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verification-icon" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#22c55e' }}>
              ✓
            </div>
            <h2>Email Verified!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
            <p style={{ color: 'var(--text-secondary)' }}>Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verification-icon" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ef4444' }}>
              ✕
            </div>
            <h2>Verification Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block' }}>
              Go to Login
            </Link>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="verification-icon" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f59e0b' }}>
              ⚠
            </div>
            <h2>Link Expired</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
            
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                Enter your email to receive a new verification link:
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="form-control"
                style={{ marginBottom: '1rem' }}
              />
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
              {resendMessage && (
                <p style={{ 
                  marginTop: '1rem', 
                  color: resendMessage.includes('sent') ? '#22c55e' : 'var(--text-secondary)' 
                }}>
                  {resendMessage}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmailPage;
