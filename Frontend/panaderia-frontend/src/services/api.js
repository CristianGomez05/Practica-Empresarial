// src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,  // ✅ CAMBIAR /core por /api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para autorizar requests si tienes token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access') || sessionStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('❌ Error API:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ No response from server:', error.request);
    } else {
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;