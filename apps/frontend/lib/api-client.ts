import axios from 'axios';

// Create a configured axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.shopflow.com/api/v1', // Fallback to a real or mock domain if no env var
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token if available
apiClient.interceptors.request.use(
  (config) => {
    // Check if running in browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle global errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear token
        localStorage.removeItem('auth_token');
        // You can dispatch a custom event here for AuthProvider to listen to, or redirect directly
        // window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);
