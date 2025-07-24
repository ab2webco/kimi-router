# 🚀 Kimi Router

<div align="center">

**Bridge Claude Code with OpenRouter and any OpenAI-compatible API**

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

## ✨ What is Kimi Router?

Kimi Router is a high-performance Node.js/Docker application that acts as a translation layer between Anthropic's Claude API format and OpenAI-compatible APIs. It enables you to use **Claude Code** (Anthropic's official CLI) with **OpenRouter** and other OpenAI-compatible providers, accessing 100+ AI models through a unified interface.

### 🎯 Key Features

- **🚀 Zero Configuration** - Works out of the box with minimal setup
- **⚡ Lightning Fast** - Built with performance in mind
- **🔒 Secure & Private** - Self-hosted, your data stays with you
- **🌍 Universal Compatibility** - Works with any OpenAI-compatible API
- **🤖 100+ Models** - Access Claude, GPT-4, Gemini, and more through OpenRouter
- **📦 Docker Ready** - Easy deployment with Docker and Docker Compose
- **🎨 Beautiful Interface** - Clean, modern web interface with syntax highlighting

## 🚀 Quick Start

### Option 1: One-Line Installation (Recommended)

```bash
bash -c "$(curl -fsSL https://kimi-router.your-domain.com/install.sh)"
```

### Option 2: Manual Setup

#### 1. Install Claude Code
```bash
npm install -g @anthropic-ai/claude-code
```

#### 2. Get OpenRouter API Key
Sign up at [openrouter.ai](https://openrouter.ai) to get your API key.

#### 3. Configure Environment

**Option A: Simple Setup (Recommended)**

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export ANTHROPIC_BASE_URL="https://kimi.koombea.io"
export ANTHROPIC_API_KEY="your-openrouter-api-key"
```

**Option B: Custom Function with Alias**

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
kimi() {
  export ANTHROPIC_BASE_URL=https://kimi.koombea.io
  export ANTHROPIC_API_KEY=sk-or-v1-your-key-here
  claude "$@"
}
```

#### 4. Start Using

**With Option A:**
```bash
claude
```

**With Option B:**
```bash
kimi
```

## 🐳 Docker Deployment

### Quick Deploy with Docker

```bash
# Clone the repository
git clone https://github.com/ab2webco/kimi-router.git
cd kimi-router

# Build and run
docker build -t kimi-router .
docker run -p 3000:3000 kimi-router
```

### Docker Compose

```yaml
version: '3.8'

services:
  kimi-router:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
      - BASE_URL=https://your-domain.com
    restart: unless-stopped
```

## ☁️ Deploy to Coolify

1. **Connect Repository**: Add `https://github.com/ab2webco/kimi-router.git` to Coolify
2. **Configure Build**: Use the provided Dockerfile
3. **Set Environment Variables**:
   ```
   PORT=3000
   BASE_URL=https://your-domain.com
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   ```
4. **Deploy**: Coolify will handle the rest!

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- TypeScript
- Docker (optional)

### Local Development

```bash
# Clone and install
git clone https://github.com/ab2webco/kimi-router.git
cd kimi-router
npm install

# Start development server
npm run start-ts
# or
npx ts-node server.ts

# Build for production
npm run build-node
npm start
```

### Project Structure

```
kimi-router/
├── server.ts              # Express.js server
├── index.ts               # Cloudflare Worker (legacy)
├── generateIndexHtml.ts    # Dynamic homepage generator
├── formatRequest.ts       # Anthropic → OpenAI format conversion
├── formatResponse.ts      # OpenAI → Anthropic format conversion
├── streamResponse.ts      # Streaming response handler
├── termsHtml.ts          # Terms of service page
├── privacyHtml.ts        # Privacy policy page
├── installSh.ts          # Installation script
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
└── package.json          # Dependencies and scripts
```

## 🤖 Smart Model Configuration

### 🧠 Automatic Vision Model Selection

Kimi Router automatically handles images:

- **Text conversations** → Uses your configured model (e.g., `moonshotai/kimi-k2`)
- **Images detected** → Auto-switches to `anthropic/claude-3.5-sonnet` 
- **No configuration needed** → Just add images and it works!

### Default Models

Kimi Router comes pre-configured with optimized model defaults:

- **Primary Model**: `moonshotai/kimi-k2` - Excellent for complex reasoning at low cost
- **Vision Model**: `anthropic/claude-3.5-sonnet` - Automatically used when images are detected
- **Fast Model**: `google/gemini-2.5-flash-lite` - Quick responses

### Custom Vision Model (Optional)

```bash
# Only if you want to override the default vision model
export ANTHROPIC_VISION_MODEL="openai/gpt-4-vision-preview"  # Custom vision model

# Or use with the kimi function
kimi() {
  export ANTHROPIC_BASE_URL=https://your-domain.com
  export ANTHROPIC_API_KEY=your-key
  export ANTHROPIC_MODEL="gpt-4-turbo"
  export ANTHROPIC_SMALL_FAST_MODEL="gpt-3.5-turbo"
  claude "$@"
}
```

### Multiple Configurations

Create aliases for different setups:

```bash
# Different providers and models
alias kimi-moonshot='ANTHROPIC_MODEL="moonshotai/kimi-k2" kimi'
alias kimi-claude='ANTHROPIC_MODEL="anthropic/claude-3.5-sonnet" kimi'
alias kimi-gpt='ANTHROPIC_MODEL="openai/gpt-4-turbo" kimi'
```

## 🔧 API Reference

### Endpoints

- `GET /` - Homepage with setup instructions
- `GET /terms` - Terms of service
- `GET /privacy` - Privacy policy  
- `GET /install.sh` - Installation script
- `POST /v1/messages` - Main API endpoint (Anthropic Messages API compatible)

### Request Format

Kimi Router accepts standard Anthropic Messages API requests:

```bash
curl -X POST https://your-domain.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-openrouter-key" \
  -d '{
    "model": "moonshotai/kimi-k2",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 1000,
    "stream": false
  }'
```

## 🌟 Advanced Features

### Streaming Support
Full support for streaming responses with proper event formatting.

### Tool Calling
Complete compatibility with Anthropic's tool calling features.

### Error Handling
Comprehensive error handling with detailed logging and debugging.

### Performance Monitoring
Built-in health checks and performance monitoring.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test` (when available)
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Legal Notice

**Important**: Kimi Router is an independent, unofficial tool and is not affiliated with, endorsed by, or supported by Anthropic PBC, OpenAI, or OpenRouter.

- **Third-party Tool**: Use at your own risk and discretion
- **Terms Compliance**: Users are responsible for compliance with all relevant terms of service
- **API Keys**: Users must provide their own valid API keys
- **No Warranty**: This software is provided "as is" without warranties

## 🙏 Acknowledgments

Special thanks to the projects that inspired Kimi Router:
- [claude-code-router](https://github.com/musistudio/claude-code-router)
- [claude-code-proxy](https://github.com/kiyo-e/claude-code-proxy)

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/ab2webco/kimi-router/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/ab2webco/kimi-router/discussions)
- 📚 **Documentation**: [Wiki](https://github.com/ab2webco/kimi-router/wiki)

---

<div align="center">

**Made with ❤️ by the AB2Web Team**

[🌟 Star this repo](https://github.com/ab2webco/kimi-router) • [🍴 Fork it](https://github.com/ab2webco/kimi-router/fork) • [📚 Documentation](https://github.com/ab2webco/kimi-router/wiki)

</div>