import chalk from 'chalk'

// =============================================================================
// Help Decorator Types
// =============================================================================

export interface HelpOptions {
  name       : string
  description: string
  usage?     : string
  examples?  : string[]
  aliases?   : string[]
  options?   : CommandOption[]
}

export interface CommandOption {
  flags        : string
  description  : string
  defaultValue?: any
}

// =============================================================================
// Help Formatting Functions
// =============================================================================

export function formatCommandHelp(options: HelpOptions): string {
  const lines: string[] = []
  
  // Command name and description
  lines.push(chalk.cyan.bold(`${options.name.toUpperCase()} COMMAND`))
  lines.push('')
  lines.push(chalk.white(options.description))
  lines.push('')
  
  // Usage
  if (options.usage) {
    lines.push(chalk.yellow.bold('USAGE:'))
    lines.push(`  ${chalk.green(options.usage)}`)
    lines.push('')
  }
  
  // Aliases
  if (options.aliases && options.aliases.length > 0) {
    lines.push(chalk.yellow.bold('ALIASES:'))
    lines.push(`  ${options.aliases.join(', ')}`)
    lines.push('')
  }
  
  // Options
  if (options.options && options.options.length > 0) {
    lines.push(chalk.yellow.bold('OPTIONS:'))
    
    // Calculate padding for alignment
    const maxFlagsLength = Math.max(...options.options.map(opt => opt.flags.length))
    
    options.options.forEach(option => {
      const flags = option.flags.padEnd(maxFlagsLength)
      const defaultText = option.defaultValue ? chalk.gray(` [default: ${option.defaultValue}]`) : ''
      lines.push(`  ${chalk.green(flags)}  ${option.description}${defaultText}`)
    })
    lines.push('')
  }
  
  // Examples
  if (options.examples && options.examples.length > 0) {
    lines.push(chalk.yellow.bold('EXAMPLES:'))
    options.examples.forEach(example => {
      lines.push(`  ${chalk.green(example)}`)
    })
    lines.push('')
  }
  
  return lines.join('\n')
}

export function formatGlobalHelp(): string {
  const lines: string[] = []
  
  lines.push(chalk.cyan.bold('CHAINCHIRP - BITCOIN ECOSYSTEM CLI'))
  lines.push('')
  lines.push(chalk.white('A comprehensive command-line tool for Bitcoin price tracking,'))
  lines.push(chalk.white('blockchain analysis, and market insights.'))
  lines.push('')
  
  lines.push(chalk.yellow.bold('GLOBAL OPTIONS:'))
  lines.push(`  ${chalk.green('--json')}              Output data in JSON format`)
  lines.push(`  ${chalk.green('--watch')}             Enable real-time watch mode`)
  lines.push(`  ${chalk.green('--interval <seconds>')} Set watch mode update interval ${chalk.gray('[default: 30]')}`)
  lines.push(`  ${chalk.green('--currency <currency>')} Set currency (usd, eur, gbp, etc.) ${chalk.gray('[default: usd]')}`)
  lines.push(`  ${chalk.green('--help')}              Show help information`)
  lines.push(`  ${chalk.green('--version')}           Show version information`)
  lines.push('')
  
  lines.push(chalk.yellow.bold('MARKET COMMANDS:'))
  lines.push(`  ${chalk.green('price')}               Get current Bitcoin price`)
  lines.push(`  ${chalk.green('volume')}              Get trading volume data`)
  lines.push(`  ${chalk.green('change')}              Get price change information`)
  lines.push(`  ${chalk.green('highlow')}             Get high/low price data`)
  lines.push(`  ${chalk.green('sparkline')}           Generate ASCII price charts`)
  lines.push('')
  
  lines.push(chalk.yellow.bold('CHAIN COMMANDS:'))
  lines.push(`  ${chalk.green('block')}               Get blockchain block information`)
  lines.push(`  ${chalk.green('mempool')}             Get mempool status and analysis`)
  lines.push(`  ${chalk.green('fees')}                Get transaction fee estimates`)
  lines.push(`  ${chalk.green('hashrate')}            Get network hashrate data`)
  lines.push(`  ${chalk.green('halving')}             Get Bitcoin halving countdown`)
  lines.push('')
  
  lines.push(chalk.gray('Run "chainchirp <command> --help" for more information on a specific command.'))
  lines.push('')
  
  return lines.join('\n')
}

// =============================================================================
// Help Decorator
// =============================================================================

export function withHelp<T extends Record<string, any>>(
  helpOptions: HelpOptions
) {
  return function(target: (options: T) => Promise<void>) {
    return async function(options: T & { help?: boolean }) {
      // Show help if requested
      if (options.help) {
        console.log(formatCommandHelp(helpOptions))
        return
      }
      
      // Execute original command
      return target(options)
    }
  }
}

// =============================================================================
// Help Utilities
// =============================================================================

export function createStandardOptions(): CommandOption[] {
  return [
    {
      flags      : '--json',
      description: 'Output data in JSON format for automation'
    },
    {
      flags      : '--watch',
      description: 'Enable real-time watch mode with automatic updates'
    },
    {
      flags       : '--interval <seconds>',
      description : 'Set watch mode update interval in seconds',
      defaultValue: 30
    },
    {
      flags       : '--currency <currency>',
      description : 'Set currency for price display (usd, eur, gbp, etc.)',
      defaultValue: 'usd'
    },
    {
      flags      : '--help',
      description: 'Show this help message'
    }
  ]
}
