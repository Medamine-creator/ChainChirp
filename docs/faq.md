# Frequently Asked Questions

**Common questions and answers about ChainChirp CLI.**

## General

### What is ChainChirp CLI?

ChainChirp is a professional command-line tool for accessing real-time Bitcoin data. It provides market prices, blockchain metrics, and network information directly in your terminal with automatic failover across multiple API providers.

### Why choose ChainChirp over other tools?

- **Reliability**: Multi-provider fallback system ensures 99.9% uptime
- **Speed**: Sub-second response times with intelligent caching
- **Professional UX**: Stripe/Vercel-inspired terminal design
- **Developer-friendly**: JSON output, watch mode, scriptable
- **Zero config**: Works immediately without setup

### Is ChainChirp free?

Yes! ChainChirp is completely free and open-source. It uses free tiers of various Bitcoin APIs with automatic failover to ensure continuous service.

## Installation

### How do I install ChainChirp?

**Quickest method:**
```bash
npm install -g chainchirp
chainchirp price
```

**From source:**
```bash
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp
bun install && bun run build
bun link
```

See the [Installation Guide](./install.md) for all options.

### Why isn't the `chainchirp` command working?

Common solutions:

1. **Global installation**: Run `npm install -g chainchirp`
2. **Use bunx**: `bunx chainchirp price` (if installed locally)
3. **Check PATH**: Ensure npm global bin is in your PATH
4. **Permissions**: Run `chmod +x dist/index.js` if needed

```bash
# Check if command is available
which chainchirp

# If not found, check npm global path
npm config get prefix
```

### What are the system requirements?

- **Node.js**: 18+ (LTS recommended)
- **Package Manager**: npm, yarn, pnpm, or bun
- **OS**: macOS, Linux, Windows (WSL recommended)
- **Terminal**: Any modern terminal with UTF-8 support

## Usage

### What commands are available?

| Command | Purpose | Example |
|---------|---------|---------|
| `price` | Current Bitcoin price | `chainchirp price --detailed` |
| `volume` | 24h trading volume | `chainchirp volume --watch` |
| `change` | Price changes | `chainchirp change --detailed` |
| `highlow` (`hl`) | High/low prices | `chainchirp hl --json` |
| `sparkline` (`spark`) | ASCII charts | `chainchirp spark --timeframe 7d` |
| `block` | Block information | `chainchirp block --recent 5` |
| `mempool` | Transaction pool | `chainchirp mempool --detailed` |
| `fees` | Fee estimates | `chainchirp fees --history 24` |
| `hashrate` | Network security | `chainchirp hashrate --watch` |
| `halving` | Halving countdown | `chainchirp halving` |

### How do I get real-time updates?

Use the `--watch` flag with any command:

```bash
# Basic watch mode (30-second updates)
chainchirp price --watch

# Custom interval
chainchirp price --watch --interval 10

# Live chart
chainchirp spark --watch --timeframe 1h --interval 60
```

### What currencies are supported?

| Currency | Code | Example |
|----------|------|---------|
| US Dollar | `usd` | `chainchirp price --currency usd` |
| Euro | `eur` | `chainchirp price --currency eur` |
| British Pound | `gbp` | `chainchirp price --currency gbp` |
| Japanese Yen | `jpy` | `chainchirp price --currency jpy` |
| Bitcoin | `btc` | `chainchirp price --currency btc` |
| Ethereum | `eth` | `chainchirp price --currency eth` |
| Satoshis | `sats` | `chainchirp price --currency sats` |

### How do I export data for analysis?

Use the `--json` flag for machine-readable output:

```bash
# Single data point
chainchirp price --json

# Continuous logging
chainchirp price --watch --json >> bitcoin-prices.jsonl

# Process with jq
chainchirp price --detailed --json | jq '.price'

# Export to CSV (using script)
chainchirp price --json | jq -r '[.timestamp, .price, .change_24h] | @csv'
```

## Technical

### Which APIs does ChainChirp use?

ChainChirp uses 6 market data providers with automatic failover:

| Provider | Rate Limit | Status | Priority |
|----------|------------|--------|----------|
| **CoinGecko** | 30 req/min | ✅ Primary | 1 |
| **CoinMarketCap** | 333 req/min* | ✅ Premium | 2 |
| **CoinAPI** | 100 req/min* | ✅ Premium | 3 |
| **Binance** | 1200 req/min | ✅ Fallback | 4 |
| **Coinbase** | 10000 req/min | ✅ Fallback | 5 |
| **Kraken** | 60 req/min | ✅ Fallback | 6 |

*Premium rates require API keys

### How does the multi-provider system work?

1. **Primary provider** is tried first (usually CoinGecko)
2. **Automatic failover** to next provider if primary fails
3. **Rate limit awareness** prevents API throttling
4. **Health monitoring** tracks provider performance
5. **Transparent operation** - you always get data

### Why do I see different providers in debug mode?

This is normal! ChainChirp intelligently selects providers based on:
- Current rate limit status
- Historical response times
- Provider health metrics
- Data freshness requirements

Enable debug mode to see provider selection:
```bash
export DEBUG=1
chainchirp price
```

### How accurate is the data?

Very accurate. ChainChirp:
- Uses reputable APIs from major market data providers
- Shows provider information for transparency
- Updates frequently to ensure data freshness
- Cross-validates when multiple sources are available

## Troubleshooting

### I'm getting API errors

This is handled automatically! ChainChirp's failover system will:
- Automatically retry with backup providers
- Show which provider is being used (in debug mode)
- Continue working even if some APIs are down

If all providers fail (rare), wait a few minutes and try again.

### Charts look broken or weird

Chart display issues are usually related to:

**Terminal font:**
```bash
# Install a proper monospace font
brew install font-jetbrains-mono-nerd-font  # macOS
sudo apt install fonts-jetbrains-mono       # Linux
```

**Terminal size:**
```bash
# Adjust chart dimensions
chainchirp spark --width 60 --height 12    # Larger
chainchirp spark --width 20 --height 4     # Compact
```

**Unicode support:**
```bash
# Disable icons if needed
export CHAINCHIRP_NO_ICONS=true
chainchirp price
```

### Commands are slow

**Performance optimizations:**

```bash
# Use JSON for faster parsing
chainchirp price --json

# Disable colors for scripts
export NO_COLOR=1

# Use appropriate intervals
chainchirp price --watch --interval 60  # Don't go too fast

# Pre-build if using from source
bun run build
```

### Permission errors

**macOS/Linux:**
```bash
# Fix file permissions
chmod +x dist/index.js

# Fix npm permissions (if needed)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

**Global installation:**
```bash
# Use sudo if needed
sudo npm install -g chainchirp

# Or use Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
npm install -g chainchirp
```

## Advanced Usage

### How do I create price alerts?

Create scripts using JSON output:

```bash
#!/bin/bash
# price-alert.sh

THRESHOLD=100000
price=$(chainchirp price --json | jq -r '.price')

if (( $(echo "$price > $THRESHOLD" | bc -l) )); then
    echo "🚨 Bitcoin above $THRESHOLD: $price"
    # Add notification: osascript, curl webhook, etc.
fi
```

### Can I integrate with monitoring systems?

Yes! ChainChirp works great with:

**Prometheus/Grafana:**
```bash
# Export metrics
chainchirp price --json | jq -r '"bitcoin_price " + (.price | tostring)'
```

**InfluxDB:**
```bash
# Time series data
chainchirp price --json | jq -r '"bitcoin,currency=usd price=" + (.price | tostring)'
```

**Nagios/Icinga:**
```bash
# Health checks
if chainchirp price --json >/dev/null 2>&1; then
    echo "OK - Bitcoin API reachable"
    exit 0
else
    echo "CRITICAL - Bitcoin API unreachable"
    exit 2
fi
```

### How do I log data continuously?

**Method 1: Watch mode**
```bash
# Log to file
chainchirp price --watch --json >> /var/log/bitcoin-price.jsonl

# With rotation
chainchirp price --watch --json | rotatelogs /var/log/bitcoin-%Y%m%d.log 86400
```

**Method 2: Cron jobs**
```bash
# Add to crontab
# Log price every 5 minutes
*/5 * * * * /usr/local/bin/chainchirp price --json >> /var/log/bitcoin.jsonl

# Daily market summary
0 9 * * * /usr/local/bin/chainchirp price --detailed > /tmp/daily-btc.txt
```

### Can I use ChainChirp in Docker?

Yes! Here's a simple Dockerfile:

```dockerfile
FROM node:18-alpine
RUN npm install -g chainchirp
WORKDIR /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD chainchirp price --json || exit 1

CMD ["chainchirp", "price", "--watch", "--interval", "60"]
```

```bash
# Build and run
docker build -t bitcoin-monitor .
docker run -d --name btc-monitor bitcoin-monitor
```

## Performance

### How fast is ChainChirp?

Typical response times:
- **Price**: 150-300ms
- **Volume**: 200-400ms
- **Charts**: 300-600ms
- **Blockchain data**: 200-500ms

Performance depends on:
- Network latency
- API provider response time
- Cache hit/miss ratio

### What's the rate limit?

ChainChirp's combined capacity:
- **13,000+ requests/minute** across all providers
- **Intelligent load balancing** prevents bottlenecks
- **Automatic throttling** respects API limits
- **Built-in backoff** when limits are reached

For high-frequency usage, consider adding premium API keys:
```bash
export CMC_API_KEY="your-coinmarketcap-key"
export COINAPI_KEY="your-coinapi-key"
```

### Can I use ChainChirp in production?

Absolutely! ChainChirp is designed for:
- **High availability** (99.9% uptime target)
- **Production workloads** with enterprise-grade reliability
- **Automation systems** and monitoring
- **CI/CD pipelines** and scripts

## Support

### Where can I get help?

1. **Documentation**: Check existing docs first
2. **GitHub Issues**: Report bugs and request features
3. **Community**: Discussions and forums
4. **Debug mode**: Use `export DEBUG=1` for troubleshooting

### How can I contribute?

- **Report issues** and suggest improvements
- **Submit pull requests** for new features  
- **Improve documentation** and examples
- **Share usage examples** with the community

### Is there a roadmap?

Upcoming features:
- **Lightning Network**: Node stats, capacity analysis
- **Multi-asset support**: Ethereum, other cryptocurrencies
- **Enhanced charts**: More visualization options
- **Custom alerts**: Built-in notification system
- **Dashboard mode**: Real-time multi-metric display

## Quick Reference

### Essential Commands
```bash
chainchirp price                    # Current price
chainchirp price --detailed         # Full market data
chainchirp price --watch            # Live monitoring
chainchirp price --json             # JSON output
chainchirp spark --timeframe 7d     # Weekly chart
```

### Global Flags
```bash
--json                    # JSON output
--watch                   # Real-time updates
--interval <seconds>      # Update frequency
--currency <code>         # Display currency
--help                    # Show help
```

### Environment Variables
```bash
export CMC_API_KEY="key"        # CoinMarketCap API key
export COINAPI_KEY="key"        # CoinAPI key
export DEBUG=1                  # Enable debug logging
export NO_COLOR=1              # Disable colors
```

---

*Still have questions? Check the [Examples](./examples.md) for real-world usage or [open an issue](https://github.com/TristanBietsch/chainchirp/issues) on GitHub.*