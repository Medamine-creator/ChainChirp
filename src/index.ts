#!/usr/bin/env node

import { cac } from 'cac'
import chalk from 'chalk'
import { banner } from './utils/banner'
import { getCurrentBitcoinPrice } from './services/market/priceService'
import type { Currency } from './types'

const cli = cac('chainchirp')

// Global options
cli.option('--json', 'Output as JSON')
cli.option('--watch', 'Watch for changes')

// Price command
cli
  .command('', 'Get Bitcoin price information')
  .option('--price', 'Get current Bitcoin price')
  .option('--currency <currency>', 'Currency for price display', { default: 'usd' })
  .action(async (options) => {
    if (options.price) {
      await handlePriceCommand(options)
    } else {
      // Show help if no specific command
      cli.outputHelp()
    }
  })

// Price command handler
async function handlePriceCommand(options: { currency?: string; json?: boolean }) {
  try {
    const currency = (options.currency || 'usd') as Currency
    
    if (!options.json) {
      console.log(banner())
      console.log(chalk.blue('🔍 Fetching Bitcoin price...\n'))
    }
    
    const result = await getCurrentBitcoinPrice(currency)
    
    if (result.success) {
      if (options.json) {
        console.log(JSON.stringify({
          price        : result.data,
          currency     : currency.toUpperCase(),
          timestamp    : result.timestamp,
          executionTime: result.executionTime,
        }, null, 2))
      } else {
        const formattedPrice = new Intl.NumberFormat('en-US', {
          style                : 'currency',
          currency             : currency.toUpperCase(),
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(result.data!)
        
        console.log(chalk.green('💰 Bitcoin Price'))
        console.log(chalk.white(`   ${formattedPrice}`))
        console.log(chalk.gray(`   Last updated: ${result.timestamp.toLocaleString()}`))
        console.log(chalk.gray(`   Execution time: ${result.executionTime}ms`))
      }
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      if (options.json) {
        console.log(JSON.stringify({ error: errorMsg }, null, 2))
      } else {
        console.error(chalk.red('❌ Error:'), errorMsg)
      }
      process.exit(1)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
    if (options.json) {
      console.log(JSON.stringify({ error: errorMsg }, null, 2))
    } else {
      console.error(chalk.red('❌ Error:'), errorMsg)
    }
    process.exit(1)
  }
}

// Parse CLI arguments
cli.help()
cli.version('1.0.0')

try {
  cli.parse()
} catch (error) {
  console.error(chalk.red('❌ CLI Error:'), error instanceof Error ? error.message : 'Unknown error')
  process.exit(1)
}
