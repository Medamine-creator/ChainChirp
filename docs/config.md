# Configuration

Configure ChainChirp CLI with environment variables, settings, and customization options.

## Environment Variables

### API Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CMC_API_KEY` | CoinMarketCap API key for higher limits | `DEMO_KEY` | `export CMC_API_KEY=your_key_here` |
| `COINAPI_KEY` | CoinAPI key for premium features | `DEMO_KEY` | `export COINAPI_KEY=your_key_here` |
| `CG_PRO_KEY` | CoinGecko Pro API key | - | `export CG_PRO_KEY=your_key_here` |

### Display Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CHAINCHIRP_CURRENCY` | Default currency for all commands | `usd` | `export CHAINCHIRP_CURRENCY=eur` |
| `CHAINCHIRP_INTERVAL` | Default watch interval (seconds) | `30` | `export CHAINCHIRP_INTERVAL=10` |
| `CHAINCHIRP_JSON` | Default to JSON output | `false` | `export CHAINCHIRP_JSON=true` |
| `CHAINCHIRP_NO_ICONS` | Disable Unicode icons | `false` | `export CHAINCHIRP_NO_ICONS=true` |
| `CHAINCHIRP_NO_COLOR` | Disable colored output | `false` | `export CHAINCHIRP_NO_COLOR=true` |
| `CHAINCHIRP_CHART_WIDTH` | Default chart width | `40` | `export CHAINCHIRP_CHART_WIDTH=60` |
| `CHAINCHIRP_CHART_HEIGHT` | Default chart height | `8` | `export CHAINCHIRP_CHART_HEIGHT=12` |

### Network Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CHAINCHIRP_TIMEOUT` | API timeout (milliseconds) | `10000` | `export CHAINCHIRP_TIMEOUT=5000` |
| `CHAINCHIRP_RETRIES` | Max retry attempts | `3` | `export CHAINCHIRP_RETRIES=5` |
| `CHAINCHIRP_USER_AGENT` | Custom User-Agent string | `chainchirp/2.0.0` | `export CHAINCHIRP_USER_AGENT=MyApp/1.0` |

### Lightning Network

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LN_HOST` | Lightning node host | - | `export LN_HOST=localhost:10009` |
| `LN_CERT_PATH` | TLS certificate path | - | `export LN_CERT_PATH=~/.lnd/tls.cert` |
| `LN_MACAROON_PATH` | Admin macaroon path | - | `export LN_MACAROON_PATH=~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon` |

### Development & Debug

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEBUG` | Enable debug logging | `false` | `export DEBUG=1` |
| `NODE_ENV` | Environment mode | `production` | `export NODE_ENV=development` |
| `CHAINCHIRP_CACHE_TTL` | Cache TTL (seconds) | `30` | `export CHAINCHIRP_CACHE_TTL=60` |

## Configuration File

Create `.chainchirp.json` in your home directory:

```json
{
  "defaultCurrency": "usd",
  "defaultOutputFormat": "default",
  "apiTimeout": 10000,
  "debugMode": false,
  "watchDefaults": {
    "enabled": false,
    "interval": 30,
    "clearScreen": true
  },
  "apiEndpoints": {
    "coingecko": "https://api.coingecko.com/api/v3",
    "mempool": "https://mempool.space/api",
    "blockchain": "https://blockchain.info",
    "lightning": "https://1ml.com/api",
    "fearGreed": "https://api.alternative.me"
  },
  "rateLimit": {
    "requestsPerMinute": 60,
    "burstLimit": 10
  },
  "display": {
    "currency": "usd",
    "useIcons": true,
    "useColors": true,
    "chartWidth": 40,
    "chartHeight": 8
  }
}
```

## API Providers

ChainChirp uses multiple API providers for reliability:

### Market Data Providers

| Provider | Rate Limit | Auth Required | Priority |
|----------|------------|---------------|----------|
| **CoinGecko** | 30 req/min | No | 1 (Primary) |
| **CoinMarketCap** | 333 req/min | Optional | 2 |
| **CoinAPI** | 100 req/min | Optional | 3 |
| **Binance** | 1200 req/min | No | 4 |
| **Coinbase** | 10000 req/min | No | 5 |
| **Kraken** | 60 req/min | No | 6 |

### Chain Data Providers

| Provider | Rate Limit | Auth Required | Priority |
|----------|------------|---------------|----------|
| **Mempool.space** | 60 req/min | No | 1 (Primary) |
| **Blockstream** | 60 req/min | No | 2 |
| **Blockchain.info** | 30 req/min | No | 3 |

## Cache Configuration

### Cache Intervals

Different data types have different cache intervals:

| Data Type | Cache TTL | Reason |
|-----------|-----------|---------|
| **Price** | 30 seconds | High volatility |
| **Volume** | 60 seconds | Medium volatility |
| **Blocks** | 600 seconds | New blocks ~10 minutes |
| **Fees** | 30 seconds | Dynamic congestion |
| **Hashrate** | 3600 seconds | Slow changes |
| **Halving** | 3600 seconds | Predictable schedule |

### Cache Storage

```bash
# Cache location (varies by OS)
~/.chainchirp/cache/          # Linux/macOS
%APPDATA%/chainchirp/cache/   # Windows

# Cache files
price_cache.json
volume_cache.json
block_cache.json
fees_cache.json
```

## Font & Terminal Setup

### Recommended Fonts

For best experience with Unicode symbols:

- **Nerd Fonts**: [JetBrains Mono Nerd Font](https://github.com/ryanoasis/nerd-fonts)
- **FiraCode**: [FiraCode](https://github.com/tonsky/FiraCode)
- **Cascadia Code**: [Cascadia Code](https://github.com/microsoft/cascadia-code)

### Terminal Configuration

#### macOS Terminal
```bash
# Profile > Text > Font
# Choose: JetBrains Mono Nerd Font, 14pt

# Profile > Advanced > Character Encoding
# Set to: UTF-8
```

#### iTerm2
```bash
# Preferences > Profiles > Text > Font
# Choose: JetBrains Mono Nerd Font, 14pt

# Preferences > Profiles > Text > Unicode
# Check: Use Unicode version 9 widths
```

#### Windows Terminal
```json
{
  "fontFace": "JetBrains Mono NL",
  "fontSize": 14,
  "fontWeight": "normal"
}
```

## Performance Optimization

### Reduce Latency

```bash
# Use shorter timeouts
export CHAINCHIRP_TIMEOUT=5000

# Reduce retries
export CHAINCHIRP_RETRIES=1

# Use faster providers
export CHAINCHIRP_PREFERRED_PROVIDER=binance
```

### Minimize API Usage

```bash
# Longer cache TTL
export CHAINCHIRP_CACHE_TTL=120

# Longer watch intervals
export CHAINCHIRP_INTERVAL=60

# Disable automatic updates
export CHAINCHIRP_AUTO_UPDATE=false
```

### Batch Operations

```bash
# Use JSON for scripting (faster parsing)
export CHAINCHIRP_JSON=true

# Disable icons for faster rendering
export CHAINCHIRP_NO_ICONS=true

# Disable colors for faster output
export CHAINCHIRP_NO_COLOR=true
```

## Security Considerations

### API Keys

Store API keys securely:

```bash
# Use environment files
echo "CMC_API_KEY=your_key_here" >> ~/.chainchirp.env
source ~/.chainchirp.env

# Or use system keychain
security add-generic-password -a chainchirp -s coinmarketcap -w your_key_here
```

### Network Security

```bash
# Use HTTPS-only endpoints
export CHAINCHIRP_FORCE_HTTPS=true

# Custom User-Agent for privacy
export CHAINCHIRP_USER_AGENT="Mozilla/5.0 (compatible; ChainChirp/2.0)"

# Disable telemetry
export CHAINCHIRP_NO_TELEMETRY=true
```

## Troubleshooting

### Common Issues

#### Icons Not Displaying
```bash
# Disable Unicode icons
export CHAINCHIRP_NO_ICONS=true

# Or install proper fonts
brew install font-jetbrains-mono-nerd-font
```

#### API Rate Limits
```bash
# Enable debug logging
export DEBUG=1

# Use premium API keys
export CMC_API_KEY=your_premium_key
export COINAPI_KEY=your_premium_key
```

#### Slow Performance
```bash
# Reduce timeout
export CHAINCHIRP_TIMEOUT=3000

# Use faster providers
export CHAINCHIRP_PREFERRED_PROVIDER=binance

# Disable unnecessary features
export CHAINCHIRP_NO_COLOR=true
export CHAINCHIRP_NO_ICONS=true
```

### Debug Mode

Enable verbose logging:

```bash
export DEBUG=1
chainchirp price
```

Output includes:
- API request/response details
- Cache hit/miss information
- Provider fallback attempts
- Performance timing

### Configuration Validation

Validate your configuration:

```bash
chainchirp --validate-config
```

## Integration Examples

### Shell Configuration

#### Bash (~/.bashrc)
```bash
# ChainChirp aliases
alias btc='chainchirp price'
alias btcw='chainchirp price --watch'
alias btcf='chainchirp fees'

# ChainChirp environment
export CHAINCHIRP_CURRENCY=usd
export CHAINCHIRP_INTERVAL=30
export CHAINCHIRP_CHART_WIDTH=60
```

#### Zsh (~/.zshrc)
```bash
# ChainChirp configuration
export CHAINCHIRP_CURRENCY=eur
export CHAINCHIRP_NO_ICONS=false
export CHAINCHIRP_CHART_WIDTH=80

# ChainChirp functions
btc-alert() {
  local threshold=${1:-100000}
  while true; do
    local price=$(chainchirp price --json | jq -r '.price')
    if (( $(echo "$price > $threshold" | bc -l) )); then
      echo "🚨 Bitcoin price alert: $price"
      # Add notification here
    fi
    sleep 300
  done
}
```

### System Integration

#### Systemd Service (Linux)
```ini
[Unit]
Description=ChainChirp Price Monitor
After=network.target

[Service]
Type=simple
User=bitcoin
Environment=CHAINCHIRP_JSON=true
Environment=CHAINCHIRP_INTERVAL=60
ExecStart=/usr/local/bin/chainchirp price --watch --json
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Cron Job
```bash
# Monitor price every 5 minutes
*/5 * * * * /usr/local/bin/chainchirp price --json >> /var/log/bitcoin-price.log 2>&1

# Daily market summary
0 9 * * * /usr/local/bin/chainchirp price --detailed --json > /tmp/daily-btc.json
```

---

*See [Flags](./flags.md) for command-line options and [Examples](./examples.md) for usage patterns.*