import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ThemeToggle from '../components/ThemeToggle';
import SocialLogin from '../components/SocialLogin';
import Logo from '../components/Logo';
import '../App.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      return;
    }

    // Password policy validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      setMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authService.register(name, email, password);
      // Check if verification is required
      if (response.data.requiresVerification) {
        setVerificationSent(true);
        setRegisteredEmail(response.data.email || email);
      } else if (response.data.token) {
        // Auto-login if no verification required (shouldn't happen now)
        const userData = {
          token: response.data.token,
          user: response.data.user || {
            email: email,
            name: name,
            provider: 'local'
          }
        };
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/dashboard');
      }
    } catch (error) {
      setMessage(error.response?.data?.msg || 'Failed to register. Please try again.');
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
        {verificationSent ? (
          // Verification email sent view
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Check your email</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              We've sent a verification link to<br />
              <strong style={{ color: 'var(--text-primary)' }}>{registeredEmail}</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Click the link in the email to verify your account and start using TunnelAPI.
            </p>
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '1rem', 
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Didn't receive the email? Check your spam folder or{' '}
                <Link to="/login" style={{ color: 'var(--primary-color)' }}>
                  request a new link
                </Link>
              </p>
            </div>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          // Registration form view
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Create Account
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>Sign up to get started</p>
            </div>

            {message && (
              <div className="alert alert-error">
                {message}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
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
                  minLength="8"
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Min 8 chars with uppercase, lowercase, number & special char (@$!%*?&)
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="8"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem' }}>
              <SocialLogin />
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '500' }}>
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
