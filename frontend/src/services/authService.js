import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.tunnelapi.in';
const API_URL = `${API_BASE}/auth/`;

// Parse JWT token to get payload
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  
  // Token expiry is in seconds, Date.now() is in milliseconds
  const expiryTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  // Consider token expired if less than 5 minutes remaining
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  return currentTime >= (expiryTime - bufferTime);
};

// Check if token is valid (exists and not expired)
const isTokenValid = () => {
  const user = getCurrentUser();
  if (!user || !user.token) return false;
  return !isTokenExpired(user.token);
};

// Get token expiry time
const getTokenExpiry = () => {
  const user = getCurrentUser();
  if (!user || !user.token) return null;
  
  const payload = parseJwt(user.token);
  if (!payload || !payload.exp) return null;
  
  return new Date(payload.exp * 1000);
};

// Get time until token expires (in seconds)
const getTimeUntilExpiry = () => {
  const user = getCurrentUser();
  if (!user || !user.token) return 0;
  
  const payload = parseJwt(user.token);
  if (!payload || !payload.exp) return 0;
  
  const expiryTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  return Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
};

const register = (name, email, password) => {
  return axios.post(API_URL + 'register', {
    name,
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
        // Ensure user data is properly structured
        const userData = {
          token: response.data.token,
          user: response.data.user || {
            email: email,
            name: '',
            provider: 'local'
          }
        };
        localStorage.setItem('user', JSON.stringify(userData));
      }
      return response.data;
    });
};

const logout = () => {
  localStorage.removeItem('user');
  // Redirect to login page
  window.location.href = '/login';
};

// Logout if token is expired
const checkAndLogout = () => {
  if (!isTokenValid()) {
    logout();
    return true;
  }
  return false;
};

const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (e) {
    localStorage.removeItem('user');
    return null;
  }
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

// Setup axios interceptor for automatic token expiry handling
const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        const currentPath = window.location.pathname;
        // Don't redirect if already on public pages
        const publicPaths = ['/', '/login', '/register', '/share'];
        const isPublicPath = publicPaths.some(path => 
          currentPath === path || currentPath.startsWith('/share/')
        );
        
        if (!isPublicPath) {
          logout();
        }
      }
      return Promise.reject(error);
    }
  );

  // Add token to all requests
  axios.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers['x-auth-token'] = token;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Initialize interceptors
setupAxiosInterceptors();

export default {
  register,
  login,
  logout,
  getCurrentUser,
  getToken,
  updateUser,
  isTokenValid,
  isTokenExpired,
  getTokenExpiry,
  getTimeUntilExpiry,
  checkAndLogout,
  parseJwt,
};
