# ChainChirp CLI Commands

A comprehensive guide to all available ChainChirp commands for Bitcoin ecosystem data.

## Table of Contents

- [ChainChirp CLI Commands](#chainchirp-cli-commands)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Global Options](#global-options)
    - [Supported Currencies](#supported-currencies)
  - [Market Commands](#market-commands)
    - [Price Command](#price-command)
    - [Volume Command](#volume-command)
    - [Change Command](#change-command)
    - [High/Low Command](#highlow-command)
    - [Sparkline Command](#sparkline-command)
  - [Multi-API Reliability](#multi-api-reliability)
    - [API Providers (Priority Order)](#api-providers-priority-order)
    - [Features](#features)
    - [Provider Selection](#provider-selection)
  - [Output Formats](#output-formats)
    - [Human-Readable (Default)](#human-readable-default)
    - [JSON Format](#json-format)
  - [Watch Mode](#watch-mode)
  - [Examples](#examples)
    - [Basic Usage](#basic-usage)
    - [Advanced Usage](#advanced-usage)
    - [Integration Examples](#integration-examples)
    - [Automation Examples](#automation-examples)
    - [Dashboard Creation](#dashboard-creation)
  - [Command Summary](#command-summary)
  - [Performance \& Reliability](#performance--reliability)
    - [Response Times](#response-times)
    - [Uptime Guarantee](#uptime-guarantee)
    - [Rate Limits](#rate-limits)
  - [Getting Help](#getting-help)

---

## Overview

ChainChirp CLI provides real-time Bitcoin market data through a robust multi-API system that ensures maximum uptime and data accuracy. All commands support real-time monitoring, multiple output formats, and various currencies.

**Key Features:**
- ✓ Multi-API fallback system (6 providers) for 99.9% uptime
- ✓ Real-time watch mode with customizable intervals
- ✓ JSON output for automation and integration
- ✓ Support for 7+ currencies (USD, EUR, GBP, JPY, BTC, ETH, SATS)
- ✓ ASCII charts and visual data representation
- ✓ Sub-second response times with automatic failover

---

## Global Options

These options are available for all commands:

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--json` | Output data in JSON format | `false` | `chainchirp price --json` |
| `--watch` | Enable watch mode (real-time updates) | `false` | `chainchirp price --watch` |
| `--interval <seconds>` | Watch mode update interval | `30` | `chainchirp price --watch --interval 10` |
| `--currency <currency>` | Set currency for price display | `usd` | `chainchirp price --currency eur` |
| `--help` | Show command help | - | `chainchirp price --help` |
| `--version` | Show CLI version | - | `chainchirp --version` |

### Supported Currencies
`usd`, `eur`, `gbp`, `jpy`, `btc`, `eth`, `sats`

---

## Market Commands

### Price Command

Get current Bitcoin price and comprehensive market data with sub-second response times.

```bash
chainchirp price [options]
```

**Options:**
- `--detailed` - Show comprehensive market data including 24h high/low, trading volume, market cap, and all-time records

**Examples:**
```bash
# Basic price (fastest response)
chainchirp price

# Detailed market data
chainchirp price --detailed

# Different currency
chainchirp price --currency eur

# JSON output for automation
chainchirp price --json

# Real-time monitoring with 5-second updates
chainchirp price --watch --interval 5
```

**Sample Output:**
```
✓ Bitcoin Price
  $107,263.50

  ◦ Updated: Dec 16 at 14:23
  ◦ Latency: 127ms
  ◦ Provider: CoinGecko
```

**Detailed Output:**
```
✓ Bitcoin Market Data
  Current Price: $107,263.50

  ◦ 24h High: $108,450.25
  ◦ 24h Low: $106,180.75
  ◦ 24h Volume: $32.05B USD
  ◦ Market Cap: $2.12T USD
  ◦ Market Cap Rank: #1

  ◦ All-Time High: $108,363.67 (Dec 17, 2024)
  ◦ All-Time Low: $67.81 (Jul 5, 2013)
  ◦ From ATH: -1.01%
  ◦ From ATL: +158,143.22%

  ◦ Updated: Dec 16 at 14:23
  ◦ Latency: 203ms
  ◦ Provider: CoinGecko
```

---

### Volume Command

Get Bitcoin 24-hour trading volume data across all major exchanges with real-time updates.

```bash
chainchirp volume [options]
```

**Examples:**
```bash
# Current trading volume
chainchirp volume

# Monitor volume changes
chainchirp volume --watch

# Volume in different currency
chainchirp volume --currency eur

# JSON format for integration
chainchirp volume --json
```

**Sample Output:**
```
✓ Bitcoin 24h Volume
  32.05B USD

  ◦ 24h Change: +0.40B (+1.25%)
  ◦ Volume Rank: #1
  ◦ Updated: Dec 16 at 14:23
  ◦ Latency: 158ms
  ◦ Provider: CoinGecko
```

---

### Change Command

Get Bitcoin price changes over different time periods with trend analysis.

```bash
chainchirp change [options]
```

**Options:**
- `--detailed` - Show extended time periods (7d, 30d, 1y changes)

**Examples:**
```bash
# Basic changes (1h, 24h)
chainchirp change

# Detailed changes (1h, 24h, 7d, 30d, 1y)
chainchirp change --detailed

# Monitor price changes live
chainchirp change --watch --detailed

# Export change data
chainchirp change --detailed --json > bitcoin_changes.json
```

**Sample Output:**
```
✓ Bitcoin Price Changes
  Current: $107,263.50

  ◦ 1 Hour: +$425.75 (+0.40%)
  ◦ 24 Hours: -$987.25 (-0.91%)

  ◦ Updated: Dec 16 at 14:23
  ◦ Latency: 142ms
  ◦ Provider: CoinGecko
```

**Detailed Output:**
```
✓ Bitcoin Price Changes
  Current: $107,263.50

  ◦ 1 Hour: +$425.75 (+0.40%)
  ◦ 24 Hours: -$987.25 (-0.91%)
  ◦ 7 Days: +$3,420.50 (+3.29%)
  ◦ 30 Days: +$8,750.25 (+8.89%)
  ◦ 1 Year: +$65,432.10 (+156.42%)

  ◦ Updated: Dec 16 at 14:23
  ◦ Latency: 189ms
  ◦ Provider: CoinGecko
```

---

### High/Low Command

Get Bitcoin high and low prices for 24h period and all-time records with percentage calculations.

```bash
chainchirp highlow [options]
# Alias: chainchirp hl [options]
```

**Examples:**
```bash
# Basic high/low data
chainchirp highlow

# Using short alias
chainchirp hl

# Monitor high/low changes
chainchirp hl --watch

# JSON output for alerts
chainchirp highlow --json
```

**Sample Output:**
```
✓ Bitcoin High/Low Prices
  Current: $107,263.50

  ◦ 24h High: $108,450.25
  ◦ 24h Low: $106,180.75
  ◦ 24h Range: $2,269.50 (2.13%)

  ◦ All-Time High: $108,363.67 (Dec 17, 2024)
  ◦ All-Time Low: $67.81 (Jul 5, 2013)
  ◦ From ATH: -1.01% (-$1,100.17)
  ◦ From ATL: +158,143.22% (+$107,195.69)

  ◦ Updated: Dec 16 at 14:23
  ◦ Latency: 165ms
  ◦ Provider: CoinGecko
```

---

### Sparkline Command

Generate ASCII price charts for visual trend analysis with customizable dimensions and timeframes.

```bash
chainchirp sparkline [options]
# Alias: chainchirp spark [options]
```

**Options:**
- `--timeframe <timeframe>` - Time period for chart (`1h`, `24h`, `7d`, `30d`) [default: `24h`]
- `--width <width>` - Chart width in characters [default: `40`]
- `--height <height>` - Chart height in characters [default: `8`]

**Examples:**
```bash
# Default 24h chart
chainchirp sparkline

# 7-day chart with custom dimensions
chainchirp spark --timeframe 7d --width 60 --height 12

# 1-hour micro-trends
chainchirp sparkline --timeframe 1h --width 30

# Live chart updates
chainchirp spark --watch --timeframe 24h

# Large 30-day overview
chainchirp sparkline --timeframe 30d --width 80 --height 15
```

**Sample Output:**
```
✓ Bitcoin 24H Price Chart

  ▄▅▆▇█▇▆▅▄▃▃▄▅▆▇▇▆▅▄▃▂▃▄▅▆▇▇▆▅▄▃▃▄▅▆▇▇▆▅

  ◦ Timeframe: 24H
  ◦ Start: $106,850.25
  ◦ End: $107,263.50
  ◦ Change: +$413.25 (+0.39%)
  ◦ High: $108,450.25
  ◦ Low: $106,180.75
  ◦ Data Points: 144

  ◦ Updated: Dec 16 at 14:23
  ◦ Latency: 298ms
  ◦ Provider: CoinGecko
```

**7-Day Chart Output:**
```
✓ Bitcoin 7D Price Chart

  ▃▃▄▄▅▅▆▆▇▇██▇▇▆▆▅▅▄▄▃▃▂▂▃▃▄▄▅▅▆▆▇▇██▇▇▆▆▅▅▄▄▃▃▂▂▃▃▄▄▅▅▆▆▇▇██▇▇▆▆

  ◦ Timeframe: 7D
  ◦ Start: $104,892.75
  ◦ End: $107,263.50
  ◦ Change: +$2,370.75 (+2.26%)
  ◦ High: $108,450.25
  ◦ Low: $103,250.50
  ◦ Data Points: 168

  ◦ Updated: Dec 16 at 14:23
  ◦ Latency: 445ms
  ◦ Provider: CoinGecko
```

---

## Multi-API Reliability

ChainChirp uses a sophisticated 6-provider API system with automatic failover to ensure maximum uptime and data accuracy:

### API Providers (Priority Order)
1. **CoinGecko** (Primary) - 30 req/min, highest data quality
2. **CoinMarketCap** - 333 req/min, comprehensive data
3. **CoinAPI** - 100 req/min, institutional grade
4. **Binance** - 1200 req/min, real-time exchange data
5. **Coinbase** - 10000 req/min, high-frequency updates
6. **Kraken** - 60 req/min, backup provider

### Features
- ✓ **Automatic failover** - Seamless switching on rate limits or errors
- ✓ **Response normalization** - Consistent data format across providers
- ✓ **Health monitoring** - Real-time provider status tracking
- ✓ **Rate limit management** - Per-provider request throttling
- ✓ **Sub-second response times** - Optimized for speed
- ✓ **99.9% uptime** - Multiple fallback options

### Provider Selection
The system automatically selects the best available provider based on:
- Current rate limit status
- Historical response times
- Data freshness requirements
- Provider health metrics

---

## Output Formats

### Human-Readable (Default)
Clean, formatted output with colors, symbols, and provider information for easy reading.

### JSON Format
Machine-readable JSON output perfect for automation, monitoring, and integration:

```bash
chainchirp price --json
```

```json
{
  "price": 107263.50,
  "currency": "USD", 
  "change24h": -987.25,
  "changePercent24h": -0.91,
  "timestamp": "2024-12-16T14:23:45.123Z",
  "provider": "CoinGecko",
  "executionTime": 127
}
```

**Volume JSON Example:**
```json
{
  "volume24h": 32051234567.89,
  "currency": "USD",
  "change24h": 401234567.12,
  "changePercent24h": 1.25,
  "rank": 1,
  "timestamp": "2024-12-16T14:23:45.123Z",
  "provider": "CoinGecko",
  "executionTime": 158
}
```

---

## Watch Mode

All commands support real-time monitoring with automatic updates and intelligent refresh management.

**Basic Usage:**
```bash
chainchirp <command> --watch
```

**Custom Interval:**
```bash
chainchirp <command> --watch --interval <seconds>
```

**Features:**
- ✓ **Smart refresh** - Auto-clear screen for clean updates
- ✓ **Change indicators** - Highlight differences between updates
- ✓ **Graceful shutdown** - Clean exit with `Ctrl+C`
- ✓ **Error resilience** - Continues running on API failures
- ✓ **Multi-format support** - Works with both human and JSON output
- ✓ **Bandwidth optimization** - Efficient API usage

**Watch Mode Examples:**
```bash
# Price monitoring with 5-second updates
chainchirp price --watch --interval 5

# Live volume tracking
chainchirp volume --watch

# Real-time sparkline chart
chainchirp sparkline --watch --timeframe 1h

# JSON stream for external monitoring
chainchirp price --watch --json --interval 10 > price_stream.jsonl
```

---

## Examples

### Basic Usage
```bash
# Get current Bitcoin price
chainchirp price

# Show detailed market data
chainchirp price --detailed

# Check trading volume
chainchirp volume

# See price changes
chainchirp change --detailed

# View high/low prices
chainchirp hl

# Generate price chart
chainchirp spark --timeframe 7d
```

### Advanced Usage
```bash
# Monitor price in EUR with 5-second updates
chainchirp price --currency eur --watch --interval 5

# Generate comprehensive 30-day chart
chainchirp sparkline --timeframe 30d --width 80 --height 15

# Export all market data for analysis
chainchirp price --detailed --json > market_data.json

# Live volume monitoring with alerts
chainchirp volume --watch --json | jq -r 'select(.volume24h > 50000000000)'
```

### Integration Examples
```bash
# Extract specific price data
chainchirp price --json | jq '.price'

# Save historical chart data
chainchirp sparkline --json --timeframe 7d > chart_data.json

# Price alert system
chainchirp price --json | jq -r '.price' | awk '$1 > 110000 { print "🚨 Price alert: $" $1 }'

# Volume threshold monitoring  
chainchirp volume --json | jq -r 'select(.volume24h > 40000000000) | "High volume: \(.volume24h)"'
```

### Automation Examples
```bash
# Continuous price logging
while true; do
  echo "$(date): $(chainchirp price --json | jq -r '.price')" >> price_log.txt
  sleep 60
done

# Market data collection
chainchirp price --detailed --json | jq '{
  price: .price,
  volume: .volume24h,
  change: .changePercent24h,
  timestamp: .timestamp
}' >> market_history.jsonl

# Real-time alert system
chainchirp price --watch --json --interval 30 | while read line; do
  price=$(echo $line | jq -r '.price')
  if (( $(echo "$price > 110000" | bc -l) )); then
    echo "🚨 Bitcoin above $110k: $price"
  fi
done
```

### Dashboard Creation
```bash
# Create a simple dashboard
watch -n 5 '
  echo "=== Bitcoin Dashboard ==="
  chainchirp price --detailed
  echo ""
  chainchirp volume
  echo ""
  chainchirp spark --timeframe 24h --width 60
'
```

---

## Command Summary

| Command | Purpose | Alias | Key Options | Response Time |
|---------|---------|-------|-------------|---------------|
| `price` | Current Bitcoin price + market data | - | `--detailed` | <200ms |
| `volume` | 24h trading volume analysis | - | - | <250ms |
| `change` | Price changes over time periods | - | `--detailed` | <200ms |
| `highlow` | Daily + all-time high/low prices | `hl` | - | <300ms |
| `sparkline` | ASCII price charts | `spark` | `--timeframe`, `--width`, `--height` | <500ms |

**Global Options:** All commands support `--json`, `--watch`, `--interval`, `--currency`, and `--help`

---

## Performance & Reliability

### Response Times
- **Price**: < 200ms average
- **Volume**: < 250ms average  
- **Change**: < 200ms average
- **HighLow**: < 300ms average
- **Sparkline**: < 500ms average

### Uptime Guarantee
- **99.9% availability** through multi-API fallback
- **Automatic failover** in <100ms
- **6 provider redundancy** 
- **Real-time health monitoring**

### Rate Limits
- **Combined capacity**: 11,000+ requests/minute
- **Intelligent load balancing** 
- **Per-provider throttling**
- **Usage optimization** for watch mode

---

## Getting Help

- `chainchirp --help` - Show general help and command list
- `chainchirp <command> --help` - Show command-specific help and options
- `chainchirp --version` - Show version information

**Example Help Outputs:**
```bash
# General help
chainchirp --help

# Specific command help  
chainchirp price --help
chainchirp sparkline --help
```

For more information, issues, and feature requests:
**GitHub**: [https://github.com/your-repo/chainchirp-cli](https://github.com/your-repo/chainchirp-cli)

---

*Built with ❤️ for the Bitcoin community. Powered by 6 reliable API providers.*
