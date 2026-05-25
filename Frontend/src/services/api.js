import axios from 'axios';

// Set default API base URL (Vercel deployment can override this)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('udhaar_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle general API responses or token expiries
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized (token expired or invalid), remove local credentials
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('udhaar_token');
      localStorage.removeItem('udhaar_user');
      // We don't trigger hard redirect here to let AuthContext state transition gracefully
    }
    
    // Bubble up formatting for standard error messages
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    return Promise.reject({ ...error, message });
  }
);

export default api;
