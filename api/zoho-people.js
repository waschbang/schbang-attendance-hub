// Serverless function to proxy Zoho People API requests
import axios from 'axios';

export default async function handler(req, res) {
  // Set CORS headers to allow requests from your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Extract the path and query parameters
  const { path, ...queryParams } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Path parameter is required' });
  }
  
  try {
    // Construct the full Zoho People API URL
    const zohoUrl = `https://people.zoho.com/people/api/${path}`;
    
    // Forward the request to Zoho People API
    const response = await axios({
      method: req.method,
      url: zohoUrl,
      params: queryParams,
      data: req.body,
      headers: {
        ...req.headers,
        host: 'people.zoho.com',
        origin: 'https://people.zoho.com',
        referer: 'https://people.zoho.com/'
      }
    });
    
    // Return the response from Zoho
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Zoho People API proxy error:', error);
    
    // Return error details
    return res.status(error.response?.status || 500).json({
      error: 'Error proxying request to Zoho People API',
      details: error.response?.data || error.message
    });
  }
}
