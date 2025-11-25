import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import authService from './services/authService';
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
import OAuthCallback from './pages/OAuthCallback';
import DeviceAuthPage from './pages/DeviceAuthPage';
import './App.css';

const App = () => {
  const currentUser = authService.getCurrentUser();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/share/:token" element={<SharedProjectPage />} />
        <Route path="/device" element={<DeviceAuthPage />} />
        <Route path="/auth/google/callback" element={<OAuthCallback provider="google" />} />
        <Route path="/auth/github/callback" element={<OAuthCallback provider="github" />} />
        <Route path="/auth/microsoft/callback" element={<OAuthCallback provider="microsoft" />} />
        <Route
          path="/projects"
          element={currentUser ? <ProjectPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects/:id"
          element={currentUser ? <ProjectDetailPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/tunnels"
          element={currentUser ? <TunnelsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/tunnels/:id"
          element={currentUser ? <TunnelDetailPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/webhooks"
          element={currentUser ? <WebhooksPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/webhooks/:id"
          element={currentUser ? <WebhookDetailPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={currentUser ? <HomePage /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
