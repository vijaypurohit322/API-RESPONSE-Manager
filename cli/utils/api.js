const axios = require('axios');
const config = require('./config');
const chalk = require('chalk');

class APIClient {
  constructor() {
    this.baseURL = config.get('apiUrl') || 'http://localhost:5000/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers['x-auth-token'] = token;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error(chalk.red('Authentication failed. Please run: arm login'));
          process.exit(1);
        }
        throw error;
      }
    );
  }

  getToken() {
    return config.get('token');
  }

  setToken(token) {
    config.set('token', token);
  }

  clearToken() {
    config.delete('token');
  }

  // Auth
  async login(email, password) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(name, email, password) {
    const response = await this.client.post('/auth/register', { name, email, password });
    return response.data;
  }

  // Tunnels
  async createTunnel(data) {
    const response = await this.client.post('/tunnels', data);
    return response.data;
  }

  async getTunnels() {
    const response = await this.client.get('/tunnels');
    return response.data;
  }

  async getTunnel(id) {
    const response = await this.client.get(`/tunnels/${id}`);
    return response.data;
  }

  async deleteTunnel(id) {
    const response = await this.client.delete(`/tunnels/${id}`);
    return response.data;
  }

  async getTunnelStats(id) {
    const response = await this.client.get(`/tunnels/${id}/stats`);
    return response.data;
  }

  async getTunnelRequests(id, params = {}) {
    const response = await this.client.get(`/tunnels/${id}/requests`, { params });
    return response.data;
  }

  // Webhooks
  async createWebhook(data) {
    const response = await this.client.post('/webhooks', data);
    return response.data;
  }

  async getWebhooks() {
    const response = await this.client.get('/webhooks');
    return response.data;
  }

  async getWebhook(id) {
    const response = await this.client.get(`/webhooks/${id}`);
    return response.data;
  }

  async deleteWebhook(id) {
    const response = await this.client.delete(`/webhooks/${id}`);
    return response.data;
  }

  async getWebhookRequests(id, params = {}) {
    const response = await this.client.get(`/webhooks/${id}/requests`, { params });
    return response.data;
  }

  async replayWebhookRequest(webhookId, requestId) {
    const response = await this.client.post(`/webhooks/${webhookId}/requests/${requestId}/replay`);
    return response.data;
  }

  // Projects
  async getProjects() {
    const response = await this.client.get('/projects');
    return response.data;
  }

  async createProject(data) {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  async getProject(id) {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async getProjectResponses(id, params = {}) {
    const response = await this.client.get(`/projects/${id}/responses`, { params });
    return response.data;
  }
}

module.exports = new APIClient();
