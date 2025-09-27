import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* Commented out API middleware for Mysten Labs salt server
 * If you want to use the Mysten Labs salt server, please refer to Enoki docs and contact us.
 * Only valid JWT authenticated with whitelisted client IDs are accepted.
 *
// API middleware for zkLogin proxy
function apiPlugin() {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/zkp/salt', async (req, res) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

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
            const saltResponse = await fetch('https://salt.api.mystenlabs.com/get_salt', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: jwt }),
            });

            const saltData = await saltResponse.json();
            
            res.statusCode = saltResponse.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(saltData));

          } catch (error) {
            console.error('Salt proxy error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              error: 'Failed to get salt',
              message: error.message 
            }));
          }
        });
      });
    }
  };
}
*/

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()], // Removed apiPlugin() since we're using self-generated salt
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist'
  },
  css: {
    postcss: './postcss.config.mjs'
  }
})