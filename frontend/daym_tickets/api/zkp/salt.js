/**
 * Salt Server Proxy API
 * 
 * This API endpoint proxies requests to Mysten Labs salt server
 * to avoid CORS issues in the frontend.
 */

const SALT_SERVER_URL = 'https://salt.api.mystenlabs.com/get_salt';

export default async function handler(req, res) {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { jwt } = req.body;

    if (!jwt) {
      res.status(400).json({ error: 'JWT token is required' });
      return;
    }

    // Proxy request to Mysten Labs salt server
    const response = await fetch(SALT_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: jwt }),
    });

    if (!response.ok) {
      throw new Error(`Salt server responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the salt data
    res.status(200).json(data);

  } catch (error) {
    console.error('Salt server proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to get salt from server',
      message: error.message 
    });
  }
}