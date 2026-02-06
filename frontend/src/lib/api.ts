import axios from 'axios';

const api = axios.create({
<<<<<<< HEAD
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
=======
    baseURL: 'http://localhost:5000/api',
>>>>>>> eb350fc1270f051cd81901d9cb9f9a48dbc543be
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add Interceptor for Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
