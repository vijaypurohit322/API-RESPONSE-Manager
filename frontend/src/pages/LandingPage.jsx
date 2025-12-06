import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';
import { 
  TunnelIcon, WebhookIcon, ApiIcon, ShieldLockIcon, ChartIcon, SecurityIcon,
  HookIcon, MobileIcon, PresentationIcon, TeamIcon, CopyIcon, CheckIcon 
} from '../components/Icons';
import '../App.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const currentUser = authService.getCurrentUser();

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If user is logged in, redirect to dashboard
  useEffect(() => {
    if (currentUser && authService.isTokenValid()) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const features = [
    {
      icon: <TunnelIcon size={36} />,
      title: 'Secure Tunneling',
      description: 'Expose your localhost to the internet with enterprise-grade security. Perfect for webhooks, demos, and testing.',
      highlight: 'HTTPS included'
    },
    {
      icon: <WebhookIcon size={36} />,
      title: 'Webhook Testing',
      description: 'Create instant webhook endpoints to capture, inspect, and replay HTTP requests in real-time.',
      highlight: 'Real-time'
    },
    {
      icon: <ApiIcon size={36} />,
      title: 'API Response Capture',
      description: 'Capture, share, and collaborate on API responses with your team using shareable project links.',
      highlight: 'Team collaboration'
    },
    {
      icon: <ShieldLockIcon size={36} />,
      title: 'Enterprise Auth',
      description: 'SAML 2.0, OAuth 2.0, and OIDC support for tunnel authentication. Integrate with your identity provider.',
      highlight: 'SSO ready'
    },
    {
      icon: <ChartIcon size={36} />,
      title: 'Request Analytics',
      description: 'Monitor traffic, analyze request patterns, and get insights into your API usage with detailed statistics.',
      highlight: 'Real-time stats'
    },
    {
      icon: <SecurityIcon size={36} />,
      title: 'Security First',
      description: 'IP whitelisting, rate limiting, and end-to-end encryption. GDPR compliant with data export and deletion.',
      highlight: 'GDPR compliant'
    }
  ];

  const useCases = [
    {
      title: 'Webhook Development',
      description: 'Test Stripe, GitHub, Slack webhooks locally without deploying',
      icon: <HookIcon size={32} />
    },
    {
      title: 'Mobile App Testing',
      description: 'Connect mobile apps to your local backend during development',
      icon: <MobileIcon size={32} />
    },
    {
      title: 'Client Demos',
      description: 'Share your work-in-progress with clients instantly',
      icon: <PresentationIcon size={32} />
    },
    {
      title: 'Team Collaboration',
      description: 'Share API responses and debug together in real-time',
      icon: <TeamIcon size={32} />
    }
  ];

  const cliCommands = [
    { cmd: 'npm install -g api-response-manager', desc: 'Install CLI' },
    { cmd: 'arm login', desc: 'Authenticate' },
    { cmd: 'arm tunnel 3000', desc: 'Expose port 3000' },
    { cmd: 'arm webhook create', desc: 'Create webhook endpoint' }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo">
            <Logo size="default" />
          </Link>

          <div className={`landing-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#features">Features</a>
            <a href="#use-cases">Use Cases</a>
            <a href="#cli">CLI</a>
            <a href="#pricing">Pricing</a>
            <a href="https://docs.tunnelapi.in" target="_blank" rel="noopener noreferrer">
              Docs
            </a>
            <a href="https://github.com/vijaypurohit322/api-response-manager" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>

          <div className="landing-nav-actions">
            <ThemeToggle />
            <Link to="/login" className="btn-nav-secondary">Sign In</Link>
            <Link to="/register" className="btn-nav-primary">Get Started Free</Link>
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-gradient"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>v2.5.0 — Now with GDPR Compliance</span>
          </div>
          
          <h1 className="hero-title">
            Expose Your <span className="gradient-text">Localhost</span> to the World
          </h1>
          
          <p className="hero-subtitle">
            Secure tunnels, webhook testing, and API collaboration platform. 
            Perfect for developers who need to share local servers, test webhooks, 
            and collaborate on API responses.
          </p>

          <div className="hero-cta">
            <Link to="/register" className="btn-hero-primary">
              Start Free Trial
              <span className="btn-arrow">→</span>
            </Link>
            <a href="#cli" className="btn-hero-secondary">
              <span className="btn-icon">⌘</span>
              View CLI Docs
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">1K+</span>
              <span className="stat-label">Tunnels Created</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">&lt;50ms</span>
              <span className="stat-label">Latency</span>
            </div>
          </div>
        </div>

        {/* Terminal Preview */}
        <div className="hero-terminal">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <span className="terminal-title">Terminal</span>
          </div>
          <div className="terminal-body">
            <div className="terminal-line">
              <span className="prompt">$</span>
              <span className="command">arm tunnel 3000 -s myapp</span>
            </div>
            <div className="terminal-output">
              <span className="success">✓</span> Tunnel created successfully!
            </div>
            <div className="terminal-output indent">
              <span className="label">Public URL:</span>
              <span className="url">https://myapp.free-tunnelapi.app</span>
            </div>
            <div className="terminal-output indent">
              <span className="label">Local Port:</span>
              <span className="value">3000</span>
            </div>
            <div className="terminal-output">
              <span className="info">ℹ</span> Forwarding traffic...
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything You Need for API Development</h2>
            <p className="section-subtitle">
              From secure tunneling to webhook testing, we've got you covered with enterprise-grade tools.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-highlight">{feature.highlight}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">How It Works</span>
            <h2 className="section-title">From Local to Live in 3 Steps</h2>
            <p className="section-subtitle">
              No complex setup. No configuration files. Just install and go.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Install CLI</h3>
              <p>One command to install globally via npm</p>
              <code>npm install -g api-response-manager</code>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Authenticate</h3>
              <p>Login with Google, GitHub, or email</p>
              <code>arm login</code>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Go Live</h3>
              <p>Your localhost is now accessible worldwide</p>
              <code>arm tunnel 3000</code>
            </div>
          </div>

          <div className="how-it-works-visual">
            <div className="flow-diagram animated">
              <div className="flow-item">
                <div className="flow-icon-wrapper">
                  <span className="flow-icon">💻</span>
                  <div className="pulse-ring"></div>
                </div>
                <span className="flow-label">Your Machine</span>
                <span className="flow-detail">localhost:3000</span>
              </div>
              
              <div className="flow-connector">
                <div className="connector-line">
                  <div className="data-packet packet-1"></div>
                  <div className="data-packet packet-2"></div>
                  <div className="data-packet packet-3"></div>
                </div>
                <span className="connector-label">Encrypted</span>
              </div>
              
              <div className="flow-item highlight center-node">
                <div className="flow-icon-wrapper">
                  <span className="flow-icon">🚇</span>
                  <div className="pulse-ring active"></div>
                </div>
                <span className="flow-label">TunnelAPI</span>
                <span className="flow-detail">Secure WebSocket</span>
                <div className="status-indicator">
                  <span className="status-dot"></span>
                  <span>Live</span>
                </div>
              </div>
              
              <div className="flow-connector">
                <div className="connector-line reverse">
                  <div className="data-packet packet-1"></div>
                  <div className="data-packet packet-2"></div>
                  <div className="data-packet packet-3"></div>
                </div>
                <span className="connector-label">HTTPS</span>
              </div>
              
              <div className="flow-item">
                <div className="flow-icon-wrapper">
                  <span className="flow-icon">🌍</span>
                  <div className="pulse-ring"></div>
                </div>
                <span className="flow-label">The Internet</span>
                <span className="flow-detail">myapp.free-tunnelapi.app</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="use-cases-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Use Cases</span>
            <h2 className="section-title">Built for Modern Development Workflows</h2>
          </div>

          <div className="use-cases-grid">
            {useCases.map((useCase, index) => (
              <div key={index} className="use-case-card">
                <span className="use-case-icon">{useCase.icon}</span>
                <h3>{useCase.title}</h3>
                <p>{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLI Section */}
      <section id="cli" className="cli-section">
        <div className="section-container">
          <div className="cli-content">
            <div className="cli-info">
              <span className="section-badge">CLI Tool</span>
              <h2 className="section-title">Powerful Command Line Interface</h2>
              <p className="section-subtitle">
                Install our CLI and start tunneling in seconds. Works on macOS, Linux, and Windows.
              </p>
              
              <div className="cli-install-box">
                <code>npm install -g api-response-manager</code>
                <button className="copy-btn" onClick={() => handleCopy('npm install -g api-response-manager')}>
                  {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                  {copied && <span className="copy-tooltip">Copied!</span>}
                </button>
              </div>

              <div className="cli-features-list">
                <div className="cli-feature">
                  <span className="check">✓</span>
                  <span>OAuth & Social Login Support</span>
                </div>
                <div className="cli-feature">
                  <span className="check">✓</span>
                  <span>Custom Subdomains</span>
                </div>
                <div className="cli-feature">
                  <span className="check">✓</span>
                  <span>SSL/TLS Encryption</span>
                </div>
                <div className="cli-feature">
                  <span className="check">✓</span>
                  <span>Request Inspection</span>
                </div>
              </div>
            </div>

            <div className="cli-demo">
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span className="terminal-title">arm-cli</span>
                </div>
                <div className="terminal-body">
                  {cliCommands.map((item, index) => (
                    <div key={index} className="cli-command-item">
                      <div className="terminal-line">
                        <span className="prompt">$</span>
                        <span className="command">{item.cmd}</span>
                      </div>
                      <div className="terminal-comment"># {item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Pricing</span>
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-subtitle">Start free, upgrade when you need more.</p>
          </div>

          <div className="pricing-grid four-cols">
            {/* Free Plan */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Free</h3>
                <div className="price">
                  <span className="amount">$0</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><span className="check">✓</span> 1 User</li>
                <li><span className="check">✓</span> 1 Active Tunnel</li>
                <li><span className="check">✓</span> 2 Webhook Endpoints</li>
                <li><span className="check">✓</span> 1K HTTP Requests/mo</li>
                <li><span className="check">✓</span> 100 MB Bandwidth/mo</li>
                <li><span className="check">✓</span> Random Subdomain</li>
                <li><span className="check">✓</span> 2 Hour Session Limit</li>
                <li><span className="check">✓</span> Community Support</li>
              </ul>
              <Link to="/register" className="btn-pricing">Get Started</Link>
            </div>

            {/* Solo Plan */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Solo</h3>
                <div className="price">
                  <span className="amount">$9</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><span className="check">✓</span> 1 User</li>
                <li><span className="check">✓</span> 3 Active Tunnels</li>
                <li><span className="check">✓</span> 10 Webhook Endpoints</li>
                <li><span className="check">✓</span> 50K HTTP Requests/mo</li>
                <li><span className="check">✓</span> 5 GB Bandwidth/mo</li>
                <li><span className="check">✓</span> Custom Subdomains</li>
                <li><span className="check">✓</span> Unlimited Sessions</li>
                <li><span className="check">✓</span> Email Support</li>
              </ul>
              <Link to="/register" className="btn-pricing">Start Free Trial</Link>
            </div>

            {/* Team Plan */}
            <div className="pricing-card featured">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-header">
                <h3>Team</h3>
                <div className="price">
                  <span className="amount">$29</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><span className="check">✓</span> Up to 5 Users</li>
                <li><span className="check">✓</span> 10 Active Tunnels</li>
                <li><span className="check">✓</span> 50 Webhook Endpoints</li>
                <li><span className="check">✓</span> 500K HTTP Requests/mo</li>
                <li><span className="check">✓</span> 50 GB Bandwidth/mo</li>
                <li><span className="check">✓</span> Custom Subdomains</li>
                <li><span className="check">✓</span> IP Whitelisting</li>
                <li><span className="check">✓</span> Priority Support</li>
              </ul>
              <Link to="/register" className="btn-pricing primary">Start Free Trial</Link>
            </div>

            {/* Enterprise Plan */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Enterprise</h3>
                <div className="price">
                  <span className="amount">Custom</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><span className="check">✓</span> Unlimited Users</li>
                <li><span className="check">✓</span> Unlimited Tunnels</li>
                <li><span className="check">✓</span> Unlimited Endpoints</li>
                <li><span className="check">✓</span> Unlimited Requests</li>
                <li><span className="check">✓</span> Unlimited Bandwidth</li>
                <li><span className="check">✓</span> Custom Domain</li>
                <li><span className="check">✓</span> SAML/SSO Integration</li>
                <li><span className="check">✓</span> Dedicated Support + SLA</li>
              </ul>
              <a href="mailto:vijaypurohit322@gmail.com" className="btn-pricing">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of developers using TunnelAPI for their development workflow.</p>
            <div className="cta-buttons">
              <Link to="/register" className="btn-cta-primary">Create Free Account</Link>
              <a href="https://github.com/vijaypurohit322/api-response-manager" target="_blank" rel="noopener noreferrer" className="btn-cta-secondary">
                ⭐ Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <Link to="/" className="landing-logo">
                <Logo size="default" />
              </Link>
              <p>Secure tunneling and API collaboration platform for modern developers.</p>
              <div className="footer-social">
                <a href="https://github.com/vijaypurohit322/api-response-manager" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </a>
                <a href="mailto:vijaypurohit322@gmail.com" aria-label="Email">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#cli">CLI Tool</a>
                <Link to="/login">Dashboard</Link>
              </div>
              <div className="footer-column">
                <h4>Resources</h4>
                <a href="https://docs.tunnelapi.in" target="_blank" rel="noopener noreferrer">Documentation</a>
                <a href="https://docs.tunnelapi.in/cli/overview" target="_blank" rel="noopener noreferrer">CLI Reference</a>
                <a href="https://docs.tunnelapi.in/getting-started/quick-start" target="_blank" rel="noopener noreferrer">Quick Start</a>
                <a href="https://github.com/vijaypurohit322/api-response-manager/issues" target="_blank" rel="noopener noreferrer">Support</a>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="https://github.com/vijaypurohit322/api-response-manager/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">License</a>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2025 TunnelAPI by Vijay Singh Purohit. All rights reserved.</p>
            <p className="footer-attribution">
              API Response Manager v2.5.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
