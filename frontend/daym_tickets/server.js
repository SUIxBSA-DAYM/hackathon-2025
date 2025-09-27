/**
 * Salt Server Proxy
 * Simple backend service to proxy salt requests and avoid CORS
 */
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

const SALT_SERVER_URL = 'https://salt.api.mystenlabs.com/get_salt';

// Salt endpoint proxy
app.post('/api/zkp/salt', async (req, res) => {
  try {
    const { jwt } = req.body;

    if (!jwt) {
      return res.status(400).json({ error: 'JWT token is required' });
    }

    console.log('Proxying salt request...');

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
    console.log('Salt request successful');
    
    res.json(data);

  } catch (error) {
    console.error('Salt server proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to get salt from server',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'zkLogin API Proxy' });
});

app.listen(PORT, () => {
  console.log(`zkLogin API Proxy running on http://localhost:${PORT}`);
});

export default app;