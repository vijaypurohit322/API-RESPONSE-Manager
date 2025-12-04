import axios from 'axios';

// const API_URL = 'import.meta.env.VITE_API_URL/tunnels';
const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.tunnelapi.in';
const API_URL = `${API_BASE}/tunnels`;

// Get auth token from localStorage
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.token : null;
};

// Create axios instance with auth header
const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

const tunnelService = {
  // Create a new tunnel
  createTunnel: async (tunnelData) => {
    const response = await axiosInstance.post('/', tunnelData);
    return response.data;
  },

  // Get all tunnels
  getTunnels: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosInstance.get(`/?${params}`);
    return response.data;
  },

  // Get tunnel by ID
  getTunnelById: async (id) => {
    const response = await axiosInstance.get(`/${id}`);
    return response.data;
  },

  // Update tunnel status
  updateTunnelStatus: async (id, status, connectionId = null) => {
    const response = await axiosInstance.put(`/${id}/status`, {
      status,
      connectionId,
    });
    return response.data;
  },

  // Delete tunnel
  deleteTunnel: async (id) => {
    const response = await axiosInstance.delete(`/${id}`);
    return response.data;
  },

  // Send heartbeat
  sendHeartbeat: async (id) => {
    const response = await axiosInstance.post(`/${id}/heartbeat`);
    return response.data;
  },

  // Get tunnel statistics
  getTunnelStats: async (id) => {
    const response = await axiosInstance.get(`/${id}/stats`);
    return response.data;
  },

  // Check subdomain availability
  checkSubdomain: async (subdomain) => {
    const response = await axiosInstance.get(`/check/${subdomain}`);
    return response.data;
  },

  // Update IP whitelist
  updateIPWhitelist: async (id, ipWhitelist) => {
    const response = await axiosInstance.put(`/${id}/ip-whitelist`, { ipWhitelist });
    return response.data;
  },

  // Update IP blacklist
  updateIPBlacklist: async (id, ipBlacklist) => {
    const response = await axiosInstance.put(`/${id}/ip-blacklist`, { ipBlacklist });
    return response.data;
  },

  // Update tunnel (including rate limits)
  updateTunnel: async (id, updates) => {
    const response = await axiosInstance.put(`/${id}`, updates);
    return response.data;
  },
};

export default tunnelService;
