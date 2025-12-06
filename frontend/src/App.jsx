import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import authService from './services/authService';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SharedProjectPage from './pages/SharedProjectPage';
import TunnelsPage from './pages/TunnelsPage';
import TunnelDetailPage from './pages/TunnelDetailPage';
import WebhooksPage from './pages/WebhooksPage';
import WebhookDetailPage from './pages/WebhookDetailPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import OAuthCallback from './pages/OAuthCallback';
import DeviceAuthPage from './pages/DeviceAuthPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import VerifyEmailPage from './pages/VerifyEmailPage';
import './App.css';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const isValid = authService.isTokenValid();
  const currentUser = authService.getCurrentUser();
  
  useEffect(() => {
    // Check token validity periodically
    const interval = setInterval(() => {
      if (currentUser && !authService.isTokenValid()) {
        authService.logout();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [currentUser]);
  
  if (!currentUser || !isValid) {
    // Clear invalid session
    if (currentUser && !isValid) {
      localStorage.removeItem('user');
    }
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Auth Route - redirect to dashboard if already logged in
const AuthRoute = ({ children }) => {
  const isValid = authService.isTokenValid();
  const currentUser = authService.getCurrentUser();
  
  if (currentUser && isValid) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
        <Route path="/share/:token" element={<SharedProjectPage />} />
        <Route path="/device" element={<DeviceAuthPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        
        {/* OAuth Callbacks */}
        <Route path="/auth/google/callback" element={<OAuthCallback provider="google" />} />
        <Route path="/auth/github/callback" element={<OAuthCallback provider="github" />} />
        <Route path="/auth/microsoft/callback" element={<OAuthCallback provider="microsoft" />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/tunnels" element={<ProtectedRoute><TunnelsPage /></ProtectedRoute>} />
        <Route path="/tunnels/:id" element={<ProtectedRoute><TunnelDetailPage /></ProtectedRoute>} />
        <Route path="/webhooks" element={<ProtectedRoute><WebhooksPage /></ProtectedRoute>} />
        <Route path="/webhooks/:id" element={<ProtectedRoute><WebhookDetailPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
