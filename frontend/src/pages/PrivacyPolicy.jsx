import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';
import '../App.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle back navigation to return to previous scroll position
  const handleBackClick = (e) => {
    e.preventDefault();
    if (location.state?.from) {
      navigate(-1);
    } else {
      navigate('/', { state: { scrollToFooter: true } });
    }
  };

  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link to="/" className="auth-logo">
          <Logo size="small" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: December 4, 2025</p>

        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to TunnelAPI ("we," "our," or "us"). We are committed to protecting your privacy 
            and ensuring the security of your personal information. This Privacy Policy explains how 
            we collect, use, disclose, and safeguard your information when you use our API Response 
            Manager service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <h3>2.1 Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Email address</li>
            <li>Name (if provided)</li>
            <li>Password (encrypted)</li>
            <li>OAuth provider information (Google, GitHub) if you use social login</li>
          </ul>

          <h3>2.2 Usage Data</h3>
          <p>We automatically collect:</p>
          <ul>
            <li>API request logs and response data you choose to store</li>
            <li>Tunnel connection metadata</li>
            <li>Webhook request information</li>
            <li>Device and browser information</li>
            <li>IP addresses</li>
          </ul>

          <h3>2.3 Cookies and Tracking</h3>
          <p>
            We use essential cookies for authentication and session management. We do not use 
            third-party tracking or advertising cookies.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Authenticate your identity</li>
            <li>Process and store your API responses and tunnel data</li>
            <li>Send important service notifications</li>
            <li>Improve our services and user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Data Storage and Security</h2>
          <p>
            Your data is stored securely using industry-standard encryption. We implement:
          </p>
          <ul>
            <li>TLS/SSL encryption for all data in transit</li>
            <li>Encrypted database storage</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share data only:
          </p>
          <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal requirements</li>
            <li>To protect our rights and safety</li>
            <li>With service providers who assist in operating our platform (under strict confidentiality)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Your Rights (GDPR Compliance)</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
            <li><strong>Erasure:</strong> Request deletion of your data</li>
            <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
            <li><strong>Restriction:</strong> Limit how we process your data</li>
            <li><strong>Objection:</strong> Object to certain processing activities</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:vijaypurohit322@gmail.com">vijaypurohit322@gmail.com</a>
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. Inactive accounts may be 
            deleted after 15 days of inactivity. You can request immediate deletion at any time.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Children's Privacy</h2>
          <p>
            Our service is not intended for users under 13 years of age. We do not knowingly 
            collect information from children.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant 
            changes via email or through our service.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Contact Us</h2>
          <p>
            For questions about this Privacy Policy, contact us at:
          </p>
          <ul>
            <li>Email: <a href="mailto:vijaypurohit322@gmail.com">vijaypurohit322@gmail.com</a></li>
            <li>GitHub: <a href="https://github.com/vijaypurohit322/api-response-manager" target="_blank" rel="noopener noreferrer">vijaypurohit322/api-response-manager</a></li>
          </ul>
        </section>

        <div className="legal-back">
          <button onClick={handleBackClick} className="btn btn-secondary">← Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
