# Command Flags Reference

**Complete guide to all ChainChirp CLI flags and options.**

## Global Flags

Available on all commands:

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--json` | - | boolean | `false` | Output data in JSON format for automation |
| `--watch` | - | boolean | `false` | Enable real-time updates with auto-refresh |
| `--interval` | - | number | `30` | Watch mode update interval (seconds) |
| `--currency` | - | string | `usd` | Display currency for prices |
| `--help` | `-h` | boolean | `false` | Show help information |
| `--version` | `-v` | boolean | `false` | Show version number |

## Currency Options

Valid values for `--currency` flag:

| Currency | Code | Description |
|----------|------|-------------|
| **US Dollar** | `usd` | Default currency |
| **Euro** | `eur` | European Union |
| **British Pound** | `gbp` | United Kingdom |
| **Japanese Yen** | `jpy` | Japan |
| **Bitcoin** | `btc` | Price in BTC |
| **Ethereum** | `eth` | Price in ETH |
| **Satoshis** | `sats` | Price in satoshis |

## Market Commands

### price - Current Bitcoin Price

```bash
chainchirp price [options]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--detailed` | boolean | `false` | Show comprehensive market data (volume, market cap, ATH) |

**Examples:**
```bash
chainchirp price                    # Simple price
chainchirp price --detailed         # Full market data
chainchirp price --watch --currency eur  # Live EUR price
```

### volume - Trading Volume

```bash
chainchirp volume [options]
```

Shows 24-hour trading volume. Uses global flags only.

### change - Price Changes

```bash
chainchirp change [options]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--detailed` | boolean | `false` | Show extended periods (7d, 30d, 1y) |

### highlow (alias: hl) - High/Low Prices

```bash
chainchirp highlow [options]
chainchirp hl [options]
```

Shows daily and all-time high/low prices. Uses global flags only.

### sparkline (alias: spark) - Price Charts

```bash
chainchirp sparkline [options]
chainchirp spark [options]
```

| Flag | Type | Default | Valid Values | Description |
|------|------|---------|--------------|-------------|
| `--timeframe` | string | `24h` | `1h`, `24h`, `7d`, `30d` | Chart time period |
| `--width` | number | `40` | `10-200` | Chart width in characters |
| `--height` | number | `8` | `3-50` | Chart height in characters |

**Examples:**
```bash
chainchirp spark --timeframe 7d --width 80    # Weekly chart
chainchirp spark --watch --interval 60        # Live chart
```

## Blockchain Commands

### block - Block Information

```bash
chainchirp block [options]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--recent` | number | - | Show N most recent blocks |
| `--hash` | string | - | Get specific block by hash (64-char hex) |

**Examples:**
```bash
chainchirp block                           # Latest block
chainchirp block --recent 5               # Last 5 blocks
chainchirp block --hash 000000000019d6... # Specific block
```

### mempool - Transaction Pool

```bash
chainchirp mempool [options]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--detailed` | boolean | `false` | Show fee histogram and analysis |

**Default watch interval:** 15 seconds

### fees - Transaction Fees

```bash
chainchirp fees [options]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--history` | number | - | Show fee history for N hours |

### hashrate - Network Security

```bash
chainchirp hashrate [options]
```

Shows network hashrate and difficulty. Uses global flags only.
**Default watch interval:** 60 seconds

### halving - Reward Halving

```bash
chainchirp halving [options]
```

Shows halving countdown and block rewards. Uses global flags only.
**Default watch interval:** 120 seconds

## Validation Rules

### Interval Limits

| Command Type | Min | Max | Default | Optimal Range |
|--------------|-----|-----|---------|---------------|
| **Market** (price, volume) | 5s | 3600s | 30s | 5-60s |
| **Mempool** | 5s | 300s | 15s | 10-30s |
| **Fees** | 10s | 600s | 30s | 15-60s |
| **Hashrate** | 30s | 3600s | 60s | 60-300s |
| **Halving** | 60s | 3600s | 120s | 120-600s |
| **Block** | 10s | 600s | 30s | 15-60s |

### Chart Dimensions

- **Width**: 10-200 characters (optimal: 40-80)
- **Height**: 3-50 characters (optimal: 8-15)
- **Terminal width**: Auto-detected and limited to available space

### Data Validation

- **Currency codes**: Case-insensitive, must be supported
- **Block hashes**: 64-character hexadecimal string
- **Numbers**: Must be valid integers within allowed ranges

## Usage Patterns

### Real-time Monitoring

```bash
# Live price in different currencies
chainchirp price --watch --currency eur --interval 10

# Monitor mempool congestion
chainchirp mempool --detailed --watch --interval 15

# Track fee estimates
chainchirp fees --watch --interval 30
```

### Data Export

```bash
# JSON for automation
chainchirp price --detailed --json | jq '.price'

# Historical data
chainchirp change --detailed --json > price-changes.json

# Block data export
chainchirp block --recent 10 --json > recent-blocks.json
```

### Visual Analysis

```bash
# Large price chart
chainchirp spark --timeframe 7d --width 100 --height 20

# Live chart monitoring
chainchirp spark --watch --timeframe 24h --interval 60

# Multiple timeframes
chainchirp spark --timeframe 1h && chainchirp spark --timeframe 24h
```

## Environment Variables

Override defaults with environment variables:

| Variable | Flag Equivalent | Example |
|----------|----------------|---------|
| `CHAINCHIRP_CURRENCY` | `--currency` | `export CHAINCHIRP_CURRENCY=eur` |
| `CHAINCHIRP_INTERVAL` | `--interval` | `export CHAINCHIRP_INTERVAL=10` |
| `CHAINCHIRP_JSON` | `--json` | `export CHAINCHIRP_JSON=true` |
| `DEBUG` | Debug mode | `export DEBUG=1` |
| `NO_COLOR` | Disable colors | `export NO_COLOR=1` |

## Output Formats

### Standard Output

```bash
$ chainchirp price
₿ Bitcoin (BTC)
$43,250.00 USD
```

### JSON Output

```bash
$ chainchirp price --json
{
  "symbol": "BTC",
  "name": "Bitcoin", 
  "price": 43250.00,
  "currency": "usd",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Watch Mode Output

```bash
$ chainchirp price --watch
# Screen clears and updates every 30 seconds
₿ Bitcoin (BTC)
$43,250.00 USD
Last updated: 10:30:15
```

## Error Handling

### Invalid Flags

```bash
$ chainchirp price --invalid
Error: Unknown option '--invalid'
Use 'chainchirp price --help' for usage information
```

### Invalid Values

```bash
$ chainchirp price --currency xyz
Error: Invalid currency 'xyz'
Supported currencies: usd, eur, gbp, jpy, btc, eth, sats
```

### Out of Range

```bash
$ chainchirp price --interval 0
Error: Interval must be between 5 and 3600 seconds
```

## Performance Tips

### Optimize for Speed

```bash
# Use JSON for scripting (faster parsing)
chainchirp price --json

# Disable colors for faster output
export NO_COLOR=1

# Use appropriate intervals
chainchirp price --watch --interval 60  # Not too frequent
```

### Reduce API Usage

```bash
# Longer intervals for less critical data
chainchirp hashrate --watch --interval 300

# Use cache effectively (subsequent calls within TTL)
chainchirp price  # Cache miss
chainchirp price  # Cache hit (within 30s)
```

## Help System

Get contextual help for any command:

```bash
# Global help
chainchirp --help

# Command help
chainchirp price --help
chainchirp sparkline --help

# List all commands
chainchirp --help | grep "Commands:"
```

---

*Ready to use these flags? Check out [Examples](./examples.md) for real-world usage scenarios.*