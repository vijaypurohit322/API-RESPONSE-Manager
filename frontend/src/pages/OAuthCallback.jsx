import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthCallback = ({ provider }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        console.error('OAuth error:', error);
        alert(`Authentication failed: ${error}`);
        navigate('/login');
        return;
      }

      if (!code) {
        console.error('No code received');
        alert('Authentication failed: No authorization code');
        navigate('/login');
        return;
      }

      try {
        // Check if this is device authentication
        const isDeviceAuth = sessionStorage.getItem('device_auth') === 'true';
        const deviceCode = sessionStorage.getItem('device_code');

        if (isDeviceAuth && deviceCode) {
          // Device authentication flow
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/auth/social/${provider}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code }),
            }
          );

          const data = await response.json();

          if (response.ok && data.token) {
            // Get user ID from token payload
            const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
            const userId = tokenPayload.user.id;

            // Approve the device
            await fetch(
              `${import.meta.env.VITE_API_URL}/auth/device/approve`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  device_code: deviceCode,
                  user_id: userId
                }),
              }
            );

            // Clear session storage
            sessionStorage.removeItem('device_auth');
            sessionStorage.removeItem('device_code');

            // Show success message
            alert('✓ Device authenticated successfully!\n\nYou can now return to your terminal.');
            navigate('/login');
          } else {
            throw new Error(data.msg || 'Authentication failed');
          }
        } else {
          // Normal web authentication flow
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/auth/social/${provider}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code }),
            }
          );

          const data = await response.json();

          if (response.ok) {
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(data));
            window.location.href = '/dashboard';
          } else {
            throw new Error(data.msg || 'Authentication failed');
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        alert(error.message || 'Failed to complete authentication');
        navigate('/login');
      }
    };

    handleCallback();
  }, [location, navigate, provider]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
