import axios from 'axios';

// const API_URL = 'import.meta.env.VITE_API_URL/webhooks';
const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.tunnelapi.in';
const API_URL = `${API_BASE}/webhooks`;

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

// Create webhook
const createWebhook = async (webhookData) => {
  const response = await axiosInstance.post('/', webhookData);
  return response.data;
};

// Get all webhooks
const getWebhooks = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axiosInstance.get(`/?${params}`);
  return response.data;
};

// Get webhook by ID
const getWebhookById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return response.data;
};

// Update webhook
const updateWebhook = async (id, webhookData) => {
  const response = await axiosInstance.put(`/${id}`, webhookData);
  return response.data;
};

// Delete webhook
const deleteWebhook = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data;
};

// Get webhook statistics
const getWebhookStats = async (id) => {
  const response = await axiosInstance.get(`/${id}/stats`);
  return response.data;
};

// Get webhook requests (history)
const getWebhookRequests = async (id, params = {}) => {
  const queryParams = new URLSearchParams(params);
  const response = await axiosInstance.get(`/${id}/requests?${queryParams}`);
  return response.data;
};

// Get single webhook request
const getWebhookRequest = async (webhookId, requestId) => {
  const response = await axiosInstance.get(`/${webhookId}/requests/${requestId}`);
  return response.data;
};

// Replay webhook request
const replayWebhookRequest = async (webhookId, requestId) => {
  const response = await axiosInstance.post(`/${webhookId}/requests/${requestId}/replay`);
  return response.data;
};

// Resend webhook request with modifications
const resendWebhookRequest = async (webhookId, requestId, modifications) => {
  const response = await axiosInstance.post(`/${webhookId}/requests/${requestId}/resend`, modifications);
  return response.data;
};

export default {
  createWebhook,
  getWebhooks,
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  getWebhookStats,
  getWebhookRequests,
  getWebhookRequest,
  replayWebhookRequest,
  resendWebhookRequest
};
