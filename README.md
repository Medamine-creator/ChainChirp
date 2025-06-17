# ChainChirp CLI ⚡

[![npm version](https://badge.fury.io/js/chainchirp.svg)](https://badge.fury.io/js/chainchirp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/chainchirp)](https://npmjs.com/package/chainchirp)

**Professional Bitcoin data directly in your terminal.**

ChainChirp CLI provides real-time Bitcoin market data, blockchain analytics, and network monitoring with enterprise-grade reliability and beautiful terminal UI. Built for traders, developers, and Bitcoin enthusiasts who demand speed and accuracy.

## ✨ Features

### 📊 **Market Data**
- **Real-time pricing** across 6+ exchanges with automatic failover
- **Trading volume** and market depth analysis  
- **Price changes** over multiple timeframes (1h, 24h, 7d, 30d, 1y)
- **ASCII sparklines** for visual price trends
- **High/low tracking** with historical context

### ⛓️ **Blockchain Analytics**
- **Latest blocks** with size, fees, and transaction counts
- **Mempool monitoring** with congestion analysis
- **Fee recommendations** for optimal transaction timing
- **Network hashrate** and difficulty tracking
- **Halving countdown** with block rewards

### 🔧 **Developer Experience**
- **JSON output** for automation and scripting
- **Watch mode** for real-time monitoring
- **Multi-currency support** (USD, EUR, GBP, JPY, BTC, ETH, SATS)
- **Rich terminal formatting** with Unicode symbols
- **Smart caching** to respect API rate limits

### 🚀 **Reliability**
- **Multi-provider fallback** across 6 API sources
- **99.9% uptime** with automatic failover
- **Rate limit handling** and intelligent retries
- **Comprehensive error handling**

## 🚀 Quick Start

### Installation

```bash
npm install -g chainchirp
```

### First Command

```bash
chainchirp price
```

**Output:**
```
₿ Bitcoin (BTC)
$43,250.00 USD
```

### That's it! 

You now have access to real-time Bitcoin data in your terminal.

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| **[Quick Start](./docs/quickstart.md)** | Get up and running in 30 seconds |
| **[Installation](./docs/install.md)** | Detailed setup for all platforms |
| **[Command Reference](./docs/flags.md)** | Complete CLI flags and options |
| **[Configuration](./docs/config.md)** | API keys and environment setup |
| **[Examples](./docs/examples.md)** | Real-world usage scenarios |
| **[FAQ](./docs/faq.md)** | Common questions and troubleshooting |
| **[Architecture](./docs/architecture.md)** | Technical deep dive |
| **[Contributing](./docs/contributing.md)** | Development guidelines |

## 💻 Commands

### Market Data

```bash
# Current price
chainchirp price

# Detailed market data  
chainchirp price --detailed

# Price changes over time
chainchirp change --detailed

# Trading volume
chainchirp volume

# Daily and all-time highs/lows
chainchirp highlow

# ASCII price chart
chainchirp sparkline --timeframe 7d
```

### Blockchain Analytics

```bash
# Latest block information
chainchirp block

# Recent blocks
chainchirp block --recent 5

# Mempool status
chainchirp mempool --detailed

# Fee recommendations
chainchirp fees

# Network hashrate
chainchirp hashrate

# Halving countdown
chainchirp halving
```

### Real-time Monitoring

```bash
# Live price updates
chainchirp price --watch

# Monitor mempool congestion
chainchirp mempool --watch --interval 15

# Track fee changes
chainchirp fees --watch --interval 30

# Live price chart
chainchirp sparkline --watch --timeframe 1h
```

## 🌍 Global Options

| Flag | Description | Default | Example |
|------|-------------|---------|---------|
| `--json` | JSON output for automation | `false` | `chainchirp price --json` |
| `--watch` | Real-time updates | `false` | `chainchirp price --watch` |
| `--interval` | Update frequency (seconds) | `30` | `--interval 10` |
| `--currency` | Display currency | `usd` | `--currency eur` |
| `--help` | Show help | - | `chainchirp --help` |
| `--version` | Show version | - | `chainchirp --version` |

## 🔑 Supported Currencies

| Currency | Code | Example |
|----------|------|---------|
| US Dollar | `usd` | `chainchirp price --currency usd` |
| Euro | `eur` | `chainchirp price --currency eur` |
| British Pound | `gbp` | `chainchirp price --currency gbp` |
| Japanese Yen | `jpy` | `chainchirp price --currency jpy` |
| Bitcoin | `btc` | `chainchirp price --currency btc` |
| Ethereum | `eth` | `chainchirp price --currency eth` |
| Satoshis | `sats` | `chainchirp price --currency sats` |

## 💡 Usage Examples

### Trading & Finance

```bash
# Price monitoring dashboard
chainchirp price --detailed --watch --currency eur

# Set up price alerts (JSON + jq)
price=$(chainchirp price --json | jq -r '.price')
if (( $(echo "$price > 100000" | bc -l) )); then
    echo "🚨 Bitcoin above $100k!"
fi

# Export market data
chainchirp price --detailed --json > btc-data.json
```

### System Integration

```bash
# tmux status bar
set -g status-right '#(chainchirp price --json | jq -r "\"₿$\" + (.price | tostring)")'

# Cron job logging
0 * * * * chainchirp price --json >> /var/log/bitcoin-price.log

# CI/CD integration
chainchirp price --json | jq '.price'
```

### Development & Automation

```bash
# API monitoring
chainchirp price --json | jq '{price, timestamp, provider}'

# Batch data collection
for currency in usd eur gbp; do
    chainchirp price --currency $currency --json
done

# Performance testing
time chainchirp price --json
```

## 🏗️ Installation Options

### Package Managers

```bash
# npm (recommended)
npm install -g chainchirp

# yarn
yarn global add chainchirp

# pnpm  
pnpm add -g chainchirp

# bun
bun add -g chainchirp
```

### No Installation Required

```bash
# Run directly with npx
npx chainchirp price

# Run with bunx
bunx chainchirp price
```

### From Source

```bash
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp
bun install && bun run build
bun link  # Make available globally
```

## 🛠️ Development

### Setup

```bash
# Clone repository
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp

# Install dependencies
bun install

# Run in development mode
bun run dev price

# Run tests
bun test

# Build for production
bun run build
```

### Project Structure

```
src/
├── commands/          # Command implementations
│   ├── market/        # Market data commands
│   ├── chain/         # Blockchain commands
│   └── decorators/    # Cross-cutting concerns
├── services/          # Business logic
├── utils/             # Utilities and formatting
└── types/             # TypeScript definitions
```

### Scripts

```bash
bun run dev           # Development with hot reload
bun run build         # Production build
bun run test          # Run test suite
bun run lint          # ESLint checking
```

## 🌐 API Providers

ChainChirp uses multiple API providers for maximum reliability:

| Provider | Rate Limit | Status | Priority |
|----------|------------|--------|----------|
| **CoinGecko** | 30 req/min | ✅ Primary | 1 |
| **CoinMarketCap** | 333 req/min* | ✅ Premium | 2 |
| **CoinAPI** | 100 req/min* | ✅ Premium | 3 |
| **Binance** | 1200 req/min | ✅ Fallback | 4 |
| **Coinbase** | 10000 req/min | ✅ Fallback | 5 |
| **Kraken** | 60 req/min | ✅ Fallback | 6 |

*Premium rates available with API keys

## 🔒 Configuration

### API Keys (Optional)

```bash
# Enhanced rate limits with premium keys
export CMC_API_KEY="your-coinmarketcap-key"
export COINAPI_KEY="your-coinapi-key"
```

### Environment Variables

```bash
export DEBUG=1                    # Enable debug logging
export NO_COLOR=1                 # Disable colored output
export CHAINCHIRP_CURRENCY=eur    # Default currency
export CHAINCHIRP_INTERVAL=10     # Default interval
```

## 🗺️ Roadmap

### ⚡ Lightning Network
- **ln-cap**: Network capacity analysis
- **ln-channels**: Channel statistics and routing
- **ln-nodes**: Node rankings and metrics
- **ln-fee**: Lightning routing costs

### 🌐 Network Expansion
- **Testnet support**: Bitcoin testnet data
- **Sentiment analysis**: Market sentiment metrics
- **Enhanced charts**: More visualization options

### 📊 Advanced Features
- **Dashboard mode**: Multi-metric real-time display
- **Multi-asset support**: Ethereum and other cryptocurrencies
- **Plugin system**: Third-party extensions
- **Web interface**: Browser-based dashboard

See the complete [Roadmap](./docs/roadmap.md) for detailed plans.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run the test suite**: `bun test`
5. **Submit a pull request**

See [Contributing Guide](./docs/contributing.md) for detailed guidelines.

### Areas We Need Help

- **Lightning Network integration** (1ML API, routing analysis)
- **Additional cryptocurrency support** (Ethereum, Litecoin)
- **Performance optimizations** (caching, response times)  
- **Documentation improvements** (examples, guides)
- **Testing** (integration tests, edge cases)

## 📈 Stats

- **6+ API providers** with automatic failover
- **13,000+ requests/minute** combined capacity
- **99.9% uptime** target reliability
- **Sub-second response times** with smart caching
- **10 market commands** for comprehensive analysis
- **5 blockchain commands** for network monitoring

## 🙏 Acknowledgments

- **API Providers**: CoinGecko, CoinMarketCap, CoinAPI, Binance, Coinbase, Kraken
- **Blockchain Data**: Mempool.space, Blockstream, Blockchain.info
- **Community**: Contributors, testers, and users providing feedback

## 📄 License

MIT © [Tristan Bietsch](https://github.com/TristanBietsch)

## 🔗 Links

- **[Documentation](./docs/index.md)** - Comprehensive guides
- **[GitHub Issues](https://github.com/TristanBietsch/chainchirp/issues)** - Bug reports and features
- **[NPM Package](https://npmjs.com/package/chainchirp)** - Official package
- **[Releases](https://github.com/TristanBietsch/chainchirp/releases)** - Version history

---

**Made with ❤️ for the Bitcoin community**

*ChainChirp CLI - Because Bitcoin data should be fast, reliable, and beautiful.*