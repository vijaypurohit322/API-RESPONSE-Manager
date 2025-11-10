import React from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

const HomePage = () => {
  const handleLogout = () => {
    authService.logout();
    window.location = '/login';
  };

  return (
    <div>
      <h2>Welcome</h2>
      <nav>
        <Link to="/projects">Projects</Link>
      </nav>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default HomePage;
