import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const savedUser = localStorage.getItem('webpush_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.username) {
          config.headers['X-User-Username'] = user.username;
        }
      } catch {
        // ignore error
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      window.dispatchEvent(new CustomEvent('webpush-auth-unauthorized', { detail: error.response.status }));
    }
    return Promise.reject(error);
  }
);

export default api;
