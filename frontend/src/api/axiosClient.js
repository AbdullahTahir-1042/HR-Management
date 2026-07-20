import axios from 'axios';

const pendingRequests = new Map();

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Request Interceptor: Automatically attach x-auth-token to all outgoing requests
apiClient.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem('token') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('x-auth-token') ||
            localStorage.getItem('accessToken');

        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Override GET method to deduplicate simultaneous identical in-flight requests
const originalGet = apiClient.get.bind(apiClient);

apiClient.get = function (url, config = {}) {
    const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('x-auth-token') ||
        '';

    const paramsStr = config.params ? JSON.stringify(config.params) : '';
    const requestKey = `GET:${url}:${paramsStr}:${token}`;

    if (pendingRequests.has(requestKey)) {
        return pendingRequests.get(requestKey);
    }

    const requestPromise = originalGet(url, config).finally(() => {
        pendingRequests.delete(requestKey);
    });

    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
};

export default apiClient;
