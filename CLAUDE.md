# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Deploy to Cloudflare Workers
npm run deploy

# Set environment secrets (if deploying your own instance)
wrangler secret put OPENROUTER_BASE_URL
```

## Smart Model Selection

The router automatically selects the best model based on content type and environment variables.

### How it works

The router automatically:
- **Uses `moonshotai/kimi-k2`** for text conversations (economic, fast)
- **Switches to `anthropic/claude-3.5-sonnet`** when images are detected
- **No configuration needed** - works out of the box!

### Optional: Custom Vision Model

If you want to use a different model for images, you can set:

```bash
# Optional: Override the vision model (default is claude-3.5-sonnet)
export ANTHROPIC_VISION_MODEL=openai/gpt-4-vision-preview
```


## Architecture Overview

Kimi Router is a Cloudflare Worker that translates between Anthropic's Claude API format and OpenAI-compatible APIs. It enables Claude Code to work with OpenRouter and other OpenAI-compatible providers.

### Core Translation Flow

1. **Request Pipeline** (`/index.ts` → `/formatRequest.ts`):
   - Receives Anthropic-format requests at `/v1/messages`
   - Transforms to OpenAI chat completions format
   - Maps model names (e.g., `haiku` → `anthropic/claude-3.5-haiku`)
   - Validates and converts tool calls

2. **Response Pipeline** (`/formatResponse.ts` & `/streamResponse.ts`):
   - Converts OpenAI responses back to Anthropic format
   - Handles both streaming and non-streaming responses
   - Preserves tool call structures

### Key Implementation Details

- **No Dependencies**: Pure TypeScript implementation with no external npm packages
- **Edge Runtime**: Optimized for Cloudflare Workers, not Node.js
- **Environment Types**: Defined in `/env.ts` for type safety
- **Model Mapping**: Automatic conversion of Anthropic model names to OpenRouter equivalents
- **Tool Calls**: Full support for function/tool calling with proper validation

### Testing Approach

This project has no formal test suite. When making changes:
1. Use `npm run dev` to start local development server
2. Test with curl commands using Anthropic API format
3. Verify both streaming and non-streaming responses
4. Check tool call functionality if modifying that area

### Important Notes

- The worker name in `wrangler.toml` is `k-router` (for Kimi Router)
- Custom domain is configured as `kimi.koombea.io`
- API keys are passed through headers, never stored
- Supports any OpenAI-compatible endpoint via `OPENROUTER_BASE_URL`