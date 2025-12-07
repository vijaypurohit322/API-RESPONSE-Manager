import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ThemeToggle from '../components/ThemeToggle';
import SocialLogin from '../components/SocialLogin';
import Logo from '../components/Logo';
import '../App.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.tunnelapi.in/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setNeedsVerification(false);
    try {
      await authService.login(email, password);
      navigate('/dashboard');
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.requiresVerification) {
        setNeedsVerification(true);
        setMessage(errorData.msg);
      } else {
        setMessage(errorData?.msg || 'Failed to login. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.msg);
      setNeedsVerification(false);
    } catch (error) {
      setMessage('Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-gradient"></div>
      
      {/* Header with logo and theme toggle */}
      <div className="auth-header">
        <Link to="/" className="auth-logo">
          <Logo size="small" />
        </Link>
        <ThemeToggle />
      </div>
      
      <div className="auth-container card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>Sign in to your account</p>
        </div>

        {message && (
          <div className={`alert ${needsVerification ? 'alert-warning' : 'alert-error'}`} style={{
            background: needsVerification ? 'rgba(245, 158, 11, 0.1)' : undefined,
            borderColor: needsVerification ? 'rgba(245, 158, 11, 0.3)' : undefined,
            color: needsVerification ? '#f59e0b' : undefined
          }}>
            {message}
            {needsVerification && (
              <button
                onClick={handleResendVerification}
                disabled={resending}
                style={{
                  display: 'block',
                  marginTop: '0.75rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: resending ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  width: '100%'
                }}
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem' }}>
          <SocialLogin />
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '500' }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
