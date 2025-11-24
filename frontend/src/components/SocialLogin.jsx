import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SocialLogin = () => {
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();

  // Google Login
  const handleGoogleLogin = async () => {
    setLoading('google');
    try {
      // Load Google Sign-In library
      const google = window.google;
      if (!google) {
        throw new Error('Google Sign-In not loaded');
      }

      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/social/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: response.credential }),
            });

            const data = await res.json();

            if (res.ok) {
              // Store user data in localStorage
              localStorage.setItem('user', JSON.stringify(data));
              window.location.href = '/';
            } else {
              throw new Error(data.msg || 'Google login failed');
            }
          } catch (error) {
            console.error('Google login error:', error);
            alert(error.message || 'Failed to login with Google');
          } finally {
            setLoading(null);
          }
        },
      });

      google.accounts.id.prompt();
    } catch (error) {
      console.error('Google login error:', error);
      alert('Failed to initialize Google login');
      setLoading(null);
    }
  };

  // GitHub Login
  const handleGitHubLogin = () => {
    setLoading('github');
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'user:email';
    
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  // Microsoft Login
  const handleMicrosoftLogin = () => {
    setLoading('microsoft');
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
    const scope = 'openid profile email';
    
    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', borderTop: '1px solid var(--border-color)' }}></div>
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: 'var(--font-size-sm)' }}>
          <span style={{ padding: '0 0.5rem', backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>Or continue with</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading !== null}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem 1rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            opacity: loading !== null ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (loading === null) e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
          }}
        >
          {loading === 'google' ? (
            <div style={{
              width: '1.25rem',
              height: '1.25rem',
              border: '2px solid var(--border-color)',
              borderTopColor: 'var(--primary-color)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          ) : (
            <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
        </button>

        {/* GitHub */}
        <button
          onClick={handleGitHubLogin}
          disabled={loading !== null}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem 1rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            opacity: loading !== null ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (loading === null) e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
          }}
        >
          {loading === 'github' ? (
            <div style={{
              width: '1.25rem',
              height: '1.25rem',
              border: '2px solid var(--border-color)',
              borderTopColor: 'var(--text-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          ) : (
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Microsoft */}
        <button
          onClick={handleMicrosoftLogin}
          disabled={loading !== null}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem 1rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            opacity: loading !== null ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (loading === null) e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
          }}
        >
          {loading === 'microsoft' ? (
            <div style={{
              width: '1.25rem',
              height: '1.25rem',
              border: '2px solid var(--border-color)',
              borderTopColor: 'var(--primary-color)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          ) : (
            <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z" />
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default SocialLogin;
