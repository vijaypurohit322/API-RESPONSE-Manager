import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:5000/api/responses/';

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
