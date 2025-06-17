# ChainChirp CLI

**Real-time Bitcoin data directly in your terminal.**

ChainChirp is a professional-grade command-line interface that provides instant access to Bitcoin market data, blockchain metrics, and Lightning Network information. Built for traders, developers, and Bitcoin enthusiasts who demand speed and reliability.

## Features

### 📊 Market Data
- **Real-time pricing** across 6+ exchanges with automatic failover
- **Trading volume** and market depth analysis
- **Price changes** over multiple timeframes (1h, 24h, 7d, 30d, 1y)
- **ASCII sparklines** for visual price trends
- **Daily/ATH highs and lows** with historical context

### ⛓️ Blockchain Analytics
- **Latest blocks** with size, fees, and transaction counts
- **Mempool analysis** with congestion metrics
- **Fee recommendations** for optimal transaction timing
- **Network hashrate** and difficulty adjustments
- **Halving countdown** with block rewards

### ⚡ Lightning Network (Coming Soon)
- Network capacity and channel statistics
- Node rankings and liquidity analysis
- Routing fee analysis and pathfinding

### 🔧 Developer Experience
- **JSON output** for automation and scripting
- **Watch mode** for real-time monitoring
- **Multi-currency support** (USD, EUR, GBP, etc.)
- **Rich terminal formatting** with Unicode symbols
- **Smart caching** to respect API rate limits

## Quick Start

```bash
# Install globally
npm install -g chainchirp

# Get current Bitcoin price
chainchirp price

# Watch price updates in real-time
chainchirp price --watch

# Get detailed market data in JSON
chainchirp price --detailed --json
```

## Why ChainChirp?

**Built for Reliability**
- Multi-provider API fallback system ensures 99.9% uptime
- Intelligent rate limiting prevents API throttling
- Comprehensive error handling with automatic retries

**Optimized for Speed**
- Sub-second response times with smart caching
- Minimal dependencies for fast startup
- Efficient data structures and algorithms

**Professional UX**
- Stripe/Vercel-inspired terminal design
- Contextual help system with examples
- Consistent command patterns and flags

## Architecture

ChainChirp uses a sophisticated multi-layer architecture:

```
Terminal Interface
       ↓
Command Decorators (JSON, Watch, Help)
       ↓
Service Layer (Market, Chain, Lightning)
       ↓
Multi-Provider API Client
       ↓
Data Sources (CoinGecko, Mempool.space, etc.)
```

## Installation

Choose your preferred installation method:

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

### Direct Download
Download pre-built binaries from [GitHub Releases](https://github.com/user/chainchirp/releases).

## Documentation

- **[Quick Start](./quickstart.md)** - Get up and running in 30 seconds
- **[Installation Guide](./install.md)** - Detailed setup instructions
- **[Command Reference](./commands.md)** - Complete command documentation
- **[Configuration](./config.md)** - Environment variables and settings
- **[Examples](./examples.md)** - Real-world usage scenarios
- **[FAQ](./faq.md)** - Common questions and troubleshooting

## Community

- **GitHub**: [Report issues and contribute](https://github.com/user/chainchirp)
- **Discussions**: Share use cases and get help
- **Twitter**: Follow [@chainchirp](https://twitter.com/chainchirp) for updates

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

*Built with ❤️ for the Bitcoin community*