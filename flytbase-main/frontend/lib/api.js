import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiCache = new Map();
const CACHE_TTL = 5000; // 5 seconds

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Handle caching for GET requests
  if (config.method === 'get') {
    const cacheKey = config.url + JSON.stringify(config.params || {});
    const cachedResponse = apiCache.get(cacheKey);

    if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
      config.adapter = () => Promise.resolve({
        ...cachedResponse.data,
        config,
        status: 200,
        statusText: 'OK',
        headers: {},
        request: {}
      });
    }
  } else {
    // Clear cache on any state-changing request (POST, PUT, DELETE)
    apiCache.clear();
  }

  return config;
});

// Handle auth errors and Cache storage
api.interceptors.response.use(
  (response) => {
    // Store in cache if GET request
    if (response.config.method === 'get') {
      const cacheKey = response.config.url + JSON.stringify(response.config.params || {});
      apiCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
    }
    return response;
  },
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// Missions API
export const missionsAPI = {
  getAll: (params) => api.get('/missions', { params }),
  getById: (id) => api.get(`/missions/${id}`),
  create: (data) => api.post('/missions', data),
  update: (id, data) => api.put(`/missions/${id}`, data),
  delete: (id) => api.delete(`/missions/${id}`),
  control: (id, action) => api.post(`/missions/${id}/control`, { action }),
};


// Fleet API
export const fleetAPI = {
  getAll: (params) => api.get('/fleet', { params }),
  getById: (id) => api.get(`/fleet/${id}`),
  create: (data) => api.post('/fleet', data),
  update: (id, data) => api.put(`/fleet/${id}`, data),
  delete: (id) => api.delete(`/fleet/${id}`),
  recharge: (id) => api.post(`/fleet/${id}/recharge`),
  maintenance: (id) => api.post(`/fleet/${id}/maintenance`),
  expandFleet: () => api.post('/fleet/seed'),
};

// Reports API
export const reportsAPI = {
  getMissionStats: (params) => api.get('/reports/missions/stats', { params }),
  getFleetStats: () => api.get('/reports/fleet/stats'),
  getMissionPerformance: (id) => api.get(`/reports/missions/${id}/performance`),
};

export default api;

