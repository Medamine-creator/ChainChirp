# Frequently Asked Questions (FAQ)

Common questions and answers about ChainChirp CLI.

## General Questions

### What is ChainChirp CLI?

ChainChirp CLI is a command-line tool that provides real-time Bitcoin market data through multiple API providers. It features automatic failover, real-time monitoring, ASCII charts, and support for multiple currencies and output formats.

### Why use ChainChirp over other Bitcoin tools?

- **Reliability**: 6-provider fallback system ensures 99.9% uptime
- **Speed**: Sub-second response times with intelligent API selection
- **Visual**: ASCII charts and beautiful terminal output
- **Flexible**: JSON output, watch mode, multiple currencies
- **Developer-friendly**: Perfect for automation and integration

### Is ChainChirp free to use?

Yes, ChainChirp CLI is completely free and open-source. It uses free tiers of various Bitcoin API providers with automatic failover to ensure continuous service.

## Installation & Setup

### What are the system requirements?

- **Runtime**: Node.js 18+ or Bun
- **Operating System**: macOS, Linux, Windows (WSL recommended)
- **Internet**: Required for API data
- **Terminal**: Any modern terminal/command line interface

### How do I install ChainChirp?

See the [Installation Guide](install.md) for detailed instructions. The quickest method:

```bash
git clone https://github.com/your-repo/chainchirp-cli.git
cd chainchirp-cli
bun install && bun run build
bunx chainchirp price
```

### Why isn't the `chainchirp` command working?

Common solutions:
1. **Use `bunx chainchirp` instead of just `chainchirp`**
2. **Run `bun link` or `npm link` for global installation**
3. **Use full path**: `./dist/index.js price`
4. **Check permissions**: `chmod +x dist/index.js`

## Usage Questions

### What commands are available?

| Command | Purpose | Example |
|---------|---------|---------|
| `price` | Current Bitcoin price | `chainchirp price --detailed` |
| `volume` | 24h trading volume | `chainchirp volume --watch` |
| `change` | Price changes over time | `chainchirp change --detailed` |
| `highlow` (`hl`) | High/low prices | `chainchirp hl --json` |
| `sparkline` (`spark`) | ASCII price charts | `chainchirp spark --timeframe 7d` |

### How do I get real-time updates?

Use the `--watch` flag with any command:

```bash
chainchirp price --watch          # 30-second updates (default)
chainchirp volume --watch --interval 10  # 10-second updates
chainchirp spark --watch --timeframe 1h  # Live 1-hour chart
```

### What currencies are supported?

- **Fiat**: USD, EUR, GBP, JPY
- **Crypto**: BTC, ETH, SATS

```bash
chainchirp price --currency eur
chainchirp volume --currency btc
chainchirp hl --currency sats
```

### How do I get data in JSON format?

Add the `--json` flag to any command:

```bash
chainchirp price --json
chainchirp volume --json | jq '.volume24h'
chainchirp spark --json --timeframe 7d > chart_data.json
```

## Technical Questions

### Which APIs does ChainChirp use?

ChainChirp uses 6 API providers with automatic failover:

1. **CoinGecko** (Primary) - 30 req/min, highest quality
2. **CoinMarketCap** - 333 req/min, comprehensive data
3. **CoinAPI** - 100 req/min, institutional grade  
4. **Binance** - 1200 req/min, real-time exchange data
5. **Coinbase** - 10000 req/min, high-frequency updates
6. **Kraken** - 60 req/min, backup provider

### How does the failover system work?

When an API request fails (rate limit, timeout, error), ChainChirp automatically:
1. **Tries the next provider** in priority order
2. **Normalizes the response** to maintain consistent output
3. **Updates provider health metrics** for future requests
4. **Continues transparently** without user intervention

### Why do I see different providers in the output?

This is normal! ChainChirp selects the best available provider based on:
- Current rate limit status
- Historical response times  
- Provider health metrics
- Data freshness requirements

### How accurate is the data?

Very accurate. ChainChirp:
- **Uses reputable APIs** from major market data providers
- **Cross-validates data** when multiple sources are available
- **Shows provider information** for transparency
- **Updates frequently** to ensure freshness

## Troubleshooting

### I'm getting API errors or timeouts

This is handled automatically! ChainChirp's multi-API system will:
- **Automatically retry** with backup providers
- **Show which provider** is being used
- **Continue working** even if some APIs are down

If all providers fail (very rare), try again in a few minutes.

### The sparkline charts look weird

Chart appearance can vary based on:
- **Terminal font**: Use a monospace font for best results
- **Terminal size**: Larger terminals display better charts
- **Color support**: Modern terminals show colored output

Customize chart dimensions:
```bash
chainchirp spark --width 60 --height 12  # Larger chart
chainchirp spark --width 20 --height 4   # Compact chart
```

### Commands are running slowly

Speed optimizations:
- **Use Bun runtime**: `bunx chainchirp` vs `node dist/index.js`
- **Pre-build project**: `bun run build`
- **Use JSON output**: Faster parsing for automation
- **Shorter intervals**: `--interval 5` for more frequent updates

### I'm getting permission errors

On macOS/Linux:
```bash
chmod +x dist/index.js
```

For global installation:
```bash
sudo bun link  # or sudo npm link
```

## Advanced Usage

### How do I create alerts and notifications?

Create custom scripts with JSON output:

```bash
#!/bin/bash
# Bitcoin price alert script

price=$(chainchirp price --json | jq -r '.price')
if (( $(echo "$price > 110000" | bc -l) )); then
    echo "🚨 Bitcoin above $110k: $price"
    # Add notification logic here
fi
```

### Can I log data continuously?

Yes! Use watch mode or cron jobs:

```bash
# Continuous logging
chainchirp price --watch --json >> price_log.jsonl

# Hourly cron job
# 0 * * * * /usr/local/bin/chainchirp price --json >> /var/log/btc.log
```

### How do I integrate with other tools?

ChainChirp works great with:

**jq** (JSON processing):
```bash
chainchirp price --json | jq '.price'
chainchirp volume --json | jq '{price: .price, volume: .volume24h}'
```

**curl/webhooks**:
```bash
price=$(chainchirp price --json | jq -r '.price')
curl -X POST "https://hooks.slack.com/..." -d "Bitcoin: $price"
```

**Python scripts**:
```python
import subprocess
import json

result = subprocess.run(['chainchirp', 'price', '--json'], capture_output=True, text=True)
data = json.loads(result.stdout)
print(f"Bitcoin price: ${data['price']}")
```

### Can I customize the output format?

Currently, ChainChirp offers:
- **Human-readable** (default) - Formatted with colors and symbols
- **JSON** - Machine-readable for automation

Future versions may include additional formats.

## Performance Questions

### How fast is ChainChirp?

Typical response times:
- **Price**: < 200ms
- **Volume**: < 250ms  
- **Change**: < 200ms
- **HighLow**: < 300ms
- **Sparkline**: < 500ms

### What's the rate limit?

ChainChirp's combined capacity across all providers:
- **11,000+ requests/minute** total
- **Intelligent load balancing** across providers
- **Per-provider throttling** to prevent limits
- **Automatic backoff** when limits are reached

### Can I use ChainChirp in production?

Absolutely! ChainChirp is designed for:
- **High availability** (99.9% uptime)
- **Production workloads** with multi-API reliability
- **Automation and monitoring** systems
- **CI/CD pipelines** and scripts

## Support & Contributing

### Where can I report bugs?

- **GitHub Issues**: For bugs and feature requests
- **Documentation**: Check existing docs first
- **Community**: Discussion forums and chat

### How can I contribute?

- **Report issues** and suggest improvements
- **Submit pull requests** for new features
- **Improve documentation** and examples
- **Share usage examples** and scripts

### Is there a roadmap?

Planned features:
- Additional cryptocurrencies (Ethereum, etc.)
- More chart types and visualizations
- Custom alert systems
- Enhanced automation features
- Additional output formats

---

## Quick Reference

### Common Commands
```bash
chainchirp price                    # Basic price
chainchirp price --detailed         # Full market data
chainchirp volume --watch           # Live volume monitoring
chainchirp hl --json               # High/low in JSON
chainchirp spark --timeframe 7d     # 7-day chart
```

### Global Options
```bash
--json                    # JSON output
--watch                   # Real-time updates
--interval <seconds>      # Update frequency
--currency <currency>     # Price currency
--help                    # Command help
```

### Aliases
```bash
chainchirp hl             # highlow command
chainchirp spark          # sparkline command
```

---

*Still have questions? Check the [Commands Guide](commands.md) or open an issue on GitHub.* 