import axios from 'axios';

// const API_URL = 'import.meta.env.VITE_API_URL/auth/';
const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.tunnelapi.in';
const API_URL = `${API_BASE}/auth/`;

const register = (email, password) => {
  return axios.post(API_URL + 'register', {
    email,
    password,
  });
};

const login = (email, password) => {
  return axios
    .post(API_URL + 'login', {
      email,
      password,
    })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    });
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const getToken = () => {
  const user = getCurrentUser();
  return user?.token || null;
};

const updateUser = (userData) => {
  const current = getCurrentUser();
  if (current) {
    const updated = { ...current, user: { ...current.user, ...userData } };
    localStorage.setItem('user', JSON.stringify(updated));
  }
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  getToken,
  updateUser,
};
