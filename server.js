import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

// ─── Simple .env file parser ───
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        let val = trimmed.substring(index + 1).trim();
        // Remove quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
    console.log('Loaded environment variables from .env file successfully.');
  } else {
    console.warn('.env file not found in current working directory.');
  }
} catch (err) {
  console.error('Failed to parse .env file:', err.message);
}

const PORT = process.env.PORT || 5000;

// ─── HTTP Proxy Server ───
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight options request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle Gemini proxy route
  if (req.method === 'POST' && req.url === '/api/gemini') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const { prompt } = parsed;

        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing prompt in request body' }));
          return;
        }

        // Get API Key from environment variables
        const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('xxxxxxx')) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Google Gemini API key not configured on the backend server.' }));
          return;
        }

        // Call Google Gemini API securely from the backend
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const payload = JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        });

        const geminiReq = https.request(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (geminiRes) => {
          let responseData = '';
          geminiRes.on('data', d => {
            responseData += d;
          });

          geminiRes.on('end', () => {
            res.writeHead(geminiRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(responseData);
          });
        });

        geminiReq.on('error', (err) => {
          console.error('Error forwarding request to Google Gemini API:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to communicate with Google Gemini API', details: err.message }));
        });

        geminiReq.write(payload);
        geminiReq.end();

      } catch (err) {
        console.error('Error processing proxy request:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON request body', details: err.message }));
      }
    });
  } else {
    // 404 for other endpoints
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Gemini API Proxy Server is running on port ${PORT}`);
});
