import axios from 'axios';
import authService from './authService';

// const API_URL = 'import.meta.env.VITE_API_URL/responses/';
const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.tunnelapi.in';
const API_URL = `${API_BASE}/responses/`;

const getResponses = (projectId) => {
  const user = authService.getCurrentUser();
  return axios.get(API_URL + projectId, {
    headers: {
      'x-auth-token': user.token,
    },
  });
};

const createResponse = (responseData) => {
  const user = authService.getCurrentUser();
  return axios.post(API_URL, responseData, {
    headers: {
      'x-auth-token': user.token,
    },
  });
};

export default {
  getResponses,
  createResponse,
};
