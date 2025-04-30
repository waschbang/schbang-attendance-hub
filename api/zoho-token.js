// Serverless function to proxy Zoho OAuth token requests
import axios from 'axios';

export default async function handler(req, res) {
  // Set CORS headers to allow requests from your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Forward the request to Zoho OAuth endpoint
    const response = await axios.post(
      'https://accounts.zoho.com/oauth/v2/token',
      req.body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Return the response from Zoho
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Zoho OAuth proxy error:', error);
    
    // Return error details
    return res.status(error.response?.status || 500).json({
      error: 'Error proxying request to Zoho',
      details: error.response?.data || error.message
    });
  }
}
