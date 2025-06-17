# ChainChirp CLI 🐦⚡

![CI](https://github.com/TristanBietsch/chainchirp/actions/workflows/ci.yml/badge.svg)
[![npm version](https://badge.fury.io/js/chainchirp.svg)](https://badge.fury.io/js/chainchirp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A professional Bitcoin ecosystem CLI tool providing real-time market data, network monitoring, and blockchain analytics with an elegant terminal interface.

## ✨ Features

- **Real-time Market Data**: Live Bitcoin prices, volume, and market analytics
- **Network Monitoring**: Block data, mempool status, hashrate, and fee recommendations  
- **Beautiful Terminal UI**: Styled output with colors, gradients, and ASCII charts
- **Multiple Currencies**: Support for USD, EUR, GBP, JPY, BTC, ETH, and sats
- **Watch Mode**: Real-time updates with customizable intervals
- **JSON Output**: Perfect for automation and integration with other tools
- **Lightning Network**: Channel data, liquidity analysis, and routing information

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g chainchirp
```

### Using npx (No Installation Required)

```bash
npx chainchirp price
```

### Local Installation

```bash
npm install chainchirp
npx chainchirp --help
```

## 🚀 Quick Start

```bash
# Get current Bitcoin price
chainchirp price

# Monitor fees in real-time
chainchirp fees --watch

# Show detailed market data in EUR
chainchirp price --detailed --currency eur

# Generate price sparkline chart
chainchirp sparkline --timeframe 7d --width 60

# Get JSON output for automation
chainchirp price --json
```

## 📊 Commands

### Market Commands
- `price` - Current Bitcoin price and market data
- `volume` - 24h trading volume across exchanges  
- `change` - Price changes over multiple periods
- `highlow` - Daily and all-time price records
- `sparkline` - ASCII price charts and trends

### Network Commands
- `block` - Latest blocks and blockchain data
- `mempool` - Transaction pool and congestion
- `fees` - Transaction fee recommendations
- `hashrate` - Network security and difficulty
- `halving` - Next halving countdown and rewards

### Lightning Network Commands
- `ln cap` - Lightning network capacity
- `ln channels` - Channel statistics
- `ln nodes` - Node information
- `ln route` - Routing analysis

## 🎛️ Global Options

- `--json` - JSON output for automation
- `--watch` - Real-time updates  
- `--interval <sec>` - Update frequency (default: 30)
- `--currency <code>` - Display currency (default: usd)
- `--help` - Show help information
- `--version` - Show version number

## 💡 Examples

```bash
# Detailed price with watch mode
chainchirp price --detailed --watch --interval 15

# Fee recommendations in real-time
chainchirp fees --watch

# Price chart for the last week
chainchirp sparkline --timeframe 7d --width 80

# Market data in Japanese Yen as JSON
chainchirp price --currency jpy --json

# Monitor mempool congestion
chainchirp mempool --watch --interval 10
```

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp

# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build

# Run tests
bun test
```

## 📄 License

MIT © [Tristan Bietsch](https://github.com/TristanBietsch)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

- 🐛 [Report Bugs](https://github.com/TristanBietsch/chainchirp/issues)
- 💡 [Request Features](https://github.com/TristanBietsch/chainchirp/issues)
- 📚 [Documentation](https://github.com/TristanBietsch/chainchirp/blob/main/docs)

---

Made with ❤️ for the Bitcoin community
