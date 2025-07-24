import { faviconDataUrl } from './faviconServer';

export function generateIndexHtml(baseUrl: string): string {
    // Extraer el dominio limpio (sin https://)
    const cleanUrl = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kimi Router - Claude Code + OpenRouter Bridge</title>
    <link rel="shortcut icon" type="image/svg+xml" href="${faviconDataUrl}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --secondary: #8b5cf6;
            --success: #10b981;
            --dark: #1e293b;
            --light: #f8fafc;
            --gray: #64748b;
            --border: #e2e8f0;
            --code-bg: #0f172a;
            --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--dark);
            background: var(--light);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }

        /* Animated background */
        .bg-animation {
            position: fixed;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: -1;
            opacity: 0.03;
            background-image: 
                radial-gradient(at 47% 33%, hsl(162.00, 77%, 40%) 0, transparent 59%),
                radial-gradient(at 82% 65%, hsl(218.00, 39%, 11%) 0, transparent 55%);
        }

        /* Hero section */
        .hero {
            background: var(--gradient);
            color: white;
            padding: 100px 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 200%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
            0% { transform: translateX(0); }
            100% { transform: translateX(100%); }
        }

        .hero h1 {
            font-size: 4em;
            font-weight: 700;
            margin-bottom: 20px;
            letter-spacing: -2px;
            text-shadow: 0 4px 20px rgba(0,0,0,0.1);
            background: linear-gradient(to right, #fff, rgba(255,255,255,0.8));
            -webkit-background-clip: text;
            background-clip: text;
        }

        .hero p {
            font-size: 1.2em;
            opacity: 0.95;
            max-width: 700px;
            margin: 0 auto;
            font-weight: 300;
            line-height: 1.5;
        }

        .badges {
            margin-top: 40px;
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .badge {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(20px);
            padding: 10px 20px;
            border-radius: 100px;
            font-size: 0.9em;
            border: 1px solid rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }

        .badge:hover {
            background: rgba(255,255,255,0.25);
            transform: translateY(-2px);
        }

        /* Main container */
        .container {
            max-width: 1200px;
            margin: -60px auto 0;
            padding: 0 20px 40px;
            position: relative;
            z-index: 1;
        }

        /* Quick start card */
        .quick-start {
            background: white;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.08);
            padding: 60px;
            margin-bottom: 40px;
            border: 1px solid rgba(0,0,0,0.05);
        }

        .quick-start h2 {
            font-size: 2.5em;
            margin-bottom: 40px;
            color: var(--dark);
            display: flex;
            align-items: center;
            gap: 15px;
            font-weight: 700;
        }

        .quick-start h2::before {
            content: '🚀';
            font-size: 1em;
        }

        /* Steps */
        .steps {
            display: grid;
            gap: 35px;
        }

        .step {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 25px;
            align-items: start;
        }

        .step-number {
            width: 50px;
            height: 50px;
            background: var(--gradient);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.3em;
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.25);
        }

        .step-content h3 {
            font-size: 1.4em;
            margin-bottom: 12px;
            color: var(--dark);
            font-weight: 600;
        }

        .step-content p {
            color: var(--gray);
            margin-bottom: 20px;
            font-size: 1.05em;
        }

        /* Code blocks */
        .code-block {
            background: var(--code-bg);
            border-radius: 16px;
            position: relative;
            overflow: hidden;
            margin: 20px 0;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            border: 1px solid rgba(255,255,255,0.05);
        }

        .code-header {
            background: rgba(255,255,255,0.03);
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .code-dots {
            display: flex;
            gap: 8px;
        }

        .code-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
        }

        .code-dot:nth-child(1) { background: #ff5f57; }
        .code-dot:nth-child(2) { background: #ffbd2e; }
        .code-dot:nth-child(3) { background: #28ca42; }

        .code-block code {
            font-family: 'JetBrains Mono', 'Consolas', monospace;
            color: #e2e8f0;
            font-size: 0.95em;
            line-height: 1.8;
            display: block;
            padding: 25px;
            overflow-x: auto;
            background: var(--code-bg);
            white-space: pre;
        }

        .code-block code::-webkit-scrollbar {
            height: 8px;
        }

        .code-block code::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
        }

        .code-block code::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
        }

        .copy-button {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.15);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.85em;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .copy-button:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-1px);
        }

        .copy-button.copied {
            background: var(--success);
            border-color: var(--success);
        }

        .copy-button svg {
            width: 16px;
            height: 16px;
        }

        /* Feature cards */
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }

        .feature-card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.04);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid var(--border);
            position: relative;
            overflow: hidden;
        }

        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient);
            transform: scaleX(0);
            transition: transform 0.3s;
        }

        .feature-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        }

        .feature-card:hover::before {
            transform: scaleX(1);
        }

        .feature-card h3 {
            font-size: 1.5em;
            margin-bottom: 20px;
            color: var(--dark);
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
        }

        .feature-card p {
            color: var(--gray);
            line-height: 1.8;
            font-size: 1.05em;
            margin-bottom: 20px;
        }

        /* One-liner section */
        .one-liner {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
            border-radius: 24px;
            padding: 60px;
            margin: 40px 0;
            text-align: center;
            border: 1px solid rgba(99, 102, 241, 0.1);
        }

        .one-liner h2 {
            font-size: 2.5em;
            margin-bottom: 25px;
            color: var(--dark);
            font-weight: 700;
        }

        .one-liner p {
            color: var(--gray);
            margin-bottom: 30px;
            font-size: 1.1em;
        }

        /* Warning box */
        .warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #fbbf24;
            border-radius: 20px;
            padding: 30px;
            margin: 40px 0;
            color: #78350f;
            display: flex;
            gap: 20px;
            align-items: start;
            font-size: 1.05em;
            line-height: 1.7;
        }

        .warning::before {
            content: '⚠️';
            font-size: 1.8em;
            flex-shrink: 0;
        }

        /* Footer */
        .footer {
            background: var(--dark);
            color: white;
            padding: 60px 20px;
            text-align: center;
            margin-top: 100px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }

        .footer-links {
            display: flex;
            gap: 40px;
            justify-content: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .footer a {
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            transition: color 0.2s;
            font-size: 1.05em;
        }

        .footer a:hover {
            color: white;
        }

        .footer-copyright {
            opacity: 0.5;
            margin-top: 30px;
            font-size: 0.95em;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .hero {
                padding: 60px 20px;
            }

            .hero h1 {
                font-size: 2.8em;
            }
            
            .hero p {
                font-size: 1.2em;
            }

            .quick-start {
                padding: 40px 25px;
            }

            .quick-start h2 {
                font-size: 2em;
            }

            .step {
                grid-template-columns: 1fr;
                text-align: center;
            }

            .step-number {
                margin: 0 auto;
            }

            .feature-card {
                padding: 30px;
            }

            .one-liner {
                padding: 40px 25px;
            }

            .footer-links {
                flex-direction: column;
                gap: 20px;
            }

            .features {
                grid-template-columns: 1fr;
            }
        }

        /* Syntax highlighting */
        .keyword { color: #c792ea; font-weight: 500; }
        .string { color: #c3e88d; }
        .comment { color: #697098; font-style: italic; }
        .function { color: #82aaff; }
        .number { color: #f78c6c; }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .step {
            animation: fadeIn 0.6s ease-out forwards;
        }

        .step:nth-child(1) { animation-delay: 0.1s; }
        .step:nth-child(2) { animation-delay: 0.2s; }
        .step:nth-child(3) { animation-delay: 0.3s; }
        .step:nth-child(4) { animation-delay: 0.4s; }
    </style>
</head>
<body>
    <div class="bg-animation"></div>
    
    <div class="hero">
        <h1>Kimi Router</h1>
        <p>Bridge Claude Code with OpenRouter and any OpenAI-compatible API</p>
        <div class="badges">
            <div class="badge">⚡ Zero Configuration</div>
            <div class="badge">🔒 Secure & Private</div>
            <div class="badge">🌍 Self-Hosted</div>
            <div class="badge">🚀 Lightning Fast</div>
        </div>
    </div>
    
    <div class="container">
        <div class="one-liner">
            <h2>🎯 One-Line Installation</h2>
            <p>Get started instantly with our automated setup script:</p>
            <div class="code-block">
                <div class="code-header">
                    <div class="code-dots">
                        <div class="code-dot"></div>
                        <div class="code-dot"></div>
                        <div class="code-dot"></div>
                    </div>
                    <button class="copy-button" onclick="copyToClipboard(this)">
                        <svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg>
                        Copy
                    </button>
                </div>
                <code><span class="function">bash</span> <span class="string">-c</span> <span class="string">"$(</span><span class="function">curl</span> <span class="string">-fsSL ${baseUrl}/install.sh</span><span class="string">)"</span></code>
            </div>
            <p style="margin-top: 20px; font-size: 0.95em; opacity: 0.8;">This script will automatically install Claude Code, configure your environment, and set up the kimi command.</p>
        </div>

        <div class="quick-start">
            <h2>Manual Setup</h2>
            
            <div class="steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h3>Install Claude Code</h3>
                        <p>Get the official Claude CLI from Anthropic</p>
                        <div class="code-block">
                            <div class="code-header">
                                <div class="code-dots">
                                    <div class="code-dot"></div>
                                    <div class="code-dot"></div>
                                    <div class="code-dot"></div>
                                </div>
                                <button class="copy-button" onclick="copyToClipboard(this)">
                                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg>
                                    Copy
                                </button>
                            </div>
                            <code><span class="function">npm</span> <span class="keyword">install</span> <span class="string">-g</span> <span class="string">@anthropic-ai/claude-code</span></code>
                        </div>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h3>Get Your API Key</h3>
                        <p>Sign up at <a href="https://openrouter.ai/settings/keys" target="_blank" style="color: var(--primary); font-weight: 500;">OpenRouter.ai</a> to get your API key</p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h3>Configure Environment</h3>
                        <p>Option A: Simple Setup (~/.bashrc or ~/.zshrc) - <strong>Recommended</strong></p>
                        <div class="code-block">
                            <div class="code-header">
                                <div class="code-dots">
                                    <div class="code-dot"></div>
                                    <div class="code-dot"></div>
                                    <div class="code-dot"></div>
                                </div>
                                <button class="copy-button" onclick="copyToClipboard(this)">
                                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg>
                                    Copy
                                </button>
                            </div>
                            <code><span class="keyword">export</span> <span class="function">ANTHROPIC_BASE_URL</span>=<span class="string">"${baseUrl}"</span>
<span class="keyword">export</span> <span class="function">ANTHROPIC_API_KEY</span>=<span class="string">"your-openrouter-api-key"</span></code>
                        </div>
                        <p style="margin-top: 15px; font-size: 0.95em; color: var(--success); font-weight: 500;">✨ Automatic model selection: Kimi K2 for text, Claude 3.5 for images!</p>
                        
                        <p style="margin-top: 25px; margin-bottom: 15px;">Option B: Function with custom command (Recommended)</p>
                        <div class="code-block">
                            <div class="code-header">
                                <div class="code-dots">
                                    <div class="code-dot"></div>
                                    <div class="code-dot"></div>
                                    <div class="code-dot"></div>
                                </div>
                                <button class="copy-button" onclick="copyToClipboard(this)">
                                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg>
                                    Copy
                                </button>
                            </div>
                            <code><span class="function">kimi</span><span class="keyword">()</span> <span class="keyword">{</span>
  <span class="keyword">export</span> <span class="function">ANTHROPIC_BASE_URL</span>=<span class="string">${baseUrl}</span>
  <span class="keyword">export</span> <span class="function">ANTHROPIC_API_KEY</span>=<span class="string">sk-or-v1-your-key-here</span>
  <span class="function">claude</span> <span class="string">"$@"</span>
<span class="keyword">}</span></code>
                        </div>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h3>Start Using Claude Code</h3>
                        <p>Option A: Use claude directly (if you chose Option A above)</p>
                        <div class="code-block">
                            <div class="code-header">
                                <div class="code-dots">
                                    <div class="code-dot"></div>
                                    <div class="code-dot"></div>
                                    <div class="code-dot"></div>
                                </div>
                                <button class="copy-button" onclick="copyToClipboard(this)">
                                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg>
                                    Copy
                                </button>
                            </div>
                            <code><span class="function">claude</span></code>
                        </div>
                        
                        <p style="margin-top: 25px; margin-bottom: 15px;">Option B: Use kimi command (if you chose Option B above)</p>
                        <div class="code-block">
                            <div class="code-header">
                                <div class="code-dots">
                                    <div class="code-dot"></div>
                                    <div class="code-dot"></div>
                                    <div class="code-dot"></div>
                                </div>
                                <button class="copy-button" onclick="copyToClipboard(this)">
                                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg>
                                    Copy
                                </button>
                            </div>
                            <code><span class="function">kimi</span></code>
                        </div>
                    </div>
                </div>
            </div>
        </div>


        <div class="features">
            <div class="feature-card">
                <h3>🧠 Smart Vision Detection</h3>
                <p>Automatically switches to Claude 3.5 Sonnet when you add images. Keep using your preferred model for text!</p>
                <div class="code-block">
                    <div class="code-header">
                        <div class="code-dots">
                            <div class="code-dot"></div>
                            <div class="code-dot"></div>
                            <div class="code-dot"></div>
                        </div>
                        <button class="copy-button" onclick="copyToClipboard(this)">
                            <svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg>
                            Copy
                        </button>
                    </div>
                    <code><span class="comment"># Automatic behavior:</span>
<span class="comment"># Text only → Uses your configured model</span>
<span class="comment"># Images detected → anthropic/claude-3.5-sonnet</span>

<span class="comment"># Optional: Use a different vision model</span>
<span class="keyword">export</span> <span class="function">ANTHROPIC_VISION_MODEL</span>=<span class="string">"openai/gpt-4-vision-preview"</span></code>
                </div>
            </div>

            <div class="feature-card">
                <h3>🔧 Multiple Configurations</h3>
                <p>Switch between different API providers and models using shell aliases. Perfect for testing and development.</p>
                <div class="code-block">
                    <div class="code-header">
                        <div class="code-dots">
                            <div class="code-dot"></div>
                            <div class="code-dot"></div>
                            <div class="code-dot"></div>
                        </div>
                        <button class="copy-button" onclick="copyToClipboard(this)">
                            <svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg>
                            Copy
                        </button>
                    </div>
                    <code><span class="keyword">alias</span> <span class="function">c1</span>=<span class="string">'ANTHROPIC_MODEL="moonshotai/kimi-k2" claude'</span>
<span class="keyword">alias</span> <span class="function">c2</span>=<span class="string">'ANTHROPIC_MODEL="google/gemini-2.5-flash-lite" claude'</span></code>
                </div>
            </div>

            <div class="feature-card">
                <h3>🚀 API Endpoints</h3>
                <p>Full compatibility with Anthropic's Messages API. Stream responses, tool calls, and all features work seamlessly.</p>
                <div class="code-block">
                    <div class="code-header">
                        <div class="code-dots">
                            <div class="code-dot"></div>
                            <div class="code-dot"></div>
                            <div class="code-dot"></div>
                        </div>
                        <button class="copy-button" onclick="copyToClipboard(this)">
                            <svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg>
                            Copy
                        </button>
                    </div>
                    <code><span class="comment"># Send requests to:</span>
<span class="keyword">POST</span> <span class="string">${baseUrl}/v1/messages</span></code>
                </div>
            </div>
        </div>

        <div class="warning">
            <strong>Legal Notice:</strong> This is an independent, unofficial tool. Users are responsible for compliance with all relevant terms of service and applicable laws. Use at your own risk.
        </div>
    </div>
    
    <div class="footer">
        <div class="footer-links">
            <a href="/terms">Terms of Service</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="https://github.com/ab2webco/kimi-router" target="_blank">GitHub Repository</a>
            <a href="https://openrouter.ai" target="_blank">OpenRouter</a>
        </div>
        <p class="footer-copyright">© 2025 Kimi Router. Not affiliated with Anthropic or OpenRouter.</p>
    </div>
    
    <script>
        // Copy functionality will extract text dynamically from code blocks
        
        function copyToClipboard(button, fallbackText) {
            // Get the text to copy - either from the fallback parameter or from the associated code block
            let textToCopy;
            
            if (fallbackText) {
                textToCopy = fallbackText;
            } else {
                // Get the code block and extract text
                const codeBlock = button.closest('.code-block');
                const codeElement = codeBlock ? codeBlock.querySelector('code') : null;
                if (codeElement) {
                    textToCopy = codeElement.textContent || codeElement.innerText;
                } else {
                    console.error('Could not find text to copy');
                    return;
                }
            }
            
            // Clean the text - remove extra whitespace and normalize line breaks
            const cleanText = textToCopy
                .replace(/\\\\n/g, '\\n')  // Convert double escaped newlines to single escaped
                .replace(/\\\\'/g, "'")    // Convert escaped quotes
                .replace(/\\\\"/g, '"')    // Convert escaped double quotes
                .trim();
            
            // Visual feedback
            const originalHtml = button.innerHTML;
            const checkIcon = '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
            
            // Fallback function for older browsers
            function fallbackCopyTextToClipboard(text) {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return successful;
                } catch (err) {
                    document.body.removeChild(textArea);
                    return false;
                }
            }
            
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(cleanText).then(() => {
                    button.innerHTML = checkIcon + ' Copied!';
                    button.classList.add('copied');
                    
                    setTimeout(() => {
                        button.innerHTML = originalHtml;
                        button.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Clipboard API failed:', err);
                    // Fallback to execCommand
                    const success = fallbackCopyTextToClipboard(cleanText);
                    if (success) {
                        button.innerHTML = checkIcon + ' Copied!';
                        button.classList.add('copied');
                    } else {
                        button.innerHTML = '❌ Failed';
                    }
                    
                    setTimeout(() => {
                        button.innerHTML = originalHtml;
                        button.classList.remove('copied');
                    }, 2000);
                });
            } else {
                // Use fallback method
                const success = fallbackCopyTextToClipboard(cleanText);
                if (success) {
                    button.innerHTML = checkIcon + ' Copied!';
                    button.classList.add('copied');
                } else {
                    button.innerHTML = '❌ Failed';
                }
                
                setTimeout(() => {
                    button.innerHTML = originalHtml;
                    button.classList.remove('copied');
                }, 2000);
            }
        }
    </script>
</body>
</html>`;
}
