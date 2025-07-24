import { Env } from './env';
import { formatAnthropicToOpenAI } from './formatRequest';
import { streamOpenAIToAnthropic } from './streamResponse';
import { formatOpenAIToAnthropic } from './formatResponse';
import { generateIndexHtml } from './generateIndexHtml';
import { termsHtml } from './termsHtml';
import { privacyHtml } from './privacyHtml';
import { generateInstallSh } from './installSh';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/' && request.method === 'GET') {
      // Use HTTPS for production domain, fallback to BASE_URL env var or localhost for dev
      let baseUrl = env.BASE_URL;
      if (!baseUrl) {
        if (url.hostname === 'claude.ab2web.dev') {
          baseUrl = 'https://claude.ab2web.dev';
        } else {
          baseUrl = url.origin;
        }
      }
      return new Response(generateIndexHtml(baseUrl), {
        headers: { "Content-Type": "text/html" }
      });
    }
    
    if (url.pathname === '/terms' && request.method === 'GET') {
      return new Response(termsHtml, {
        headers: { "Content-Type": "text/html" }
      });
    }
    
    if (url.pathname === '/privacy' && request.method === 'GET') {
      return new Response(privacyHtml, {
        headers: { "Content-Type": "text/html" }
      });
    }
    
    if (url.pathname === '/install.sh' && request.method === 'GET') {
      // Use HTTPS for production domain, fallback to BASE_URL env var or localhost for dev
      let baseUrl = env.BASE_URL;
      if (!baseUrl) {
        if (url.hostname === 'claude.ab2web.dev') {
          baseUrl = 'https://claude.ab2web.dev';
        } else {
          baseUrl = url.origin;
        }
      }
      return new Response(generateInstallSh(baseUrl), {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    
    if (url.pathname === '/v1/messages' && request.method === 'POST') {
      const anthropicRequest = await request.json() as any;
      const openaiRequest = formatAnthropicToOpenAI(anthropicRequest);
      const bearerToken = request.headers.get("x-api-key");

      const baseUrl = env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      const openaiResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${bearerToken}`,
          "User-Agent": "Kimi-Router/1.0 (https://github.com/ab2webco/kimi-router)",
          "X-Forwarded-For": request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown",
          "HTTP-Referer": "https://claude.ab2web.dev",
          "X-Title": "Kimi Router",
        },
        body: JSON.stringify(openaiRequest),
      });

      if (!openaiResponse.ok) {
        return new Response(await openaiResponse.text(), { status: openaiResponse.status });
      }

      if (openaiRequest.stream) {
        const anthropicStream = streamOpenAIToAnthropic(openaiResponse.body as ReadableStream, openaiRequest.model);
        return new Response(anthropicStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      } else {
        const openaiData = await openaiResponse.json();
        const anthropicResponse = formatOpenAIToAnthropic(openaiData, openaiRequest.model);
        return new Response(JSON.stringify(anthropicResponse), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
}