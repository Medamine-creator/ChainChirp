# Installation Guide

**Multiple ways to install ChainChirp CLI for every environment.**

## Requirements

- **Node.js** 18+ (LTS recommended)
- **npm**, **yarn**, **pnpm**, or **bun**

## Package Managers

### npm (Recommended)

```bash
# Install globally
npm install -g chainchirp

# Verify installation
chainchirp --version
```

### yarn

```bash
# Install globally
yarn global add chainchirp

# Verify installation
chainchirp --version
```

### pnpm

```bash
# Install globally
pnpm add -g chainchirp

# Verify installation
chainchirp --version
```

### bun

```bash
# Install globally
bun add -g chainchirp

# Verify installation
chainchirp --version
```

## Alternative Installation Methods

### Direct Binary Download

Download pre-built binaries for your platform:

**macOS (Intel)**
```bash
curl -L https://github.com/user/chainchirp/releases/latest/download/chainchirp-macos-x64 -o chainchirp
chmod +x chainchirp
sudo mv chainchirp /usr/local/bin/
```

**macOS (Apple Silicon)**
```bash
curl -L https://github.com/user/chainchirp/releases/latest/download/chainchirp-macos-arm64 -o chainchirp
chmod +x chainchirp
sudo mv chainchirp /usr/local/bin/
```

**Linux**
```bash
curl -L https://github.com/user/chainchirp/releases/latest/download/chainchirp-linux-x64 -o chainchirp
chmod +x chainchirp
sudo mv chainchirp /usr/local/bin/
```

**Windows**
```powershell
# Download from GitHub releases
# https://github.com/user/chainchirp/releases/latest/download/chainchirp-win.exe
```

### From Source

```bash
# Clone repository
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp

# Install dependencies
bun install

# Build project
bun run build

# Link globally
bun link
```

## Docker

```bash
# Run directly
docker run -it chainchirp/cli price

# Create alias
echo 'alias chainchirp="docker run -it --rm chainchirp/cli"' >> ~/.bashrc
source ~/.bashrc
```

## Platform-Specific Instructions

### macOS

**Homebrew** (Coming Soon)
```bash
brew install chainchirp
```

**MacPorts** (Coming Soon)
```bash
sudo port install chainchirp
```

### Linux

**Ubuntu/Debian**
```bash
# Add repository
curl -fsSL https://apt.chainchirp.com/gpg | sudo apt-key add -
echo "deb https://apt.chainchirp.com stable main" | sudo tee /etc/apt/sources.list.d/chainchirp.list

# Install
sudo apt update
sudo apt install chainchirp
```

**CentOS/RedHat/Fedora**
```bash
# Add repository
sudo yum-config-manager --add-repo https://yum.chainchirp.com/chainchirp.repo

# Install
sudo yum install chainchirp
```

**Arch Linux**
```bash
# AUR package
yay -S chainchirp
```

### Windows

**Chocolatey** (Coming Soon)
```powershell
choco install chainchirp
```

**Scoop** (Coming Soon)
```powershell
scoop install chainchirp
```

**Winget** (Coming Soon)
```powershell
winget install chainchirp
```

## Verification

After installation, verify ChainChirp is working correctly:

```bash
# Check version
chainchirp --version

# Test basic functionality
chainchirp price

# Verify JSON output
chainchirp price --json
```

**Expected Output:**
```json
{
  "symbol": "BTC",
  "name": "Bitcoin",
  "price": 43250.00,
  "currency": "usd",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Troubleshooting

### Permission Errors

**macOS/Linux:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
npm install -g chainchirp
```

**Windows:**
Run Command Prompt or PowerShell as Administrator.

### Command Not Found

```bash
# Check if globally installed packages are in PATH
npm config get prefix

# Add to PATH (bash/zsh)
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.bashrc
source ~/.bashrc

# Add to PATH (fish)
set -gx PATH $PATH (npm config get prefix)/bin
```

### Node.js Version Issues

```bash
# Check Node.js version
node --version

# Update Node.js (using nvm)
nvm install --lts
nvm use --lts
```

### Network/Proxy Issues

```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or bypass proxy for installation
npm install -g chainchirp --registry https://registry.npmjs.org
```

## Updating

### Package Managers
```bash
# npm
npm update -g chainchirp

# yarn
yarn global upgrade chainchirp

# pnpm
pnpm update -g chainchirp

# bun
bun update -g chainchirp
```

### Binary Installations
Re-download and replace the binary following the same installation steps.

## Uninstallation

```bash
# Package managers
npm uninstall -g chainchirp
yarn global remove chainchirp
pnpm remove -g chainchirp
bun remove -g chainchirp

# Binary installation
sudo rm /usr/local/bin/chainchirp

# From source
bun unlink chainchirp
```

## Development Setup

For contributors and developers:

```bash
# Clone and setup
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp
bun install

# Development with hot reload
bun run dev

# Run tests
bun test

# Lint code
bun run lint

# Build for production
bun run build
```

## System Integration

### Shell Aliases

Add to your `.bashrc`, `.zshrc`, or `.profile`:

```bash
# Short aliases
alias btc='chainchirp price'
alias btcv='chainchirp volume'
alias btch='chainchirp hl'
alias btcc='chainchirp spark'

# Watch aliases
alias btcw='chainchirp price --watch'
alias btcvw='chainchirp volume --watch'
```

### Script Integration

```bash
#!/bin/bash
# Save as bitcoin-alert.sh

price=$(chainchirp price --json | jq -r '.price')
if (( $(echo "$price > 110000" | bc -l) )); then
    echo "🚨 Bitcoin price alert: $price"
    # Send notification, email, etc.
fi
```

### Cron Jobs

```bash
# Add to crontab for periodic logging
# crontab -e

# Log price every hour
0 * * * * /usr/local/bin/chainchirp price --json >> /var/log/bitcoin-price.log

# Daily market summary
0 9 * * * /usr/local/bin/chainchirp price --detailed --json > /tmp/daily-btc.json
```

## Next Steps

- **[Quick Start](./quickstart.md)** - Get started in 30 seconds
- **[Configuration](./config.md)** - Set up API keys and preferences
- **[Command Reference](./commands.md)** - Explore all available commands

---

*Having installation issues? Check the [FAQ](./faq.md) or [open an issue](https://github.com/TristanBietsch/chainchirp/issues).*