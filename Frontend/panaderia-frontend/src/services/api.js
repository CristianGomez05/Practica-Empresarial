// Frontend/panaderia-frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// 🔍 DEBUG: Ver qué URL está usando
console.log('🔗 API URL:', API_URL);
console.log('📦 Mode:', import.meta.env.MODE);
console.log('🌍 Environment:', import.meta.env);

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000, // 30 segundos (aumentado de 10s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para autorizar requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access') || sessionStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para debugging (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    // Log para debugging (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si no hay respuesta del servidor
    if (!error.response) {
      console.error('❌ No response from server:', error.request);
      return Promise.reject(error);
    }

    console.error(`❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response.status}`);

    // Token expirado - intentar refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh') || sessionStorage.getItem('refresh');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        
        // Actualizar token en storage
        if (localStorage.getItem('access')) {
          localStorage.setItem('access', access);
        } else {
          sessionStorage.setItem('access', access);
        }
        
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Error refreshing token:', refreshError);
        
        // Limpiar storage y redirigir al login
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        sessionStorage.removeItem('access');
        sessionStorage.removeItem('refresh');
        localStorage.removeItem('user');
        
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;