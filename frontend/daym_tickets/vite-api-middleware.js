// Simple API middleware for Vite dev server
import fetch from 'node-fetch';

const SALT_SERVER_URL = 'https://salt.api.mystenlabs.com/get_salt';

export function apiMiddleware() {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        // Handle CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        // Handle salt server proxy
        if (req.url === '/zkp/salt' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            try {
              const { jwt } = JSON.parse(body);

              if (!jwt) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'JWT token is required' }));
                return;
              }

              // Proxy to Mysten Labs salt server
              const response = await fetch(SALT_SERVER_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: jwt }),
              });

              const data = await response.text();
              
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(data);

            } catch (error) {
              console.error('Salt server proxy error:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                error: 'Failed to get salt from server',
                message: error.message 
              }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}