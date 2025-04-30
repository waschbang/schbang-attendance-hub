// API Configuration for different environments
const isDevelopment = import.meta.env.DEV;

// Zoho API configuration
export const ZOHO_CONFIG = {
  // Auth endpoints
  auth: {
    // In development, use the proxy to avoid CORS issues
    // In production, use the direct Zoho OAuth endpoint
    tokenUrl: isDevelopment 
      ? '/zoho-oauth/oauth/v2/token'
      : 'https://accounts.zoho.com/oauth/v2/token',
  },
  
  // API endpoints
  api: {
    // In development, use the proxy to avoid CORS issues
    // In production, use the direct Zoho People API endpoint
    baseUrl: isDevelopment 
      ? '/zoho-api/people/api'
      : 'https://people.zoho.com/people/api',
  },
  
  // Credentials (same for both environments)
  credentials: {
    clientId: '1000.QE5OL40NQ9B5KHJRSZ62HSRKRWQSDQ',
    clientSecret: '3bb27cd2c2683a27d2a3a86398184326e5e842009f',
    refreshToken: '1000.8a88e31cf4b7ca918adfc95c1bf7111c.2d6e8b9fa79b49a7e01ad2cac86587c2',
  }
};

// Helper function to get the correct API URL based on environment
export const getApiUrl = (endpoint) => {
  return `${ZOHO_CONFIG.api.baseUrl}${endpoint}`;
};
