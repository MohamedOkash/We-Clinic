import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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
    console.log('Loaded environment variables successfully.');
  }
} catch (err) {
  console.error('Failed to parse .env file:', err.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Rate Limiter: max 20 requests/minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many requests from this IP, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting specifically to the Gemini proxy route
app.use('/api/gemini', limiter);

// Proxy POST route for Gemini with automatic model fallback
app.post('/api/gemini', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    // Input sanitization: max 2000 chars per message content
    const sanitizedMessages = messages.map(m => {
      let content = m.content || m.text || '';
      if (typeof content !== 'string') content = '';
      return {
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: content.substring(0, 2000) }]
      };
    });

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('xxxxxxx')) {
      return res.status(500).json({ error: 'Google Gemini API key not configured on the backend server.' });
    }

    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt || '' }] },
      contents: sanitizedMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      }
    });

    const callModel = (modelName) => {
      return new Promise((resolve, reject) => {
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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
            try {
              const parsedData = JSON.parse(responseData);
              resolve({ statusCode: geminiRes.statusCode, data: parsedData });
            } catch (parseErr) {
              reject(parseErr);
            }
          });
        });

        geminiReq.on('error', reject);
        geminiReq.write(payload);
        geminiReq.end();
      });
    };

    try {
      let result = await callModel('gemini-2.0-flash');
      const isQuotaExceeded = result.statusCode === 429 || 
        (result.data?.error?.message?.includes('Quota exceeded') || false) || 
        (result.data?.error?.message?.includes('quota') || false) ||
        (result.data?.error?.message?.includes('limit') || false);

      if (isQuotaExceeded) {
        console.warn('Gemini 2.0 Flash quota exceeded. Falling back to Gemini 1.5 Flash...');
        result = await callModel('gemini-1.5-flash');
      }

      if (result.statusCode !== 200) {
        const errMsg = result.data?.error?.message || `Google API status ${result.statusCode}`;
        if (result.statusCode === 429 || errMsg.includes('Quota exceeded') || errMsg.includes('quota') || errMsg.includes('limit')) {
          return res.status(429).json({ error: 'لقد تم تجاوز الحد الأقصى للاستخدام المجاني للذكاء الاصطناعي حالياً. يرجى الانتظار دقيقة وإعادة المحاولة.' });
        }
        return res.status(result.statusCode).json(result.data);
      }

      const text = result.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Error';
      res.json({ text });
    } catch (apiError) {
      console.error('Error forwarding request to Gemini:', apiError);
      res.status(500).json({ error: 'Failed to communicate with Google Gemini API', details: apiError.message });
    }

  } catch (error) {
    console.error('Proxy internal error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Start the server (only if run directly as a Node script)
if (process.env.NODE_ENV !== 'test' && !process.env.FIREBASE_CONFIG) {
  app.listen(PORT, () => {
    console.log(`Gemini API Proxy Server running on port ${PORT}`);
  });
}

// Export Express app for Firebase Cloud Functions or other serverless backends
export default app;
