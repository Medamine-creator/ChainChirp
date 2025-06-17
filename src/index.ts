#!/usr/bin/env node

import { cac } from 'cac'
import chalk from 'chalk'
import {
  marketCommands,
  marketCommandDescriptions,
} from '@/commands/market'
import {
  chainCommands,
  chainCommandDescriptions,
} from '@/commands/chain'
import { PALETTE, symbol } from '@/utils/formatter'
import type { Currency, TimeFrame } from '@/types'

const cli = cac('chainchirp')

// =============================================================================
// Stripe/Vercel-Quality CLI Styling
// =============================================================================

function showStyledVersion(): void {
  const version = '1.0.1'
  const nodeVersion = process.version
  const platform = `${process.platform}-${process.arch}`
  
  console.log('')
  console.log(`${PALETTE.cyan('┌')} ${PALETTE.heading('ChainChirp')} ${PALETTE.muted(`v${version}`)}`)
  console.log(`${PALETTE.cyan('│')}`)
  console.log(`${PALETTE.cyan('│')} ${symbol('bitcoin')} ${PALETTE.primary('Professional Bitcoin CLI')}`)
  console.log(`${PALETTE.cyan('│')} ${PALETTE.muted(`${platform} • node ${nodeVersion}`)}`)
  console.log(`${PALETTE.cyan('└')}`)
  console.log('')
}

function showStyledHelp(): void {
  console.log('')
  console.log(`${PALETTE.cyan('┌')} ${PALETTE.heading('ChainChirp')} ${PALETTE.muted('v1.0.1')} ${symbol('bitcoin')}`)
  console.log(`${PALETTE.cyan('│')}`)
  console.log(`${PALETTE.cyan('│')} ${PALETTE.primary('Professional Bitcoin ecosystem CLI')}`)
  console.log(`${PALETTE.cyan('│')} ${PALETTE.muted('Real-time data, elegant terminal UX')}`)
  console.log(`${PALETTE.cyan('└')}`)
  console.log('')
  console.log(`${PALETTE.heading('Usage')}`)
  console.log(`  ${PALETTE.muted('$')} ${PALETTE.primary('chainchirp')} ${PALETTE.cyan('<command>')} ${PALETTE.muted('[options]')}`)
  console.log('')
  console.log(`${PALETTE.heading('Market Commands')}`)
  console.log(`  ${PALETTE.cyan('price')}      ${PALETTE.muted('Current Bitcoin price and market data')}`)
  console.log(`  ${PALETTE.cyan('volume')}     ${PALETTE.muted('24h trading volume across exchanges')}`)
  console.log(`  ${PALETTE.cyan('change')}     ${PALETTE.muted('Price changes over multiple periods')}`)
  console.log(`  ${PALETTE.cyan('highlow')}    ${PALETTE.muted('Daily and all-time price records')}`)
  console.log(`  ${PALETTE.cyan('sparkline')}  ${PALETTE.muted('ASCII price charts and trends')}`)
  console.log('')
  console.log(`${PALETTE.heading('Network Commands')}`)
  console.log(`  ${PALETTE.cyan('block')}      ${PALETTE.muted('Latest blocks and blockchain data')}`)
  console.log(`  ${PALETTE.cyan('mempool')}    ${PALETTE.muted('Transaction pool and congestion')}`)
  console.log(`  ${PALETTE.cyan('fees')}       ${PALETTE.muted('Transaction fee recommendations')}`)
  console.log(`  ${PALETTE.cyan('hashrate')}   ${PALETTE.muted('Network security and difficulty')}`)
  console.log(`  ${PALETTE.cyan('halving')}    ${PALETTE.muted('Next halving countdown and rewards')}`)
  console.log('')
  console.log(`${PALETTE.heading('Global Options')}`)
  console.log(`  ${PALETTE.cyan('--json')}               ${PALETTE.muted('JSON output for automation')}`)
  console.log(`  ${PALETTE.cyan('--watch')}              ${PALETTE.muted('Real-time updates')}`)
  console.log(`  ${PALETTE.cyan('--interval')} ${PALETTE.muted('<sec>')}     ${PALETTE.muted('Update frequency (default: 30)')}`)
  console.log(`  ${PALETTE.cyan('--currency')} ${PALETTE.muted('<code>')}    ${PALETTE.muted('Display currency (default: usd)')}`)
  console.log(`  ${PALETTE.cyan('-h, --help')}          ${PALETTE.muted('Show help information')}`)
  console.log(`  ${PALETTE.cyan('-v, --version')}       ${PALETTE.muted('Show version number')}`)
  console.log('')
  console.log(`${PALETTE.heading('Examples')}`)
  console.log(`  ${PALETTE.muted('$')} ${PALETTE.primary('chainchirp price')} ${PALETTE.muted('--detailed')}`)
  console.log(`  ${PALETTE.muted('$')} ${PALETTE.primary('chainchirp fees')} ${PALETTE.muted('--watch --interval 15')}`)
  console.log(`  ${PALETTE.muted('$')} ${PALETTE.primary('chainchirp sparkline')} ${PALETTE.muted('--width 60 --timeframe 7d')}`)
  console.log(`  ${PALETTE.muted('$')} ${PALETTE.primary('chainchirp price')} ${PALETTE.muted('--currency eur --json')}`)
  console.log('')
  console.log(`${PALETTE.muted('Learn more:')} ${PALETTE.cyan('https://github.com/chainchirp/cli')}`)
  console.log('')
}

// =============================================================================
// CLI Configuration
// =============================================================================

// =============================================================================
// Global Options
// =============================================================================

cli.option('--json', 'Output data in JSON format for automation and integration')
cli.option('--watch', 'Enable real-time watch mode with automatic updates')
cli.option('--interval <seconds>', 'Set watch mode update interval in seconds', { default: 30 })
cli.option('--currency <currency>', 'Set currency for price display (usd, eur, gbp, jpy, btc, eth, sats)', { default: 'usd' })

// =============================================================================
// Market Commands
// =============================================================================

// Price command
cli
  .command('price', marketCommandDescriptions.price.description)
  .option('--detailed', 'Show comprehensive market data including 24h high/low, volume, market cap, and all-time records')
  .action(async (options) => {
    try {
      if (options.detailed) {
        const { detailedPriceCommand } = await import('@/commands/market/price')
        await detailedPriceCommand({
          currency: options.currency as Currency,
          json    : options.json,
          watch   : options.watch,
          interval: parseInt(options.interval) || 30,
        })
      } else {
        await marketCommands.price({
          currency: options.currency as Currency,
          json    : options.json,
          watch   : options.watch,
          interval: parseInt(options.interval) || 30,
        })
      }
    } catch (error) {
      console.error(chalk.red('✕ Price command failed:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// Volume command
cli
  .command('volume', marketCommandDescriptions.volume.description)
  .action(async (options) => {
    try {
      await marketCommands.volume({
        currency: options.currency as Currency,
        json    : options.json,
        watch   : options.watch,
        interval: parseInt(options.interval) || 30,
      })
    } catch (error) {
      console.error(chalk.red('✕ Volume command failed:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// Change command
cli
  .command('change', marketCommandDescriptions.change.description)
  .option('--detailed', 'Show extended time periods (7d, 30d)')
  .action(async (options) => {
    try {
      await marketCommands.change({
        currency: options.currency as Currency,
        json    : options.json,
        watch   : options.watch,
        interval: parseInt(options.interval) || 30,
        detailed: options.detailed,
      })
    } catch (error) {
      console.error(chalk.red('✕ Change command failed:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// High/Low command
cli
  .command('highlow', marketCommandDescriptions.highlow.description)
  .alias('hl')
  .action(async (options) => {
    try {
      await marketCommands.highlow({
        currency: options.currency as Currency,
        json    : options.json,
        watch   : options.watch,
        interval: parseInt(options.interval) || 30,
      })
    } catch (error) {
      console.error(chalk.red('✕ HighLow command failed:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// Sparkline command
cli
  .command('sparkline', marketCommandDescriptions.sparkline.description)
  .alias('spark')
  .option('--timeframe <timeframe>', 'Time period for chart (1h, 24h, 7d, 30d) [default: 24h]')
  .option('--width <width>', 'Chart width in characters [default: 40]')
  .option('--height <height>', 'Chart height in characters [default: 8]')
  .action(async (options) => {
    try {
      await marketCommands.sparkline({
        currency : options.currency as Currency,
        json     : options.json,
        watch    : options.watch,
        interval : parseInt(options.interval) || 30,
        timeframe: options.timeframe as TimeFrame,
        width    : parseInt(options.width) || 40,
        height   : parseInt(options.height) || 8,
      })
    } catch (error) {
      console.error(chalk.red('✕ Sparkline command failed:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// =============================================================================
// Chain Commands
// =============================================================================

// Block command
cli
  .command('block', chainCommandDescriptions.block.description)
  .option('--recent <count>', 'Show N recent blocks')
  .option('--hash <hash>', 'Get specific block by hash')
  .action(async (options) => {
    try {
      await chainCommands.block({
        recent  : options.recent ? parseInt(options.recent) : undefined,
        hash    : options.hash,
        json    : options.json,
        watch   : options.watch,
        interval: parseInt(options.interval) || 30,
      })
    } catch (error) {
      console.error(chalk.red('✕ Block command failed:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// Mempool command
cli
  .command('mempool', chainCommandDescriptions.mempool.description)
  .option('--detailed', 'Show fee histogram and detailed analysis')
  .action(async (options) => {
    try {
      await chainCommands.mempool({
        detailed: options.detailed,
        json    : options.json,
        watch   : options.watch,
        interval: parseInt(options.interval) || 15,
      })
    } catch (error) {
      console.error(chalk.red('✕ Mempool command failed:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// Fees command
cli
  .command('fees', chainCommandDescriptions.fees.description)
  .option('--history <hours>', 'Show fee history for N hours')
  .action(async (options) => {
    try {
      await chainCommands.fees({
        history : options.history ? parseInt(options.history) : undefined,
        json    : options.json,
        watch   : options.watch,
        interval: parseInt(options.interval) || 30,
      })
    } catch (error) {
      console.error(chalk.red('✕ Fees command failed:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// Hashrate command
cli
  .command('hashrate', chainCommandDescriptions.hashrate.description)
  .action(async (options) => {
    try {
      await chainCommands.hashrate({
        json    : options.json,
        watch   : options.watch,
        interval: parseInt(options.interval) || 60,
      })
    } catch (error) {
      console.error(chalk.red('✕ Hashrate command failed:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// Halving command
cli
  .command('halving', chainCommandDescriptions.halving.description)
  .action(async (options) => {
    try {
      await chainCommands.halving({
        json    : options.json,
        watch   : options.watch,
        interval: parseInt(options.interval) || 120,
      })
    } catch (error) {
      console.error(chalk.red('✕ Halving command failed:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// =============================================================================
// Default Command (Show Help)
// =============================================================================

cli
  .command('')
  .action(async () => {
    // Show custom styled help if no specific command
    showStyledHelp()
  })

// =============================================================================
// CLI Configuration & Custom Help/Version Override
// =============================================================================

// Override default help and version with our styled versions
const originalParse = cli.parse.bind(cli)
cli.parse = (argv?: string[]) => {
  const args = argv || process.argv.slice(2)
  
  // Check for version flags
  if (args.includes('--version') || args.includes('-v')) {
    showStyledVersion()
    process.exit(0)
  }
  
  // Check for help flags (only global, not command-specific)
  if (args.includes('--help') || args.includes('-h') || args.includes('--h')) {
    // If there's a command before the help flag, let cac handle it
    const commandExists = args.some(arg => 
      !arg.startsWith('-') && 
      [ 'price', 'volume', 'change', 'highlow', 'sparkline', 'block', 'mempool', 'fees', 'hashrate', 'halving' ].includes(arg)
    )
    
    if (!commandExists) {
      showStyledHelp()
      process.exit(0)
    }
  }
  
  return originalParse(argv)
}

// Still set up basic CAC config for command-specific help
cli.help()
cli.version('1.0.1')

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('✕ Unexpected error:'), error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('✕ Unhandled promise rejection:'), reason)
  process.exit(1)
})

// Parse CLI arguments
try {
  cli.parse()
} catch (error) {
  console.error(chalk.red('✕ CLI Error:'), error instanceof Error ? error.message : 'Unknown error')
  process.exit(1)
}
