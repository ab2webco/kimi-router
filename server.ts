import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { formatAnthropicToOpenAI } from './formatRequest';
import { formatOpenAIToAnthropic } from './formatResponse';
import { streamOpenAIToAnthropic } from './streamResponse';
import { generateIndexHtml } from './generateIndexHtml';
import { termsHtml } from './termsHtml';
import { privacyHtml } from './privacyHtml';
import { generateInstallSh } from './installSh';

// Utility to read request body with proper encoding
function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalLength = 0;
    
    req.on('data', chunk => {
      chunks.push(chunk);
      totalLength += chunk.length;
    });
    
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks, totalLength).toString('utf8');
        resolve(body);
      } catch (error) {
        reject(error);
      }
    });
    
    req.on('error', reject);
  });
}

// Utility to get client IP
function getClientIP(req: IncomingMessage): string {
  return req.headers['x-forwarded-for'] as string || 
         req.headers['x-real-ip'] as string || 
         req.connection.remoteAddress || 
         'unknown';
}

// Request deduplication cache
const activeRequests = new Map<string, Promise<any>>();

function getRequestHash(body: any): string {
  // Create hash from model + last message content to detect duplicates
  const lastMessage = body.messages?.[body.messages.length - 1];
  const content = typeof lastMessage?.content === 'string' 
    ? lastMessage.content 
    : JSON.stringify(lastMessage?.content || '');
  return `${body.model || 'unknown'}:${content.slice(0, 100)}`;
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Home page
    if (url.pathname === '/' && req.method === 'GET') {
      let baseUrl = process.env.BASE_URL;
      if (!baseUrl) {
        const host = req.headers.host;
        if (host === 'kimi.koombea.io') {
          baseUrl = 'https://kimi.koombea.io';
        } else {
          baseUrl = `http://${host}`;
        }
      }
      
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(generateIndexHtml(baseUrl));
      return;
    }
    
    // Terms page
    if (url.pathname === '/terms' && req.method === 'GET') {
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(termsHtml);
      return;
    }
    
    // Privacy page
    if (url.pathname === '/privacy' && req.method === 'GET') {
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(privacyHtml);
      return;
    }
    
    // Install script
    if (url.pathname === '/install.sh' && req.method === 'GET') {
      let baseUrl = process.env.BASE_URL;
      if (!baseUrl) {
        const host = req.headers.host;
        if (host === 'kimi.koombea.io') {
          baseUrl = 'https://kimi.koombea.io';
        } else {
          baseUrl = `http://${host}`;
        }
      }
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.writeHead(200);
      res.end(generateInstallSh(baseUrl));
      return;
    }
    
    // Main API endpoint - EXACT replica of index.ts logic
    if (url.pathname === '/v1/messages' && req.method === 'POST') {
      const bodyText = await readRequestBody(req);
      
      // Replicate Cloudflare Workers request.json() behavior
      // Use the same permissive parsing that Cloudflare Workers uses
      let anthropicRequest;
      try {
        // Try standard JSON.parse first
        anthropicRequest = JSON.parse(bodyText);
      } catch (strictParseError) {
        try {
          // Fallback: Clean JSON like Cloudflare Workers does internally  
          const cleanedBodyText = bodyText.replace(/\\([^"\\\/bfnrtu])/g, '$1');
          anthropicRequest = JSON.parse(cleanedBodyText);
        } catch (parseError) {
          const error = parseError as Error;
          console.error('JSON Parse Error (after cleaning):', error.message);
          console.error('Body length:', bodyText.length);
          console.error('Body preview (first 200 chars):', bodyText.substring(0, 200));
          console.error('Character at error position:', bodyText.charAt(128));
          console.error('Characters around error (120-140):', bodyText.substring(120, 140));
          
          res.writeHead(400);
          res.end(JSON.stringify({
            error: {
              type: 'invalid_request_error',
              message: 'Invalid JSON in request body'
            }
          }));
          return;
        }
      }
      
      // Detect and handle duplicate requests
      const requestHash = getRequestHash(anthropicRequest);
      const existingRequest = activeRequests.get(requestHash);
      
      if (existingRequest) {
        console.log(`🔄 Duplicate request detected, waiting for existing: ${requestHash.slice(0, 20)}...`);
        // Wait for the existing request but don't use its response directly
        // This prevents race conditions but still allows independent processing
        try {
          await existingRequest;
        } catch (e) {
          // Ignore errors from the existing request
        }
        // Small delay to prevent immediate duplicate processing
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const openaiRequest = formatAnthropicToOpenAI(anthropicRequest, process.env);
      const bearerToken = req.headers['x-api-key'] as string;
      
      const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      
      // Register this request
      const requestPromise = fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${bearerToken}`,
          "User-Agent": "Kimi-Router/1.0 (https://github.com/ab2webco/kimi-router)",
          "X-Forwarded-For": getClientIP(req),
          "HTTP-Referer": "https://kimi.koombea.io",
          "X-Title": "Kimi Router",
        },
        body: JSON.stringify(openaiRequest),
      });
      
      activeRequests.set(requestHash, requestPromise);
      const openaiResponse = await requestPromise;
      
      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        activeRequests.delete(requestHash); // Clean up on error
        res.writeHead(openaiResponse.status);
        res.end(errorText);
        return;
      }
      
      if (openaiRequest.stream) {
        const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        console.log(`🌊 Starting stream ${requestId} for model: ${openaiRequest.model}`);
        
        // EXACT same logic as index.ts - create Web Response then stream
        const anthropicStream = streamOpenAIToAnthropic(openaiResponse.body as ReadableStream, openaiRequest.model);
        const webResponse = new Response(anthropicStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
        
        // Set headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.writeHead(200);
        
        // Stream the response
        if (webResponse.body) {
          const reader = webResponse.body.getReader();
          
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                res.write(value);
              }
            } catch (error) {
              console.error('Streaming error:', error);
            } finally {
              reader.releaseLock();
              res.end();
              activeRequests.delete(requestHash); // Clean up after streaming
              console.log(`🏁 Stream ${requestId} completed`);
            }
          };
          
          // Handle client disconnect
          req.on('close', () => {
            try {
              reader.releaseLock();
            } catch (e) {
              // Already released
            }
          });
          
          pump();
        } else {
          res.end();
        }
      } else {
        // Non-streaming response
        const openaiData = await openaiResponse.json();
        const anthropicResponse = formatOpenAIToAnthropic(openaiData, openaiRequest.model);
        
        activeRequests.delete(requestHash); // Clean up after non-streaming
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(anthropicResponse));
      }
      return;
    }
    
    // 404
    res.writeHead(404);
    res.end('Not Found');
    
  } catch (error) {
    console.error('Server error:', error);
    // Clean up any active requests on server error
    if (req.url === '/v1/messages' && req.method === 'POST') {
      // We can't easily get the request hash here, so we'll clear old entries
      const now = Date.now();
      for (const [hash, promise] of activeRequests.entries()) {
        // Clear requests older than 30 seconds
        if (now - parseInt(hash.split(':')[0] || '0') > 30000) {
          activeRequests.delete(hash);
        }
      }
    }
    res.writeHead(500);
    res.end(JSON.stringify({ 
      error: { 
        type: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    }));
  }
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Use http://localhost:${port} as your ANTHROPIC_BASE_URL`);
  console.log(`BASE_URL environment variable: ${process.env.BASE_URL || 'not set'}`);
  console.log(`OPENROUTER_BASE_URL environment variable: ${process.env.OPENROUTER_BASE_URL || 'not set'}`);
  console.log(`ANTHROPIC_MODEL environment variable: ${process.env.ANTHROPIC_MODEL || 'not set'}`);
  console.log(`ANTHROPIC_VISION_MODEL environment variable: ${process.env.ANTHROPIC_VISION_MODEL || 'not set'}`);
  console.log(`ANTHROPIC_SMALL_FAST_MODEL environment variable: ${process.env.ANTHROPIC_SMALL_FAST_MODEL || 'not set'}`);
});