import React, { useState } from 'react';
import tunnelService from '../services/tunnelService';

const SecuritySettings = ({ tunnel, onUpdate }) => {
  const [ipWhitelist, setIpWhitelist] = useState(tunnel.ipWhitelist || []);
  const [ipBlacklist, setIpBlacklist] = useState(tunnel.ipBlacklist || []);
  const [newWhitelistIP, setNewWhitelistIP] = useState('');
  const [newBlacklistIP, setNewBlacklistIP] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validate IP or CIDR format
  const validateIP = (ip) => {
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(\/\d{1,3})?$/;
    
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelistIP.trim()) {
      setError('Please enter an IP address or CIDR range');
      return;
    }

    if (!validateIP(newWhitelistIP.trim())) {
      setError('Invalid IP address or CIDR format. Examples: 192.168.1.100, 10.0.0.0/8, 2001:db8::1');
      return;
    }

    const updatedList = [...ipWhitelist, newWhitelistIP.trim()];
    
    try {
      setLoading(true);
      setError('');
      await tunnelService.updateIPWhitelist(tunnel._id, updatedList);
      setIpWhitelist(updatedList);
      setNewWhitelistIP('');
      setSuccess('IP whitelist updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update IP whitelist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWhitelist = async (ip) => {
    const updatedList = ipWhitelist.filter(item => item !== ip);
    
    try {
      setLoading(true);
      setError('');
      await tunnelService.updateIPWhitelist(tunnel._id, updatedList);
      setIpWhitelist(updatedList);
      setSuccess('IP removed from whitelist');
      setTimeout(() => setSuccess(''), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update IP whitelist');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlacklist = async () => {
    if (!newBlacklistIP.trim()) {
      setError('Please enter an IP address or CIDR range');
      return;
    }

    if (!validateIP(newBlacklistIP.trim())) {
      setError('Invalid IP address or CIDR format. Examples: 192.168.1.100, 10.0.0.0/8, 2001:db8::1');
      return;
    }

    const updatedList = [...ipBlacklist, newBlacklistIP.trim()];
    
    try {
      setLoading(true);
      setError('');
      await tunnelService.updateIPBlacklist(tunnel._id, updatedList);
      setIpBlacklist(updatedList);
      setNewBlacklistIP('');
      setSuccess('IP blacklist updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update IP blacklist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBlacklist = async (ip) => {
    const updatedList = ipBlacklist.filter(item => item !== ip);
    
    try {
      setLoading(true);
      setError('');
      await tunnelService.updateIPBlacklist(tunnel._id, updatedList);
      setIpBlacklist(updatedList);
      setSuccess('IP removed from blacklist');
      setTimeout(() => setSuccess(''), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update IP blacklist');
    } finally {
      setLoading(false);
    }
  };

  const handleClearWhitelist = async () => {
    if (!confirm('Are you sure you want to clear the entire IP whitelist? This will allow all IPs.')) return;
    
    try {
      setLoading(true);
      setError('');
      await tunnelService.updateIPWhitelist(tunnel._id, []);
      setIpWhitelist([]);
      setSuccess('IP whitelist cleared');
      setTimeout(() => setSuccess(''), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to clear IP whitelist');
    } finally {
      setLoading(false);
    }
  };

  const handleClearBlacklist = async () => {
    if (!confirm('Are you sure you want to clear the entire IP blacklist?')) return;
    
    try {
      setLoading(true);
      setError('');
      await tunnelService.updateIPBlacklist(tunnel._id, []);
      setIpBlacklist([]);
      setSuccess('IP blacklist cleared');
      setTimeout(() => setSuccess(''), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to clear IP blacklist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        🔒 Security Settings
      </h2>

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

      {/* IP Whitelist */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ✅ IP Whitelist
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Only allow these IP addresses or CIDR ranges to access the tunnel. Leave empty to allow all IPs.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={newWhitelistIP}
            onChange={(e) => setNewWhitelistIP(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddWhitelist()}
            placeholder="192.168.1.100 or 10.0.0.0/8"
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: 'var(--font-size-base)',
              backgroundColor: 'var(--bg-color)'
            }}
          />
          <button 
            onClick={handleAddWhitelist}
            disabled={loading}
            className="btn btn-primary"
          >
            Add IP
          </button>
        </div>

        {ipWhitelist.length > 0 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                {ipWhitelist.length} IP{ipWhitelist.length !== 1 ? 's' : ''} whitelisted
              </span>
              <button 
                onClick={handleClearWhitelist}
                disabled={loading}
                className="btn btn-secondary"
                style={{ fontSize: 'var(--font-size-sm)', padding: '0.25rem 0.75rem' }}
              >
                Clear All
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {ipWhitelist.map((ip, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '0.5rem'
                  }}
                >
                  <code style={{ fontSize: 'var(--font-size-sm)', color: '#22c55e' }}>
                    {ip}
                  </code>
                  <button 
                    onClick={() => handleRemoveWhitelist(ip)}
                    disabled={loading}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      borderRadius: '0.375rem',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-color)',
            borderRadius: '0.5rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            No IP whitelist configured. All IPs are allowed.
          </div>
        )}
      </div>

      {/* IP Blacklist */}
      <div>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🚫 IP Blacklist
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Block these IP addresses or CIDR ranges from accessing the tunnel. Blacklist takes precedence over whitelist.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={newBlacklistIP}
            onChange={(e) => setNewBlacklistIP(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddBlacklist()}
            placeholder="203.0.113.0/24"
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: 'var(--font-size-base)',
              backgroundColor: 'var(--bg-color)'
            }}
          />
          <button 
            onClick={handleAddBlacklist}
            disabled={loading}
            className="btn btn-primary"
          >
            Add IP
          </button>
        </div>

        {ipBlacklist.length > 0 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                {ipBlacklist.length} IP{ipBlacklist.length !== 1 ? 's' : ''} blacklisted
              </span>
              <button 
                onClick={handleClearBlacklist}
                disabled={loading}
                className="btn btn-secondary"
                style={{ fontSize: 'var(--font-size-sm)', padding: '0.25rem 0.75rem' }}
              >
                Clear All
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {ipBlacklist.map((ip, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem'
                  }}
                >
                  <code style={{ fontSize: 'var(--font-size-sm)', color: '#ef4444' }}>
                    {ip}
                  </code>
                  <button 
                    onClick={() => handleRemoveBlacklist(ip)}
                    disabled={loading}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(34, 197, 94, 0.5)',
                      borderRadius: '0.375rem',
                      color: '#22c55e',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-color)',
            borderRadius: '0.5rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            No IP blacklist configured. No IPs are blocked.
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
        borderRadius: '0.5rem',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)'
      }}>
        <strong>💡 Tips:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li>Use CIDR notation for IP ranges (e.g., 10.0.0.0/8)</li>
          <li>Supports both IPv4 and IPv6 addresses</li>
          <li>Blacklist takes precedence over whitelist</li>
          <li>Empty whitelist allows all IPs (unless blacklisted)</li>
        </ul>
      </div>
    </div>
  );
};

export default SecuritySettings;
