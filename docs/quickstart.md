# Quick Start

**Get Bitcoin data in your terminal in 30 seconds.**

## Installation

```bash
npm install -g chainchirp
```

## First Command

```bash
chainchirp price
```

**Output:**
```
₿ Bitcoin (BTC)
$43,250.00 USD
```

## That's it!

You now have access to real-time Bitcoin data directly in your terminal.

## Essential Commands

### Get Current Price
```bash
chainchirp price
```

### Watch Price Updates
```bash  
chainchirp price --watch
```

### Get Market Details
```bash
chainchirp price --detailed
```

### Check Latest Blocks
```bash
chainchirp block
```

### Monitor Mempool
```bash
chainchirp mempool
```

### Get Fee Recommendations
```bash
chainchirp fees
```

## Pro Tips

**JSON Output for Automation**
```bash
chainchirp price --json | jq '.price'
```

**Custom Update Intervals**
```bash
chainchirp price --watch --interval 10
```

**Different Currencies**
```bash
chainchirp price --currency eur
```

## Need Help?

- Run `chainchirp --help` for command overview
- Run `chainchirp <command> --help` for specific command help
- Check the [FAQ](./faq.md) for common questions
- View [Examples](./examples.md) for real-world use cases

## What's Next?

- **[Configuration](./config.md)** - Set up API keys and customize behavior
- **[Command Reference](./commands.md)** - Explore all available commands
- **[Examples](./examples.md)** - Learn advanced usage patterns

---

*Ready to explore? Try `chainchirp --help` to see all available commands.*