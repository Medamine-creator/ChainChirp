# Quick Start

Get ChainChirp CLI running in 30 seconds and start monitoring Bitcoin data.

## Installation

Choose your preferred package manager:

### Bun (Fastest)
```bash
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp
bun install && bun run build && bun link
```

### npm
```bash
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp
npm install && npm run build && npm link
```

### Yarn
```bash
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp
yarn install && yarn build && yarn link
```

### pnpm
```bash
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp
pnpm install && pnpm build && pnpm link --global
```

### Homebrew (Coming Soon)
```bash
# Coming in v2.1
brew install chainchirp
```

## First Run

Test your installation:

```bash
chainchirp --version
```

Get current Bitcoin price:

```bash
chainchirp price
```

**Expected output:**
```
 Bitcoin Price
  $107,263.50

  æ Updated: Dec 16 at 14:23
  æ Latency: 127ms
  æ Provider: CoinGecko
```

## Essential Commands

Start with these core commands:

```bash
# Current price with details
chainchirp price --detailed

# Real-time monitoring
chainchirp price --watch

# Fee estimates
chainchirp fees

# Network hashrate
chainchirp hashrate

# All-time highs/lows
chainchirp hl
```

## Quick Examples

### JSON Output (for scripts)
```bash
chainchirp price --json
```

### Different Currency
```bash
chainchirp price --currency eur
```

### Price Chart
```bash
chainchirp sparkline --timeframe 7d --width 60
```

### Watch Mode
```bash
chainchirp price --watch --interval 5
```

## Need Help?

- `chainchirp --help` - Full command list
- `chainchirp <command> --help` - Command-specific help
- **[Complete Documentation](./index.md)** - All features and options
- **[Examples](./examples.md)** - Real-world usage scenarios

---

*Ready to explore? Try `chainchirp spark --watch` for live price charts!*