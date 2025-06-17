# Configuration

**Customize ChainChirp CLI with environment variables and API keys.**

## API Keys

### Supported Providers

ChainChirp works without API keys, but premium keys unlock higher rate limits:

| Provider | Free Limit | Premium Limit | Environment Variable |
|----------|------------|---------------|---------------------|
| **CoinMarketCap** | 30 req/min | 333 req/min | `CMC_API_KEY` |
| **CoinAPI** | 100 req/day | 100 req/min | `COINAPI_KEY` |
| **CoinGecko** | 30 req/min | 500 req/min | *Coming Soon* |

### Setting API Keys

```bash
# CoinMarketCap (recommended for high-frequency usage)
export CMC_API_KEY="your-api-key-here"

# CoinAPI (good for development)
export COINAPI_KEY="your-api-key-here"

# Make permanent
echo 'export CMC_API_KEY="your-key"' >> ~/.bashrc
echo 'export COINAPI_KEY="your-key"' >> ~/.bashrc
source ~/.bashrc
```

### Getting API Keys

**CoinMarketCap**
1. Visit [CoinMarketCap Pro](https://pro.coinmarketcap.com/)
2. Sign up for free tier (333 requests/month)
3. Copy your API key from dashboard

**CoinAPI**
1. Visit [CoinAPI](https://www.coinapi.io/)
2. Sign up for free tier (100 requests/day)
3. Copy your API key from dashboard

## Environment Variables

### Currently Implemented

| Variable | Purpose | Default | Example |
|----------|---------|---------|---------|
| `CMC_API_KEY` | CoinMarketCap API key | `'DEMO_KEY'` | `export CMC_API_KEY="abc123"` |
| `COINAPI_KEY` | CoinAPI authentication | `'DEMO_KEY'` | `export COINAPI_KEY="xyz789"` |
| `DEBUG` | Enable debug logging | `false` | `export DEBUG=1` |
| `NO_COLOR` | Disable colored output | `false` | `export NO_COLOR=1` |

### Terminal Detection

ChainChirp automatically detects your environment:

- **SSH sessions**: Uses slower spinner updates for better compatibility
- **CI/CD**: Detects GitHub Actions, GitLab CI, Jenkins
- **TTY**: Adjusts output format for pipes and redirects

## Multi-Provider System

ChainChirp uses multiple API providers with automatic failover:

### Market Data Providers

| Provider | Rate Limit | Status | Priority |
|----------|------------|--------|----------|
| **CoinGecko** | 30 req/min | ✅ Primary | 1 |
| **CoinMarketCap** | 333 req/min* | ✅ Premium | 2 |
| **CoinAPI** | 100 req/min* | ✅ Premium | 3 |
| **Binance** | 1200 req/min | ✅ Fallback | 4 |
| **Coinbase** | 10000 req/min | ✅ Fallback | 5 |
| **Kraken** | 60 req/min | ✅ Fallback | 6 |

*Premium rates require API keys

### Blockchain Data Providers

| Provider | Rate Limit | Status | Priority |
|----------|------------|--------|----------|
| **Mempool.space** | 60 req/min | ✅ Primary | 1 |
| **Blockstream** | 60 req/min | ✅ Fallback | 2 |
| **Blockchain.info** | 30 req/min | ✅ Fallback | 3 |

## Cache Configuration

ChainChirp intelligently caches data to respect API limits:

### Cache Durations

| Data Type | Cache TTL | Update Frequency |
|-----------|-----------|------------------|
| **Price** | 30 seconds | High volatility |
| **Volume** | 60 seconds | Medium volatility |
| **Price Changes** | 30 seconds | Market analysis |
| **High/Low** | 60 seconds | Daily stats |
| **Sparklines** | 120 seconds | Chart data |
| **Blocks** | 30 seconds | New blocks |
| **Mempool** | 15 seconds | Congestion |
| **Fees** | 30 seconds | Dynamic pricing |
| **Hashrate** | 300 seconds | Slow changes |
| **Halving** | 600 seconds | Predictable |

### Cache Behavior

- **Automatic**: No configuration needed
- **Memory-based**: No disk storage
- **Respects TTL**: Prevents unnecessary API calls
- **Provider-specific**: Different cache per provider

## Default Settings

### Command Defaults

```bash
# Watch mode
--interval 30        # 30 second updates
--currency usd       # US Dollars
--json false         # Human-readable output

# Sparkline charts
--width 40          # 40 character width
--height 8          # 8 character height
--timeframe 24h     # 24 hour timeframe
```

### Network Settings

```bash
# API configuration
timeout: 10000ms    # 10 second timeout
retries: 3          # 3 retry attempts
user-agent: chainchirp/2.0.0
```

## Performance Optimization

### Debug Mode

Enable verbose logging to diagnose issues:

```bash
export DEBUG=1
chainchirp price
```

**Debug Output Includes:**
- API request/response details
- Provider failover attempts
- Cache hit/miss statistics
- Response timing information

### Network Optimization

**Reduce API calls:**
```bash
# Use longer intervals
chainchirp price --watch --interval 60

# Use cached data
chainchirp price  # Uses cache if available
```

**Optimize for automation:**
```bash
# JSON output is faster
chainchirp price --json

# Disable colors for scripts
export NO_COLOR=1
```

## Security Best Practices

### API Key Security

```bash
# Use environment files
echo "CMC_API_KEY=your-key" > ~/.chainchirp.env
source ~/.chainchirp.env

# Set permissions
chmod 600 ~/.chainchirp.env

# Use system keychain (macOS)
security add-generic-password -a chainchirp -s cmc -w "your-key"
```

### Network Security

- **HTTPS Only**: All API requests use HTTPS
- **No Credentials**: Keys never logged or exposed
- **Rate Limiting**: Built-in protection against abuse
- **User-Agent**: Proper identification in requests

## Troubleshooting

### Common Issues

**API Rate Limits**
```bash
# Check if you're hitting limits
export DEBUG=1
chainchirp price

# Add API keys for higher limits
export CMC_API_KEY="your-key"
```

**Slow Performance**
```bash
# Check network connectivity
chainchirp price --json

# Use debug mode
export DEBUG=1
chainchirp price
```

**Display Issues**
```bash
# Disable colors
export NO_COLOR=1

# Check terminal compatibility
echo $TERM
```

### Debug Commands

```bash
# Test API connectivity
chainchirp price --json

# Check provider fallback
export DEBUG=1
chainchirp price

# Validate configuration
chainchirp --help
```

## Integration Examples

### Shell Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc
alias btc='chainchirp price'
alias btcw='chainchirp price --watch'
alias btcj='chainchirp price --json'
```

### Cron Jobs

```bash
# Log price every hour
0 * * * * chainchirp price --json >> /var/log/btc-price.log

# Daily market summary
0 9 * * * chainchirp price --detailed > /tmp/btc-daily.txt
```

### Scripts

```bash
#!/bin/bash
# Price alert script

export CMC_API_KEY="your-key"
price=$(chainchirp price --json | jq -r '.price')

if (( $(echo "$price > 100000" | bc -l) )); then
    echo "🚨 Bitcoin above $100k: $price"
    # Send notification
fi
```

## Font Recommendations

For best Unicode symbol display:

- **JetBrains Mono Nerd Font** (recommended)
- **Fira Code** 
- **Cascadia Code**
- **SF Mono** (macOS)

Install with:
```bash
# macOS
brew install font-jetbrains-mono-nerd-font

# Linux
sudo apt install fonts-jetbrains-mono
```

---

*See [Examples](./examples.md) for real-world usage scenarios.*