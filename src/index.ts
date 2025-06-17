#!/usr/bin/env node

import { cac } from 'cac'
import chalk from 'chalk'
import {
  marketCommands,
  marketCommandDescriptions,
} from '@/commands/market'
import type { Currency, TimeFrame } from '@/types'

const cli = cac('chainchirp')

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
// Default Command (Show Help)
// =============================================================================

cli
  .command('')
  .action(async () => {
    // Show help if no specific command
    cli.outputHelp()
  })

// =============================================================================
// CLI Configuration
// =============================================================================

cli.help()
cli.version('0.3.0')

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
