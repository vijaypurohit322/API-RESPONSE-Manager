import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:5000/api/projects/';

const getProjects = () => {
  const user = authService.getCurrentUser();
  return axios.get(API_URL, {
    headers: {
      'x-auth-token': user.token,
    },
  });
};

const createProject = (name) => {
  const user = authService.getCurrentUser();
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

export default {
  getProjects,
  createProject,
};
