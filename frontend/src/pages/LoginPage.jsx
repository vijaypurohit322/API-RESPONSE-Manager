import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ThemeToggle from '../components/ThemeToggle';
import SocialLogin from '../components/SocialLogin';
import Logo from '../components/Logo';
import '../App.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await authService.login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.msg || 'Failed to login. Please check your credentials.');
      setLoading(false);
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
          <div className="alert alert-error">
            {message}
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
