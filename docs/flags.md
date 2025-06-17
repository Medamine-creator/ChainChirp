# Command Line Flags

Complete reference for all ChainChirp CLI flags and options.

## Global Flags

Available across all commands:

| Flag | Short | Type | Default | Description | Example |
|------|-------|------|---------|-------------|---------|
| `--json` | - | boolean | `false` | Output data in JSON format | `chainchirp price --json` |
| `--watch` | - | boolean | `false` | Enable real-time updates | `chainchirp price --watch` |
| `--interval` | - | number | `30` | Watch mode update interval (seconds) | `chainchirp price --watch --interval 10` |
| `--currency` | - | string | `usd` | Display currency | `chainchirp price --currency eur` |
| `--help` | `-h` | boolean | `false` | Show help information | `chainchirp price --help` |
| `--version` | `-v` | boolean | `false` | Show version number | `chainchirp --version` |

## Supported Currencies

Valid values for `--currency`:

| Currency | Code | Example |
|----------|------|---------|
| US Dollar | `usd` | `--currency usd` |
| Euro | `eur` | `--currency eur` |
| British Pound | `gbp` | `--currency gbp` |
| Japanese Yen | `jpy` | `--currency jpy` |
| Bitcoin | `btc` | `--currency btc` |
| Ethereum | `eth` | `--currency eth` |
| Satoshis | `sats` | `--currency sats` |

## Market Command Flags

### price
| Flag | Type | Default | Description | Example |
|------|------|---------|-------------|---------|
| `--detailed` | boolean | `false` | Show comprehensive market data | `chainchirp price --detailed` |

### change
| Flag | Type | Default | Description | Example |
|------|------|---------|-------------|---------|
| `--detailed` | boolean | `false` | Show extended time periods (7d, 30d) | `chainchirp change --detailed` |

### sparkline
| Flag | Type | Default | Description | Example |
|------|------|---------|-------------|---------|
| `--timeframe` | string | `24h` | Time period for chart | `chainchirp sparkline --timeframe 7d` |
| `--width` | number | `40` | Chart width in characters | `chainchirp sparkline --width 60` |
| `--height` | number | `8` | Chart height in characters | `chainchirp sparkline --height 12` |

#### Timeframe Options
- `1h` - 1 hour
- `24h` - 24 hours (default)
- `7d` - 7 days
- `30d` - 30 days

## Chain Command Flags

### block
| Flag | Type | Default | Description | Example |
|------|------|---------|-------------|---------|
| `--recent` | number | - | Show N recent blocks | `chainchirp block --recent 5` |
| `--hash` | string | - | Get specific block by hash | `chainchirp block --hash 000000...` |

### mempool
| Flag | Type | Default | Description | Example |
|------|------|---------|-------------|---------|
| `--detailed` | boolean | `false` | Show fee histogram and analysis | `chainchirp mempool --detailed` |

### fees
| Flag | Type | Default | Description | Example |
|------|------|---------|-------------|---------|
| `--history` | number | - | Show fee history for N hours | `chainchirp fees --history 24` |

## Command Aliases

Some commands have shorter aliases:

| Command | Alias | Example |
|---------|-------|---------|
| `highlow` | `hl` | `chainchirp hl` |
| `sparkline` | `spark` | `chainchirp spark` |

## Flag Combinations

### Common Patterns

```bash
# Real-time price monitoring in EUR
chainchirp price --watch --currency eur --interval 5

# Detailed market data as JSON
chainchirp price --detailed --json

# Live 7-day price chart
chainchirp sparkline --timeframe 7d --watch --width 80

# Monitor mempool congestion
chainchirp mempool --detailed --watch --interval 15

# Fee history with real-time updates
chainchirp fees --history 12 --watch
```

### Output Formats

#### Default Format
```bash
chainchirp price
# ✓ Bitcoin Price
#   $107,263.50
```

#### JSON Format
```bash
chainchirp price --json
# {"price": 107263.50, "currency": "usd", "timestamp": "2024-12-16T19:23:00Z"}
```

#### Watch Mode
```bash
chainchirp price --watch
# Updates every 30 seconds with screen clearing
```

## Environment Variables

Flags can be set via environment variables:

| Environment Variable | Flag Equivalent | Example |
|---------------------|----------------|---------|
| `CHAINCHIRP_CURRENCY` | `--currency` | `export CHAINCHIRP_CURRENCY=eur` |
| `CHAINCHIRP_INTERVAL` | `--interval` | `export CHAINCHIRP_INTERVAL=10` |
| `CHAINCHIRP_JSON` | `--json` | `export CHAINCHIRP_JSON=true` |
| `CHAINCHIRP_NO_ICONS` | - | `export CHAINCHIRP_NO_ICONS=true` |
| `DEBUG` | - | `export DEBUG=1` |

## Validation Rules

### Intervals
- **Minimum**: 1 second
- **Maximum**: 3600 seconds (1 hour)
- **Recommended**: 5-60 seconds for most use cases

### Chart Dimensions
- **Width**: 10-200 characters
- **Height**: 3-50 characters
- **Optimal**: 40-80 width, 8-15 height

### Currency Codes
- Must be one of: `usd`, `eur`, `gbp`, `jpy`, `btc`, `eth`, `sats`
- Case-insensitive

### Block Hashes
- Must be valid 64-character hexadecimal string
- Case-insensitive

## Error Handling

### Invalid Flags
```bash
chainchirp price --invalid-flag
# Error: Unknown option '--invalid-flag'
```

### Invalid Values
```bash
chainchirp price --currency xyz
# Error: Invalid currency 'xyz'. Supported: usd, eur, gbp, jpy, btc, eth, sats
```

### Out of Range
```bash
chainchirp sparkline --width 500
# Error: Width must be between 10 and 200 characters
```

## Performance Tips

1. **Use JSON for scripts**: `--json` reduces parsing overhead
2. **Optimize intervals**: Shorter intervals increase API usage
3. **Limit chart size**: Smaller charts render faster
4. **Use aliases**: `hl` instead of `highlow` saves keystrokes

## Help System

Get help for any command:

```bash
# Global help
chainchirp --help

# Command-specific help
chainchirp price --help
chainchirp sparkline --help
chainchirp block --help
```

---

*See [Examples](./examples.md) for real-world flag usage patterns.*