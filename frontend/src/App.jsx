import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import authService from './services/authService';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SharedProjectPage from './pages/SharedProjectPage';
import './App.css';

const App = () => {
  const currentUser = authService.getCurrentUser();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/share/:token" element={<SharedProjectPage />} />
        <Route
          path="/projects"
          element={currentUser ? <ProjectPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects/:id"
          element={currentUser ? <ProjectDetailPage /> : <Navigate to="/login" />}
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
