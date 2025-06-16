# ChainChirp CLI Commands

A comprehensive guide to all available ChainChirp commands for Bitcoin ecosystem data.

## Table of Contents

- [Global Options](#global-options)
- [Market Commands](#market-commands)
  - [Price Command](#price-command)
  - [Volume Command](#volume-command)
  - [Change Command](#change-command)
  - [High/Low Command](#highlow-command)
  - [Sparkline Command](#sparkline-command)
- [Output Formats](#output-formats)
- [Watch Mode](#watch-mode)
- [Examples](#examples)

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

Get current Bitcoin price and market data.

```bash
chainchirp price [options]
```

**Options:**
- `--detailed` - Show comprehensive market data including 24h high/low, volume, market cap, and all-time records

**Examples:**
```bash
# Basic price
chainchirp price

# Detailed market data
chainchirp price --detailed

# Different currency
chainchirp price --currency eur

# JSON output
chainchirp price --json

# Watch mode
chainchirp price --watch --interval 15
```

**Sample Output:**
```
✓ Bitcoin Price
  $107,644.00

  ◦ Updated: Jun 16 at 18:09
  ◦ Latency: 151ms
```

---

### Volume Command

Get Bitcoin 24-hour trading volume data.

```bash
chainchirp volume [options]
```

**Examples:**
```bash
# Basic volume
chainchirp volume

# Watch volume changes
chainchirp volume --watch

# JSON format
chainchirp volume --json --currency eur
```

**Sample Output:**
```
✓ Bitcoin 24h Volume
  34.5B USD

  ◦ 24h Change: +2.1B (+6.47%)
  ◦ Updated: Jun 16 at 18:09
  ◦ Latency: 203ms
```

---

### Change Command

Get Bitcoin price changes over different time periods.

```bash
chainchirp change [options]
```

**Options:**
- `--detailed` - Show extended time periods (7d, 30d changes)

**Examples:**
```bash
# Basic changes (1h, 24h)
chainchirp change

# Detailed changes (1h, 24h, 7d, 30d)
chainchirp change --detailed

# Watch price changes
chainchirp change --watch --detailed
```

**Sample Output:**
```
✓ Bitcoin Price Changes
  Current: $107,644.00

  ◦ 1 Hour: +$324.50 (+0.30%)
  ◦ 24 Hours: -$1,250.75 (-1.15%)
  ◦ 7 Days: +$3,420.00 (+3.28%)     # --detailed only
  ◦ 30 Days: +$8,750.25 (+8.85%)    # --detailed only

  ◦ Latency: 187ms
```

---

### High/Low Command

Get Bitcoin high and low prices for 24h period and all-time records.

```bash
chainchirp highlow [options]
# Alias: chainchirp hl [options]
```

**Examples:**
```bash
# Basic high/low data
chainchirp highlow

# Using alias
chainchirp hl

# Watch high/low changes
chainchirp hl --watch

# JSON output
chainchirp highlow --json
```

**Sample Output:**
```
✓ Bitcoin High/Low Prices
  Current: $107,644.00

  ◦ 24h High: $109,250.00
  ◦ 24h Low: $106,180.00

  ◦ All-Time High: $108,363.67 (Dec 17 at 15:30)
  ◦ All-Time Low: $67.81 (Jul 5 at 09:47)
  ◦ From ATH: -0.66%
  ◦ From ATL: +158,743.56%

  ◦ Latency: 165ms
```

---

### Sparkline Command

Generate ASCII price charts for visual trend analysis.

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

# 1-hour chart
chainchirp sparkline --timeframe 1h --width 30

# Watch live chart updates
chainchirp spark --watch --timeframe 24h
```

**Sample Output:**
```
✓ Bitcoin 7D Price Chart

  ▆███▇████▇▆▆▅▆▃▁▂▃▃▂▂▂▂▃▃▃▃▃▄▄

  ◦ Period: 7D
  ◦ Start: $108,363.67
  ◦ End: $107,815.77
  ◦ Change: -547.90 (-0.51%)
  ◦ Points: 168

  ◦ Latency: 233ms
```

---

## Output Formats

### Human-Readable (Default)
Clean, formatted output with colors and symbols for easy reading.

### JSON Format
Machine-readable JSON output perfect for integration with other tools:

```bash
chainchirp price --json
```

```json
{
  "price": 107644.00,
  "currency": "USD",
  "timestamp": "2024-06-16T18:09:15.123Z",
  "executionTime": 151
}
```

---

## Watch Mode

All commands support real-time monitoring with automatic updates.

**Basic Usage:**
```bash
chainchirp <command> --watch
```

**Custom Interval:**
```bash
chainchirp <command> --watch --interval <seconds>
```

**Features:**
- ✓ Auto-refresh at specified intervals
- ✓ Clear screen for clean updates (terminal mode)
- ✓ Change indicators between updates
- ✓ Graceful shutdown with `Ctrl+C`
- ✓ Works with all output formats

**Watch Mode Examples:**
```bash
# Price updates every 10 seconds
chainchirp price --watch --interval 10

# Live volume monitoring
chainchirp volume --watch

# Real-time sparkline chart
chainchirp sparkline --watch --timeframe 1h
```

---

## Examples

### Basic Usage
```bash
# Get current Bitcoin price
chainchirp price

# Show trading volume
chainchirp volume

# See price changes
chainchirp change --detailed
```

### Advanced Usage
```bash
# Monitor price in EUR with 5-second updates
chainchirp price --currency eur --watch --interval 5

# Generate large 30-day chart
chainchirp sparkline --timeframe 30d --width 80 --height 15

# Get all data in JSON for external processing
chainchirp price --detailed --json > bitcoin_data.json
```

### Integration Examples
```bash
# Pipe to jq for specific data extraction
chainchirp price --json | jq '.price'

# Save historical chart data
chainchirp sparkline --json --timeframe 7d > chart_data.json

# Monitor alerts (combine with other tools)
chainchirp price --json | jq -r '.price' | awk '$1 > 110000 { print "Price alert: $" $1 }'
```

### Automation Examples
```bash
# Price logging every minute
while true; do
  echo "$(date): $(chainchirp price --json | jq -r '.price')" >> price_log.txt
  sleep 60
done

# Volume monitoring script
chainchirp volume --watch --json | jq -r '.volume24h' | while read vol; do
  if [ "$vol" -gt 50000000000 ]; then
    echo "High volume alert: $vol"
  fi
done
```

---

## Command Summary

| Command | Purpose | Alias | Key Options |
|---------|---------|-------|-------------|
| `price` | Current Bitcoin price | - | `--detailed` |
| `volume` | 24h trading volume | - | - |
| `change` | Price changes over time | - | `--detailed` |
| `highlow` | High/low prices + ATH/ATL | `hl` | - |
| `sparkline` | ASCII price charts | `spark` | `--timeframe`, `--width`, `--height` |

**Note:** All commands support `--json`, `--watch`, `--interval`, `--currency`, and `--help` options.

---

## Getting Help

- `chainchirp --help` - Show general help
- `chainchirp <command> --help` - Show command-specific help
- `chainchirp --version` - Show version information

For more detailed information, visit: [https://github.com/your-repo/chainchirp-cli](https://github.com/your-repo/chainchirp-cli)
