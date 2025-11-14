import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import ThemeToggle from './ThemeToggle';
import '../App.css';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    window.location = '/login';
  };

  const isActive = (path) => {
    if (path === '/projects') {
      return location.pathname === '/projects' || location.pathname.startsWith('/projects/');
    }
    if (path === '/tunnels') {
      return location.pathname === '/tunnels' || location.pathname.startsWith('/tunnels/');
    }
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <span>API Response Manager</span>
        </div>
        
        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
          {isMobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>

        {/* Desktop Navigation */}
        <ul className="navbar-nav desktop-nav">
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link to="/projects" className={isActive('/projects') ? 'active' : ''}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Projects</span>
            </Link>
          </li>
          <li>
            <Link to="/tunnels" className={isActive('/tunnels') ? 'active' : ''}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>Tunnels</span>
            </Link>
          </li>
          <li>
            <ThemeToggle />
          </li>
          <li>
            <button onClick={handleLogout} className="btn btn-logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-overlay" onClick={closeMobileMenu}></div>
        <div className="mobile-sidebar-content">
          <div className="mobile-sidebar-header">
            <h3>Menu</h3>
            <button onClick={closeMobileMenu} className="close-btn" aria-label="Close menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <ul className="mobile-nav">
            <li>
              <Link to="/" className={isActive('/') ? 'active' : ''} onClick={closeMobileMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link to="/projects" className={isActive('/projects') ? 'active' : ''} onClick={closeMobileMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Projects</span>
              </Link>
            </li>
            <li>
              <Link to="/tunnels" className={isActive('/tunnels') ? 'active' : ''} onClick={closeMobileMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>Tunnels</span>
              </Link>
            </li>
          </ul>
          
          {/* Bottom fixed actions */}
          <div className="mobile-nav-bottom">
            <ThemeToggle />
            <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="btn btn-logout mobile-logout-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
