import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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

// Add Interceptor for Response Formatting
api.interceptors.response.use(
    (response) => {
        // If the response follows the standard { success: true, data: ... } format, unwrap it
        if (response.data && response.data.success === true && response.data.data !== undefined) {
            return {
                ...response,
                data: response.data.data,
                meta: response.data.pagination || response.data.count ? {
                    count: response.data.count,
                    pagination: response.data.pagination
                } : undefined
            };
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
