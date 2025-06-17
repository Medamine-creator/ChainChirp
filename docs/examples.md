# Real-World Examples

**Practical usage scenarios for ChainChirp CLI in different environments.**

## Trading & Finance

### Price Monitoring Dashboard

Create a live Bitcoin dashboard for trading:

```bash
#!/bin/bash
# bitcoin-dashboard.sh

export CMC_API_KEY="your-api-key"

while true; do
    clear
    echo "=== Bitcoin Trading Dashboard ==="
    echo
    
    # Current price and market data
    chainchirp price --detailed
    echo
    
    # Price changes
    chainchirp change --detailed
    echo
    
    # Recent market volume
    chainchirp volume
    echo
    
    # Fee recommendations
    chainchirp fees
    echo
    
    echo "Last updated: $(date)"
    echo "Press Ctrl+C to exit"
    
    sleep 30
done
```

### Price Alert System

Set up automated price alerts:

```bash
#!/bin/bash
# price-alerts.sh

ALERT_HIGH=100000
ALERT_LOW=40000
LOG_FILE="/var/log/bitcoin-alerts.log"

while true; do
    price=$(chainchirp price --json | jq -r '.price')
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    if (( $(echo "$price > $ALERT_HIGH" | bc -l) )); then
        message="=¨ HIGH ALERT: Bitcoin price $price (above $ALERT_HIGH)"
        echo "[$timestamp] $message" >> $LOG_FILE
        
        # Send notifications
        osascript -e "display notification \"$message\" with title \"Bitcoin Alert\""
        # curl -X POST "https://api.slack.com/..." # Slack webhook
        
    elif (( $(echo "$price < $ALERT_LOW" | bc -l) )); then
        message="=É LOW ALERT: Bitcoin price $price (below $ALERT_LOW)"
        echo "[$timestamp] $message" >> $LOG_FILE
        
        # Send notifications
        osascript -e "display notification \"$message\" with title \"Bitcoin Alert\""
    fi
    
    sleep 300  # Check every 5 minutes
done
```

### Market Analysis Script

Analyze Bitcoin market trends:

```bash
#!/bin/bash
# market-analysis.sh

OUTPUT_DIR="/tmp/bitcoin-analysis"
DATE=$(date +%Y-%m-%d)

mkdir -p $OUTPUT_DIR

echo "=Ê Generating Bitcoin market analysis for $DATE..."

# Export market data
chainchirp price --detailed --json > "$OUTPUT_DIR/price-$DATE.json"
chainchirp change --detailed --json > "$OUTPUT_DIR/changes-$DATE.json"
chainchirp volume --json > "$OUTPUT_DIR/volume-$DATE.json"
chainchirp hl --json > "$OUTPUT_DIR/highlow-$DATE.json"

# Generate summary report
{
    echo "# Bitcoin Market Report - $DATE"
    echo
    echo "## Current Price"
    chainchirp price --detailed
    echo
    echo "## Price Changes"
    chainchirp change --detailed
    echo
    echo "## Trading Volume"
    chainchirp volume
    echo
    echo "## High/Low Analysis"
    chainchirp hl
} > "$OUTPUT_DIR/report-$DATE.md"

echo " Analysis saved to $OUTPUT_DIR"
```

## System Integration

### tmux Status Bar

Add Bitcoin price to your tmux status bar:

```bash
# Add to ~/.tmux.conf
set -g status-right '#(chainchirp price --json | jq -r "\"¿ $\" + (.price | tostring)") | %H:%M'

# Or for more detail
set -g status-right '#(chainchirp price --json | jq -r "\"¿ $\" + (.price | tostring) + \" (\" + (.change_24h | tostring) + \"%)\"") | %H:%M'
```

### Shell Prompt Integration

Add Bitcoin price to your shell prompt:

```bash
# Add to ~/.bashrc or ~/.zshrc
btc_price() {
    chainchirp price --json 2>/dev/null | jq -r '"¿$" + (.price | tostring)' || echo "¿--"
}

# For Bash
PS1='$(btc_price) \u@\h:\w$ '

# For Zsh
RPROMPT='$(btc_price)'
```

### OBS Studio Integration

Display live Bitcoin price in streaming software:

```bash
#!/bin/bash
# obs-bitcoin-overlay.sh

OUTPUT_FILE="/tmp/bitcoin-price.txt"

while true; do
    # Get price and format for overlay
    price=$(chainchirp price --json | jq -r '.price')
    change=$(chainchirp price --json | jq -r '.change_24h')
    
    if (( $(echo "$change > 0" | bc -l) )); then
        symbol="=È"
        color="green"
    else
        symbol="=É" 
        color="red"
    fi
    
    echo "¿ $$(printf "%.0f" $price) ${symbol} ${change}%" > $OUTPUT_FILE
    
    sleep 30
done

# In OBS: Add Text Source -> Read from File: /tmp/bitcoin-price.txt
```

## Development & DevOps

### CI/CD Pipeline Integration

Monitor Bitcoin price in your build pipeline:

```yaml
# .github/workflows/build.yml
name: Build with Bitcoin Price

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install ChainChirp
        run: npm install -g chainchirp
        
      - name: Log Bitcoin Price
        run: |
          echo "=Ê Bitcoin price during build:"
          chainchirp price --detailed
          
      - name: Run Tests
        run: npm test
        
      - name: Export Market Data
        if: github.ref == 'refs/heads/main'
        run: |
          chainchirp price --json > artifacts/btc-price.json
          chainchirp change --json > artifacts/btc-changes.json
```

### Docker Container

Run ChainChirp in a container:

```dockerfile
# Dockerfile
FROM node:18-alpine

RUN npm install -g chainchirp
WORKDIR /app

# Health check using ChainChirp
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD chainchirp price --json || exit 1

CMD ["chainchirp", "price", "--watch", "--interval", "60"]
```

```bash
# Build and run
docker build -t bitcoin-monitor .
docker run -d --name btc-price bitcoin-monitor

# View logs
docker logs -f btc-price
```

### API Gateway

Create a simple Bitcoin price API:

```javascript
// server.js
const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.get('/api/bitcoin/price', (req, res) => {
    exec('chainchirp price --json', (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ error: 'Failed to get price' });
            return;
        }
        
        try {
            const data = JSON.parse(stdout);
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: 'Invalid response' });
        }
    });
});

app.get('/api/bitcoin/market', (req, res) => {
    exec('chainchirp price --detailed --json', (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ error: 'Failed to get market data' });
            return;
        }
        
        try {
            const data = JSON.parse(stdout);
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: 'Invalid response' });
        }
    });
});

app.listen(port, () => {
    console.log(`Bitcoin API running at http://localhost:${port}`);
});
```

## System Administration

### Logging & Monitoring

Set up comprehensive Bitcoin data logging:

```bash
#!/bin/bash
# bitcoin-logger.sh

LOG_DIR="/var/log/bitcoin"
DATE=$(date +%Y-%m-%d)

mkdir -p $LOG_DIR

# Hourly price logging
log_price() {
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    chainchirp price --json | jq --arg ts "$timestamp" '. + {logged_at: $ts}' >> "$LOG_DIR/price-$DATE.jsonl"
}

# Daily market summary
daily_summary() {
    {
        echo "=== Bitcoin Daily Summary - $(date +%Y-%m-%d) ==="
        chainchirp price --detailed
        echo
        chainchirp change --detailed
        echo
        chainchirp volume
        echo
        chainchirp fees
    } > "$LOG_DIR/daily-summary-$DATE.txt"
}

# Network monitoring
network_monitor() {
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    {
        echo "[$timestamp] Block Info:"
        chainchirp block --json
        echo "[$timestamp] Mempool Status:"
        chainchirp mempool --detailed --json
        echo "[$timestamp] Network Hashrate:"
        chainchirp hashrate --json
    } >> "$LOG_DIR/network-$DATE.log"
}

# Run based on argument
case "$1" in
    "price") log_price ;;
    "daily") daily_summary ;;
    "network") network_monitor ;;
    *) echo "Usage: $0 {price|daily|network}" ;;
esac
```

### Cron Job Setup

Automate Bitcoin data collection:

```bash
# Add to crontab (crontab -e)

# Log price every hour
0 * * * * /usr/local/bin/chainchirp price --json >> /var/log/bitcoin/hourly-price.jsonl 2>&1

# Daily market summary at 9 AM
0 9 * * * /home/user/scripts/bitcoin-logger.sh daily

# Network monitoring every 15 minutes
*/15 * * * * /home/user/scripts/bitcoin-logger.sh network

# Weekly data cleanup (keep last 30 days)
0 2 * * 0 find /var/log/bitcoin -name "*.log" -mtime +30 -delete

# Monthly market report
0 8 1 * * /home/user/scripts/generate-monthly-report.sh
```

### System Health Monitoring

Integrate with system monitoring:

```bash
#!/bin/bash
# health-check.sh

# Check if Bitcoin price is reachable
if ! chainchirp price --json >/dev/null 2>&1; then
    echo "L Bitcoin price API unreachable"
    # Send alert to monitoring system
    curl -X POST "https://monitoring.example.com/alert" \
         -d '{"service": "bitcoin-api", "status": "down"}'
    exit 1
fi

# Check price variation (alert if >10% change)
price_change=$(chainchirp price --json | jq -r '.change_24h')
if (( $(echo "${price_change#-} > 10" | bc -l) )); then
    echo "   High Bitcoin volatility: ${price_change}%"
    # Send volatility alert
fi

echo " Bitcoin monitoring healthy"
```

## Data Analysis

### CSV Export for Spreadsheets

Export Bitcoin data for analysis:

```bash
#!/bin/bash
# csv-export.sh

OUTPUT_FILE="bitcoin-data-$(date +%Y-%m-%d).csv"

# CSV header
echo "timestamp,price,change_1h,change_24h,change_7d,volume_24h,market_cap" > $OUTPUT_FILE

# Collect data every hour for analysis
while true; do
    timestamp=$(date -u +"%Y-%m-%d %H:%M:%S")
    
    # Get detailed price data
    data=$(chainchirp price --detailed --json)
    
    price=$(echo $data | jq -r '.price')
    change_1h=$(echo $data | jq -r '.change_1h // 0')
    change_24h=$(echo $data | jq -r '.change_24h // 0')
    change_7d=$(echo $data | jq -r '.change_7d // 0')
    volume=$(echo $data | jq -r '.volume_24h // 0')
    market_cap=$(echo $data | jq -r '.market_cap // 0')
    
    echo "$timestamp,$price,$change_1h,$change_24h,$change_7d,$volume,$market_cap" >> $OUTPUT_FILE
    
    echo "=Ê Data logged: $timestamp - \$$price"
    sleep 3600  # Wait 1 hour
done
```

### Statistical Analysis

Calculate basic statistics:

```bash
#!/bin/bash
# bitcoin-stats.sh

echo "=È Bitcoin Price Statistics (Last 24 Hours)"
echo "============================================"

# Collect prices over time
prices=()
for i in {1..24}; do
    price=$(chainchirp price --json | jq -r '.price')
    prices+=($price)
    echo "Sample $i: \$$price"
    sleep 300  # 5 minutes between samples
done

# Calculate statistics using awk
printf '%s\n' "${prices[@]}" | awk '
{
    sum += $1
    prices[NR] = $1
}
END {
    mean = sum / NR
    
    # Calculate variance
    for (i = 1; i <= NR; i++) {
        variance += (prices[i] - mean) ^ 2
    }
    variance = variance / NR
    stddev = sqrt(variance)
    
    # Find min and max
    min = max = prices[1]
    for (i = 1; i <= NR; i++) {
        if (prices[i] < min) min = prices[i]
        if (prices[i] > max) max = prices[i]
    }
    
    printf "Mean: $%.2f\n", mean
    printf "Min: $%.2f\n", min  
    printf "Max: $%.2f\n", max
    printf "Range: $%.2f\n", max - min
    printf "Std Dev: $%.2f\n", stddev
    printf "Volatility: %.2f%%\n", (stddev / mean) * 100
}'
```

## Mobile & Remote Access

### SSH Bitcoin Command

Quick Bitcoin check over SSH:

```bash
# Add to ~/.bashrc on remote server
alias btc='chainchirp price'
alias btcw='chainchirp price --watch --interval 10'
alias btcj='chainchirp price --json | jq'

# Quick SSH check
ssh user@server "chainchirp price && chainchirp fees"
```

### Telegram Bot Integration

Send Bitcoin updates to Telegram:

```bash
#!/bin/bash
# telegram-bot.sh

BOT_TOKEN="your-bot-token"
CHAT_ID="your-chat-id"

send_telegram() {
    local message="$1"
    curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
         -d chat_id="$CHAT_ID" \
         -d text="$message" \
         -d parse_mode="Markdown"
}

# Send price updates every hour
while true; do
    price_data=$(chainchirp price --detailed)
    
    message="= *Bitcoin Update*
    
$price_data

_Updated: $(date)_"
    
    send_telegram "$message"
    sleep 3600
done
```

---

*These examples demonstrate the flexibility of ChainChirp CLI across different use cases. Adapt them to your specific needs and environment.*