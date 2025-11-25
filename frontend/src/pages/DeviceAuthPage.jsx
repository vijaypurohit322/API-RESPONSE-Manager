import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DeviceAuthPage = () => {
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deviceData, setDeviceData] = useState(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/device/verify`, {
        user_code: userCode.toUpperCase().replace(/\s/g, '')
      });

      setDeviceData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid code');
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Store device code for after OAuth
    if (deviceData?.device_code) {
      sessionStorage.setItem('device_code', deviceData.device_code);
      sessionStorage.setItem('device_auth', 'true');
    }

    // Redirect to OAuth
    const clientId = import.meta.env[`VITE_${provider.toUpperCase()}_CLIENT_ID`];
    const redirectUri = `${window.location.origin}/auth/${provider}/callback`;
    
    let authUrl = '';
    if (provider === 'github') {
      authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    } else if (provider === 'google') {
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;
    } else if (provider === 'microsoft') {
      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;
    }

    window.location.href = authUrl;
  };

  const formatCode = (value) => {
    // Auto-format as XXXX-XXXX
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (cleaned.length <= 4) {
      return cleaned;
    }
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
  };

  const handleCodeChange = (e) => {
    const formatted = formatCode(e.target.value);
    setUserCode(formatted);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-color)',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        padding: '2rem',
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: 'var(--font-size-2xl)', 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Device Authentication
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            Enter the code displayed in your terminal
          </p>
        </div>

        {!deviceData ? (
          <form onSubmit={handleVerifyCode}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Device Code
              </label>
              <input
                type="text"
                value={userCode}
                onChange={handleCodeChange}
                placeholder="XXXX-XXXX"
                maxLength={9}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  textAlign: 'center',
                  border: `2px solid ${error ? '#ef4444' : 'var(--border-color)'}`,
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = error ? '#ef4444' : 'var(--border-color)'}
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fee',
                color: '#c00',
                borderRadius: 'var(--border-radius)',
                marginBottom: '1rem',
                fontSize: 'var(--font-size-sm)'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || userCode.length < 9}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: loading || userCode.length < 9 ? 'not-allowed' : 'pointer',
                opacity: loading || userCode.length < 9 ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        ) : (
          <div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#eff6ff',
              borderRadius: 'var(--border-radius)',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{ 
                color: '#1e40af',
                fontSize: 'var(--font-size-sm)',
                marginBottom: '0.5rem'
              }}>
                ✓ Code verified
              </p>
              <p style={{ 
                color: '#64748b',
                fontSize: 'var(--font-size-xs)'
              }}>
                Now sign in with {deviceData.provider}
              </p>
            </div>

            <button
              onClick={() => handleSocialLogin(deviceData.provider)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign in with {deviceData.provider.charAt(0).toUpperCase() + deviceData.provider.slice(1)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceAuthPage;
