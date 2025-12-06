import React from 'react';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    small: { icon: 28, text: '1.1rem', slogan: '0.6rem' },
    default: { icon: 36, text: '1.5rem', slogan: '0.7rem' },
    large: { icon: 48, text: '2rem', slogan: '0.85rem' }
  };

  const s = sizes[size] || sizes.default;

  return (
    <div className={`logo-wrapper ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {/* Custom Tunnel Logo SVG */}
      <svg 
        width={s.icon} 
        height={s.icon} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Outer tunnel ring */}
        <circle 
          cx="24" 
          cy="24" 
          r="20" 
          stroke="url(#tunnelGradient)" 
          strokeWidth="3" 
          fill="none"
        />
        
        {/* Inner tunnel depth effect */}
        <circle 
          cx="24" 
          cy="24" 
          r="14" 
          stroke="url(#tunnelGradient)" 
          strokeWidth="2" 
          fill="none"
          opacity="0.7"
        />
        
        {/* Center tunnel opening */}
        <circle 
          cx="24" 
          cy="24" 
          r="8" 
          fill="url(#tunnelGradient)"
        />
        
        {/* Connection arrows - data flowing through tunnel */}
        <path 
          d="M10 24 L18 24 M30 24 L38 24" 
          stroke="url(#tunnelGradient)" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        <path 
          d="M14 20 L18 24 L14 28" 
          stroke="url(#tunnelGradient)" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        <path 
          d="M34 20 L30 24 L34 28" 
          stroke="url(#tunnelGradient)" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="tunnelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            fontSize: s.text, 
            fontWeight: 700, 
            color: 'var(--text-primary)', 
            lineHeight: 1.2,
            letterSpacing: '-0.02em'
          }}>
            TunnelAPI
          </span>
          <span style={{ 
            fontSize: s.slogan, 
            color: 'var(--text-secondary)', 
            fontWeight: 500,
            letterSpacing: '0.02em'
          }}>
            API Response Manager
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
