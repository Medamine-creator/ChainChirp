# ChainChirp CLI

Real-time Bitcoin market data with multi-API reliability and beautiful terminal output.

## Overview

ChainChirp CLI is a powerful command-line tool that provides comprehensive Bitcoin market data through a robust multi-API system. Built for traders, developers, and Bitcoin enthusiasts who need reliable, fast, and accurate market information directly in their terminal.

## Key Features

- **🔄 Multi-API Reliability**: 6 provider fallback system for 99.9% uptime
- **⚡ Real-time Updates**: Watch mode with customizable intervals 
- **📊 Visual Charts**: ASCII sparkline charts for trend analysis
- **🌍 Multi-currency**: Support for USD, EUR, GBP, JPY, BTC, ETH, SATS
- **🔧 JSON Output**: Perfect for automation and integration
- **⚡ Fast**: Sub-second response times with automatic failover

## Quick Start

```bash
# Get current Bitcoin price
chainchirp price

# Show detailed market data
chainchirp price --detailed

# Monitor volume in real-time
chainchirp volume --watch

# Generate 7-day price chart
chainchirp spark --timeframe 7d

# Get high/low prices
chainchirp hl
```

## Available Commands

| Command | Description |
|---------|-------------|
| `price` | Current Bitcoin price and market data |
| `volume` | 24h trading volume across exchanges |
| `change` | Price changes over time periods |
| `highlow` (`hl`) | Daily and all-time high/low prices |
| `sparkline` (`spark`) | ASCII price charts |

## Documentation

- **[Commands](commands.md)** - Complete command reference with examples
- **[Installation](install.md)** - Installation and setup guide
- **[FAQ](faq.md)** - Frequently asked questions

## Multi-API System

ChainChirp uses 6 different API providers with automatic failover:

1. **CoinGecko** (Primary) - 30 req/min
2. **CoinMarketCap** - 333 req/min  
3. **CoinAPI** - 100 req/min
4. **Binance** - 1200 req/min
5. **Coinbase** - 10000 req/min
6. **Kraken** - 60 req/min

This ensures maximum uptime and data accuracy even when individual providers experience issues.

## Example Output

```
✓ Bitcoin Price
  $107,263.50

  ◦ Updated: Dec 16 at 14:23
  ◦ Latency: 127ms
  ◦ Provider: CoinGecko
```

## Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Complete guides and examples
- **Community**: Join other Bitcoin CLI users

---

*Built with ❤️ for the Bitcoin community. Powered by 6 reliable API providers.*
