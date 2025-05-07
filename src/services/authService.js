import axios from "axios";

import { ZOHO_CONFIG } from "../config/apiConfig";

// Use the configuration from apiConfig.js
const ZOHO_AUTH_CONFIG = {
  clientId: ZOHO_CONFIG.credentials.clientId,
  clientSecret: ZOHO_CONFIG.credentials.clientSecret,
  refreshToken: ZOHO_CONFIG.credentials.refreshToken,
  tokenUrl: ZOHO_CONFIG.auth.tokenUrl,
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
/**
 * Refresh the access token with retry logic for rate limiting
 * @param {number} retryCount - Number of retries attempted (default: 0)
 * @param {number} delay - Delay before retrying in ms (default: 1000)
 * @returns {Promise<string>} The new access token
 */
export const refreshAccessToken = async (retryCount = 0, delay = 1000) => {
  try {
    // If we've already retried too many times, use the existing token if it exists
    if (retryCount >= 3 && tokenData.accessToken) {
      return tokenData.accessToken;
    }

    const formData = new URLSearchParams();
    formData.append("client_id", ZOHO_AUTH_CONFIG.clientId);
    formData.append("client_secret", ZOHO_AUTH_CONFIG.clientSecret);
    formData.append("refresh_token", ZOHO_AUTH_CONFIG.refreshToken);
    formData.append("grant_type", "refresh_token");

    // Check if we're in development or production mode
    const isDevelopment = import.meta.env.DEV;

    // In development, use the standard token URL with form data
    // In production, use the serverless function with form data
    const response = await axios.post(ZOHO_AUTH_CONFIG.tokenUrl, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Extract the access token and calculate expiration time
    // We'll set it to expire 10 seconds before the actual expiry to be safe
    const { access_token, expires_in } = response.data;
    const expiresAt = Date.now() + (expires_in - 10) * 1000;

    // Update token data
    tokenData = {
      accessToken: access_token,
      expiresAt: expiresAt,
      rateLimited: false,
      lastRefresh: Date.now(),
    };

    // Schedule the next refresh
    scheduleTokenRefresh();

    return access_token;
  } catch (error) {
    const errorData = error.response ? error.response.data : "No response data";

    // Check if this is a rate limiting error
    const isRateLimitError =
      errorData &&
      errorData.error === "Access Denied" &&
      errorData.error_description &&
      errorData.error_description.includes("too many requests");

    if (isRateLimitError) {
      tokenData.rateLimited = true;

      // If we still have a token, use it until we can refresh
      if (tokenData.accessToken) {
        return tokenData.accessToken;
      }

      // Retry with exponential backoff if we don't have a token
      if (retryCount < 3) {
        const retryDelay = delay * Math.pow(2, retryCount);

        return new Promise((resolve) => {
          setTimeout(async () => {
            const token = await refreshAccessToken(retryCount + 1, delay);
            resolve(token);
          }, retryDelay);
        });
      }
    }

    // For other errors or if retries are exhausted, propagate the error
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

  // Set timer for next refresh
  refreshTimer = setTimeout(() => {
    refreshAccessToken().catch((error) => {
      // Failed to refresh token
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
  if (
    !tokenData.accessToken ||
    !tokenData.expiresAt ||
    now >= tokenData.expiresAt
  ) {
    return refreshAccessToken();
  }

  // Return existing valid token
  return tokenData.accessToken;
};

/**
 * Initialize the auth service and get the first token
 */
export const initAuthService = async () => {
  return refreshAccessToken();
};

/**
 * Get authorization header with a valid token
 * @returns {Promise<Object>} Authorization header object
 */
export const getAuthHeader = async () => {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Export a configured axios instance with auth headers
export const createAuthenticatedAxiosInstance = async () => {
  const token = await getAccessToken();

  return axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};
