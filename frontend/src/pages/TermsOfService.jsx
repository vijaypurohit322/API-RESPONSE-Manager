import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';
import '../App.css';

const TermsOfService = () => {
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
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: December 4, 2025</p>

        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using TunnelAPI ("Service"), you agree to be bound by these Terms of 
            Service. If you do not agree to these terms, please do not use our Service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Description of Service</h2>
          <p>
            TunnelAPI provides an API Response Manager platform that includes:
          </p>
          <ul>
            <li>Secure tunneling to expose local servers to the internet</li>
            <li>Webhook endpoint creation and management</li>
            <li>API response capture and sharing</li>
            <li>Command-line interface (CLI) tools</li>
            <li>Team collaboration features</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. User Accounts</h2>
          <h3>3.1 Registration</h3>
          <p>
            You must provide accurate and complete information when creating an account. You are 
            responsible for maintaining the security of your account credentials.
          </p>

          <h3>3.2 Account Security</h3>
          <p>
            You are responsible for all activities that occur under your account. Notify us 
            immediately of any unauthorized use.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Acceptable Use</h2>
          <p>You agree NOT to use the Service to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Transmit malware, viruses, or malicious code</li>
            <li>Engage in unauthorized access to systems or networks</li>
            <li>Distribute spam or unsolicited communications</li>
            <li>Infringe on intellectual property rights</li>
            <li>Harass, abuse, or harm others</li>
            <li>Attempt to bypass security measures</li>
            <li>Use the service for illegal activities</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Service Tiers</h2>
          <h3>5.1 Free Tier</h3>
          <p>
            The free tier includes limited tunnels, webhooks, and API response storage as 
            described on our pricing page.
          </p>

          <h3>5.2 Paid Tiers</h3>
          <p>
            Paid subscriptions provide additional features and higher limits. Payment terms 
            and refund policies are specified at the time of purchase.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Intellectual Property</h2>
          <h3>6.1 Our Property</h3>
          <p>
            The Service, including its design, code, and content, is owned by TunnelAPI and 
            protected by intellectual property laws. See our{' '}
            <a href="https://github.com/vijaypurohit322/api-response-manager/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
              License
            </a>{' '}
            for usage terms.
          </p>

          <h3>6.2 Your Content</h3>
          <p>
            You retain ownership of data you upload. By using the Service, you grant us a 
            limited license to store and process your data as necessary to provide the Service.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{' '}
            <Link to="/privacy">Privacy Policy</Link>, which is incorporated into these Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE 
            THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF 
            THE SERVICE.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless TunnelAPI and its operators from any claims, 
            damages, or expenses arising from your use of the Service or violation of these Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time for violation of 
            these Terms. You may delete your account at any time through your account settings.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. Continued use of the Service after changes 
            constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws, 
            without regard to conflict of law principles.
          </p>
        </section>

        <section className="legal-section">
          <h2>14. Contact</h2>
          <p>
            For questions about these Terms, contact us at:
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

export default TermsOfService;
