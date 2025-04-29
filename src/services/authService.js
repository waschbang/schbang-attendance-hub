import axios from 'axios';

// Zoho OAuth configuration
const ZOHO_AUTH_CONFIG = {
  clientId: '1000.QE5OL40NQ9B5KHJRSZ62HSRKRWQSDQ',
  clientSecret: '3bb27cd2c2683a27d2a3a86398184326e5e842009f',
  refreshToken: '1000.8a88e31cf4b7ca918adfc95c1bf7111c.2d6e8b9fa79b49a7e01ad2cac86587c2',
  // Use the proxy endpoint to avoid CORS issues
  tokenUrl: '/zoho-oauth/oauth/v2/token',
};

// Token storage
let tokenData = {
  accessToken: null,
  expiresAt: null,
};

// Timer for auto-refresh
let refreshTimer = null;

/**
 * Refresh the access token
 * @returns {Promise<string>} The new access token
 */
export const refreshAccessToken = async () => {
  try {
    console.log('Refreshing Zoho access token...');
    
    const formData = new URLSearchParams();
    formData.append('client_id', ZOHO_AUTH_CONFIG.clientId);
    formData.append('client_secret', ZOHO_AUTH_CONFIG.clientSecret);
    formData.append('refresh_token', ZOHO_AUTH_CONFIG.refreshToken);
    formData.append('grant_type', 'refresh_token');
    
    const response = await axios.post(ZOHO_AUTH_CONFIG.tokenUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    console.log('Token refresh successful');
    
    // Extract the access token and calculate expiration time
    // We'll set it to expire 10 seconds before the actual expiry to be safe
    const { access_token, expires_in } = response.data;
    const expiresAt = Date.now() + (expires_in - 10) * 1000;
    
    // Update token data
    tokenData = {
      accessToken: access_token,
      expiresAt: expiresAt,
    };
    
    // Schedule the next refresh
    scheduleTokenRefresh();
    
    return access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};

/**
 * Schedule the next token refresh
 */
const scheduleTokenRefresh = () => {
  // Clear any existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  
  // Calculate time until next refresh (in milliseconds)
  const now = Date.now();
  const timeUntilRefresh = Math.max(0, tokenData.expiresAt - now);
  
  console.log(`Scheduling next token refresh in ${Math.floor(timeUntilRefresh / 1000)} seconds`);
  
  // Set timer for next refresh
  refreshTimer = setTimeout(() => {
    refreshAccessToken().catch(error => {
      console.error('Failed to refresh token in scheduled refresh:', error);
    });
  }, timeUntilRefresh);
};

/**
 * Get a valid access token, refreshing if necessary
 * @returns {Promise<string>} A valid access token
 */
export const getAccessToken = async () => {
  const now = Date.now();
  
  // If we don't have a token or it's expired, refresh it
  if (!tokenData.accessToken || !tokenData.expiresAt || now >= tokenData.expiresAt) {
    return refreshAccessToken();
  }
  
  // Return existing valid token
  return tokenData.accessToken;
};

/**
 * Initialize the auth service and get the first token
 */
export const initAuthService = async () => {
  console.log('Initializing auth service...');
  return refreshAccessToken();
};

/**
 * Get authorization header with a valid token
 * @returns {Promise<Object>} Authorization header object
 */
export const getAuthHeader = async () => {
  const token = await getAccessToken();
  return {
    'Authorization': `Bearer ${token}`,
  };
};

// Export a configured axios instance with auth headers
export const createAuthenticatedAxiosInstance = async () => {
  const token = await getAccessToken();
  
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};
