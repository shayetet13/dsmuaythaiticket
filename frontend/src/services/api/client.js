import axios from 'axios';
import { API_CONFIG, SECURITY_CONFIG, getApiUrl } from '../../config/env';
import { getSecurityHeaders } from '../../config/security';
import { apiRateLimiter } from '../../config/security';
import { removeSensitiveData } from '../../utils/security';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...getSecurityHeaders(),
  },
});

// Request interceptor - Add auth tokens securely
apiClient.interceptors.request.use(
  (config) => {
    // Rate limiting check
    const requestKey = `${config.method}-${config.url}`;
    if (!apiRateLimiter.isAllowed(requestKey)) {
      return Promise.reject(new Error('Too many requests. Please try again later.'));
    }
    
    // Add API token if available (from environment variable)
    // ⚠️ Token is stored in environment variable, not in code
    if (SECURITY_CONFIG.API_TOKEN) {
      config.headers.Authorization = `Bearer ${SECURITY_CONFIG.API_TOKEN}`;
    }
    
    // Add API key if available
    // ⚠️ API Key is stored in environment variable, not in code
    if (SECURITY_CONFIG.API_KEY) {
      config.headers['X-API-Key'] = SECURITY_CONFIG.API_KEY;
    }
    
    // Add request ID for tracking (doesn't expose sensitive data)
    config.headers['X-Request-ID'] = crypto.randomUUID();
    
    // Add timestamp
    config.headers['X-Request-Time'] = new Date().toISOString();
    
    // Remove sensitive data from logs (if debug mode)
    if (SECURITY_CONFIG.ENABLE_DEBUG) {
      const cleanedConfig = removeSensitiveData(config);
      console.log('API Request:', cleanedConfig);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and retries
apiClient.interceptors.response.use(
  (response) => {
    // Remove sensitive headers from response before logging
    if (SECURITY_CONFIG.ENABLE_DEBUG) {
      const cleanedResponse = {
        ...response,
        headers: removeSensitiveData(response.headers),
        data: removeSensitiveData(response.data),
      };
      console.log('API Response:', cleanedResponse);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Retry logic for network errors
    if (
      !originalRequest._retry &&
      error.code === 'ECONNABORTED' &&
      originalRequest._retryCount < API_CONFIG.RETRY.MAX_RETRIES
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      await new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.RETRY.RETRY_DELAY * originalRequest._retryCount)
      );
      
      return apiClient(originalRequest);
    }
    
    // Handle specific error cases (don't expose sensitive info)
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const errorData = removeSensitiveData(error.response.data || {});
      
      switch (status) {
        case 401:
          // Unauthorized - clear tokens, redirect to login
          console.error('Unauthorized access');
          // Clear any stored tokens
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 429:
          // Too many requests
          console.error('Rate limit exceeded');
          break;
        case 500:
          // Server error - don't expose server details
          console.error('Server error');
          break;
        default:
          console.error('API Error:', status);
      }
      
      // Log error without sensitive data
      if (SECURITY_CONFIG.ENABLE_DEBUG) {
        console.error('Error details:', errorData);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - no response received');
    } else {
      // Something else happened - sanitize error message
      const sanitizedMessage = error.message?.replace(/token|password|secret|key/gi, '***');
      console.error('Error:', sanitizedMessage);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

