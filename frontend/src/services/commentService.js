import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:5000/api/comments/';

const getComments = (responseId) => {
  const user = authService.getCurrentUser();
  return axios.get(API_URL + responseId, {
    headers: {
      'x-auth-token': user.token,
    },
  });
};

const createComment = (responseId, comment) => {
  const user = authService.getCurrentUser();
  return axios.post(
    API_URL,
    { responseId, comment },
    {
      headers: {
        'x-auth-token': user.token,
      },
    }
  );
};

export default {
  getComments,
  createComment,
};
