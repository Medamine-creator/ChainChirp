# Installation Guide

This guide will help you install and set up ChainChirp CLI on your system.

## Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **Terminal/Command Line** access
- **Internet connection** for API data

## Installation Methods

### Option 1: Using Bun (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-repo/chainchirp-cli.git
cd chainchirp-cli

# Install dependencies
bun install

# Build the project
bun run build

# Link globally (optional)
bun link
```

### Option 2: Using Node.js/npm

```bash
# Clone the repository
git clone https://github.com/your-repo/chainchirp-cli.git
cd chainchirp-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## Running ChainChirp

### Local Development

```bash
# Run directly with Bun
bunx chainchirp price

# Run directly with Node.js
node dist/index.js price
```

### Global Installation

After running `bun link` or `npm link`:

```bash
# Use anywhere in your system
chainchirp price
chainchirp volume --watch
chainchirp hl --json
```

## Verification

Test your installation:

```bash
# Check version
chainchirp --version

# Test basic functionality
chainchirp price

# Test help system
chainchirp --help
```

**Expected output:**
```
✓ Bitcoin Price
  $107,263.50

  ◦ Updated: Dec 16 at 14:23
  ◦ Latency: 127ms
  ◦ Provider: CoinGecko
```

## Configuration

### Default Settings

ChainChirp works out of the box with these defaults:

- **Currency**: USD
- **Watch Interval**: 30 seconds
- **Chart Width**: 40 characters
- **Chart Height**: 8 characters
- **Timeframe**: 24 hours

### Customization

Override defaults with command options:

```bash
# Different currency
chainchirp price --currency eur

# Custom watch interval
chainchirp volume --watch --interval 10

# Custom chart dimensions
chainchirp spark --width 60 --height 12

# Different timeframe
chainchirp spark --timeframe 7d
```

## Troubleshooting

### Common Issues

#### Command Not Found
```bash
# Error: chainchirp: command not found
# Solution: Use full path or bunx
bunx chainchirp price
# or
./dist/index.js price
```

#### Permission Errors
```bash
# On macOS/Linux, you might need permissions
chmod +x dist/index.js
```

#### API Errors
```bash
# If you see API errors, the multi-API system will automatically
# fail over to backup providers. This is normal and transparent.
```

### Performance Optimization

#### Faster Startup
```bash
# Pre-build for faster execution
bun run build

# Use Bun runtime for better performance
bunx chainchirp price
```

#### Reduce Latency
```bash
# Use shorter intervals for real-time monitoring
chainchirp price --watch --interval 5

# Use JSON output for automation (faster parsing)
chainchirp price --json
```

## Development Setup

For contributors and developers:

```bash
# Clone and setup
git clone https://github.com/your-repo/chainchirp-cli.git
cd chainchirp-cli
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

## Updates

### Updating ChainChirp

```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies
bun install

# Rebuild
bun run build
```

### Version Information

```bash
# Check current version
chainchirp --version

# View changelog
git log --oneline
```

## Uninstallation

```bash
# Remove global link
bun unlink chainchirp
# or
npm unlink chainchirp

# Remove project directory
rm -rf chainchirp-cli
```

## Support

If you encounter issues:

1. **Check the [FAQ](faq.md)** for common solutions
2. **View [command documentation](commands.md)** for usage help
3. **Open an issue** on GitHub with error details
4. **Verify your Node.js/Bun version** meets requirements

---

*Installation complete! Start exploring Bitcoin data with `chainchirp --help`*
