import express from 'express';
import { formatAnthropicToOpenAI } from './formatRequest';
import { formatOpenAIToAnthropic } from './formatResponse';
import { streamOpenAIToAnthropic } from './streamResponse';
import { generateIndexHtml } from './generateIndexHtml';
import { termsHtml } from './termsHtml';
import { privacyHtml } from './privacyHtml';
import { generateInstallSh } from './installSh';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Página principal
app.get('/', (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(generateIndexHtml(baseUrl));
});

// Páginas estáticas
app.get('/terms', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(termsHtml);
});

app.get('/privacy', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(privacyHtml);
});

app.get('/install.sh', (req, res) => {
  try {
    console.log('Install.sh endpoint accessed');
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(generateInstallSh(baseUrl));
  } catch (error) {
    console.error('Error serving install.sh:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint principal de la API
app.post('/v1/messages', async (req, res) => {
  try {
    const anthropicRequest = req.body;
    const openaiRequest = formatAnthropicToOpenAI(anthropicRequest);
    const bearerToken = req.headers['x-api-key'] as string;

    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    const openaiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bearerToken}`,
        "User-Agent": "Kimi-Router/1.0 (https://github.com/ab2webco/kimi-router)",
        "X-Forwarded-For": req.ip || req.connection.remoteAddress || 'unknown',
        "HTTP-Referer": "https://kimi.koombea.io",
        "X-Title": "Kimi Router",
      },
      body: JSON.stringify(openaiRequest),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return res.status(openaiResponse.status).send(errorText);
    }

    if (openaiRequest.stream) {
      // EXACTLY replicate Cloudflare Workers approach - SIMPLE!
      const anthropicStream = streamOpenAIToAnthropic(openaiResponse.body as ReadableStream, openaiRequest.model);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Pipe the stream directly - simple like original
      const nodeStream = new ReadableStream({
        start(controller) {
          const reader = anthropicStream.getReader();
          function pump(): any {
            return reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              return pump();
            });
          }
          return pump();
        }
      });
      
      const response = new Response(nodeStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
      
      // Convert Web Streams API response to Node.js response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(decoder.decode(value, { stream: true }));
          }
        } finally {
          res.end();
          reader.releaseLock();
        }
      };
      
      processStream();
    } else {
      const openaiData = await openaiResponse.json();
      const anthropicResponse = formatOpenAIToAnthropic(openaiData, openaiRequest.model);
      res.json(anthropicResponse);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: { 
        type: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).send('Not Found');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Use http://localhost:${port} as your ANTHROPIC_BASE_URL`);
  console.log(`BASE_URL environment variable: ${process.env.BASE_URL || 'not set'}`);
  console.log(`OPENROUTER_BASE_URL environment variable: ${process.env.OPENROUTER_BASE_URL || 'not set'}`);
});