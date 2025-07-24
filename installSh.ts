export function generateInstallSh(baseUrl: string): string {
    return `#!/bin/bash

set -e

install_nodejs() {
    local platform=$(uname -s)
    
    case "$platform" in
        Linux|Darwin)
            echo "🚀 Installing Node.js on Unix/Linux/macOS..."
            
            echo "📥 Downloading and installing nvm..."
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
            
            echo "🔄 Loading nvm environment..."
            \\. "$HOME/.nvm/nvm.sh"
            
            echo "📦 Downloading and installing Node.js v22..."
            nvm install 22
            
            echo -n "✅ Node.js installation completed! Version: "
            node -v # Should print "v22.17.0".
            echo -n "✅ Current nvm version: "
            nvm current # Should print "v22.17.0".
            echo -n "✅ npm version: "
            npm -v # Should print "10.9.2".
            ;;
        *)
            echo "Unsupported platform: $platform"
            exit 1
            ;;
    esac
}

# Check if Node.js is already installed and version is >= 18
if command -v node >/dev/null 2>&1; then
    current_version=$(node -v | sed 's/v//')
    major_version=$(echo $current_version | cut -d. -f1)
    
    if [ "$major_version" -ge 18 ]; then
        echo "Node.js is already installed: v$current_version"
    else
        echo "Node.js v$current_version is installed but version < 18. Upgrading..."
        install_nodejs
    fi
else
    echo "Node.js not found. Installing..."
    install_nodejs
fi

# Check if Claude Code is already installed
if command -v claude >/dev/null 2>&1; then
    echo "Claude Code is already installed: $(claude --version)"
else
    echo "Claude Code not found. Installing..."
    npm install -g @anthropic-ai/claude-code
fi

# Configure Claude Code to skip onboarding
echo "Configuring Claude Code to skip onboarding..."
node --eval '
    const homeDir = os.homedir(); 
    const filePath = path.join(homeDir, ".claude.json");
    if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        fs.writeFileSync(filePath,JSON.stringify({ ...content, hasCompletedOnboarding: true }, 2), "utf-8");
    } else {
        fs.writeFileSync(filePath,JSON.stringify({ hasCompletedOnboarding: true }), "utf-8");
    }'

# Provider selection
echo "🔧 Please select your AI provider:"
echo "1) OpenRouter (default)"
echo "2) Moonshot"
echo ""
read -p "Enter your choice [1]: " provider_choice
provider_choice=\${provider_choice:-1}
echo ""

case "$provider_choice" in
    1)
        provider="openrouter"
        default_base_url="${baseUrl}"
        api_key_url="https://openrouter.ai/settings/keys"
        default_model_main="moonshot/kimi-k2"
        default_model_vision="anthropic/claude-3.5-sonnet"
        default_model_small="google/gemini-2.0-flash-exp"
        ;;
    2)
        provider="moonshot"
        echo "🔧 Please select your Moonshot endpoint:"
        echo "1) Global (api.moonshot.ai)"
        echo "2) China (api.moonshot.cn)"
        echo ""
        read -p "Enter your choice [1]: " moonshot_endpoint_choice
        moonshot_endpoint_choice=\${moonshot_endpoint_choice:-1}
        
        case "$moonshot_endpoint_choice" in
            1)
                default_base_url="https://api.moonshot.ai/anthropic/"
                api_key_url="https://platform.moonshot.ai/console/api-keys"
                pricing_url="https://platform.moonshot.ai/docs/pricing/limits"
                ;;
            2)
                default_base_url="https://api.moonshot.cn/anthropic/"
                api_key_url="https://platform.moonshot.cn/console/api-keys"
                pricing_url="https://platform.moonshot.cn/docs/pricing/limits"
                ;;
            *)
                echo "⚠️  Invalid choice. Using Global (.ai) endpoint as default."
                default_base_url="https://api.moonshot.ai/anthropic/"
                api_key_url="https://platform.moonshot.ai/console/api-keys"
                pricing_url="https://platform.moonshot.ai/docs/pricing/limits"
                ;;
        esac
        
        echo ""
        echo "⚠️  Important: Moonshot requires account credit before use"
        echo "   You must add funds to your account first, otherwise you'll get rate limit errors"
        echo "   Pricing info: $pricing_url"
        echo ""
        
        default_model_main="kimi-k2-0711-preview"
        default_model_vision="moonshot-v1-32k"
        default_model_small="moonshot-v1-8k"
        ;;
    *)
        echo "⚠️  Invalid choice. Please run the script again and select 1 or 2."
        exit 1
        ;;
esac

# Prompt for configuration with defaults
echo "⚙️  Configure your $provider settings (press Enter to use defaults):"
echo ""

read -p "Base URL [$default_base_url]: " base_url
echo ""
base_url=\${base_url:-$default_base_url}

echo "🔑 Please enter your $provider API key:"
echo "   You can get your API key from: $api_key_url"
echo "   Note: The input is hidden for security. Please paste your API key directly."
echo ""
read -s api_key
echo "✅ API key received (\${#api_key} characters)"
echo ""

if [ -z "$api_key" ]; then
    echo "⚠️  API key cannot be empty. Please run the script again."
    exit 1
fi

read -p "Main model (text) [$default_model_main]: " model_main
model_main=\${model_main:-$default_model_main}

read -p "Vision model (images) [$default_model_vision]: " model_vision
model_vision=\${model_vision:-$default_model_vision}

read -p "Small/fast model [$default_model_small]: " model_small
model_small=\${model_small:-$default_model_small}

# Detect current shell and determine rc file
current_shell=$(basename "$SHELL")
case "$current_shell" in
    bash)
        rc_file="$HOME/.bashrc"
        ;;
    zsh)
        rc_file="$HOME/.zshrc"
        ;;
    fish)
        rc_file="$HOME/.config/fish/config.fish"
        ;;
    *)
        rc_file="$HOME/.profile"
        ;;
esac

# Add environment variables to rc file
echo ""
echo "📝 Configuring environment variables in $rc_file..."

# Create backup if file exists
if [ -f "$rc_file" ]; then
    cp "$rc_file" "\${rc_file}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Remove existing Claude Code environment variables and kimi function
if [ -f "$rc_file" ]; then
    # Use a temporary file to store content without Claude Code variables or kimi function
    grep -v "^# Claude Code environment variables\\|^# Kimi Router function\\|^export ANTHROPIC_BASE_URL\\|^export ANTHROPIC_API_KEY\\|^export ANTHROPIC_MODEL\\|^export ANTHROPIC_VISION_MODEL\\|^export ANTHROPIC_SMALL_FAST_MODEL\\|^kimi() {\\|^  export ANTHROPIC_\\|^  claude\\|^}$" "$rc_file" > "\${rc_file}.tmp" || true
    mv "\${rc_file}.tmp" "$rc_file"
fi

# Ask user for configuration preference
echo ""
echo "🔧 How would you like to configure Claude Code?"
echo "1) Global environment variables (use 'claude' command)"
echo "2) kimi() function (use 'kimi' command - recommended)"
echo ""
read -p "Enter your choice [2]: " config_choice
config_choice=\${config_choice:-2}
echo ""

case "$config_choice" in
    1)
        # Add environment variables
        echo "" >> "$rc_file"
        echo "# Claude Code environment variables for $provider" >> "$rc_file"
        echo "export ANTHROPIC_BASE_URL=$base_url" >> "$rc_file"
        echo "export ANTHROPIC_API_KEY=$api_key" >> "$rc_file"
        echo "export ANTHROPIC_MODEL=$model_main" >> "$rc_file"
        echo "export ANTHROPIC_VISION_MODEL=$model_vision" >> "$rc_file"
        echo "export ANTHROPIC_SMALL_FAST_MODEL=$model_small" >> "$rc_file"
        echo "✅ Environment variables configured in $rc_file"
        
        command_to_use="claude"
        ;;
    2)
        # Add kimi function
        echo "" >> "$rc_file"
        echo "# Kimi Router function for $provider" >> "$rc_file"
        echo "kimi() {" >> "$rc_file"
        echo "  export ANTHROPIC_BASE_URL=$base_url" >> "$rc_file"
        echo "  export ANTHROPIC_API_KEY=$api_key" >> "$rc_file"
        echo "  export ANTHROPIC_MODEL=$model_main" >> "$rc_file"
        echo "  export ANTHROPIC_VISION_MODEL=$model_vision" >> "$rc_file"
        echo "  export ANTHROPIC_SMALL_FAST_MODEL=$model_small" >> "$rc_file"
        echo "  claude \\"\\$@\\"" >> "$rc_file"
        echo "}" >> "$rc_file"
        echo "✅ kimi() function configured in $rc_file"
        
        command_to_use="kimi"
        ;;
    *)
        echo "⚠️  Invalid choice. Using kimi() function as default."
        # Add kimi function (default)
        echo "" >> "$rc_file"
        echo "# Kimi Router function for $provider" >> "$rc_file"
        echo "kimi() {" >> "$rc_file"
        echo "  export ANTHROPIC_BASE_URL=$base_url" >> "$rc_file"
        echo "  export ANTHROPIC_API_KEY=$api_key" >> "$rc_file"
        echo "  export ANTHROPIC_MODEL=$model_main" >> "$rc_file"
        echo "  export ANTHROPIC_VISION_MODEL=$model_vision" >> "$rc_file"
        echo "  export ANTHROPIC_SMALL_FAST_MODEL=$model_small" >> "$rc_file"
        echo "  claude \\"\\$@\\"" >> "$rc_file"
        echo "}" >> "$rc_file"
        echo "✅ kimi() function configured in $rc_file"
        
        command_to_use="kimi"
        ;;
esac

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "🔄 Please restart your terminal or run:"
echo "   source $rc_file"
echo ""
echo "🚀 Then you can start using Claude Code with:"
echo "   $command_to_use"
echo ""
if [ "$config_choice" = "2" ]; then
    echo "💡 Benefits of the kimi() function:"
    echo "   - Shorter command name"
    echo "   - No global environment pollution"
    echo "   - Easy to manage multiple configurations"
    echo ""
fi
echo "💡 Advanced: To set up multiple configurations, you can create additional functions:"
echo "   kimi-openrouter() { export ANTHROPIC_BASE_URL=...; claude \\"\\$@\\"; }"
echo "   kimi-moonshot() { export ANTHROPIC_BASE_URL=...; claude \\"\\$@\\"; }"
`;
}