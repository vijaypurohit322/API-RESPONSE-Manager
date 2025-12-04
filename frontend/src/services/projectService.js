import axios from 'axios';
import authService from './authService';

// const API_URL = 'import.meta.env.VITE_API_URL/projects/';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.tunnelapi.in';
const API_URL = `${API_BASE}/projects/`;

const getProjects = () => {
  const user = authService.getCurrentUser();
  if (!user || !user.token) {
    return Promise.reject(new Error('User not authenticated'));
  }
  return axios.get(API_URL, {
    headers: {
      'x-auth-token': user.token,
    },
  });
};

const getProject = (id) => {
  const user = authService.getCurrentUser();
  if (!user || !user.token) {
    return Promise.reject(new Error('User not authenticated'));
  }
  return axios.get(API_URL + id, {
    headers: {
      'x-auth-token': user.token,
    },
  });
};

const createProject = (name) => {
  const user = authService.getCurrentUser();
  if (!user || !user.token) {
    return Promise.reject(new Error('User not authenticated'));
  }
  return axios.post(
    API_URL,
    { name },
    {
      headers: {
        'x-auth-token': user.token,
      },
    }
  );
};

const deleteProject = (id) => {
  const user = authService.getCurrentUser();
  if (!user || !user.token) {
    return Promise.reject(new Error('User not authenticated'));
  }
  return axios.delete(API_URL + id, {
    headers: {
      'x-auth-token': user.token,
    },
  });
};

export default {
  getProjects,
  getProject,
  createProject,
  deleteProject,
};
