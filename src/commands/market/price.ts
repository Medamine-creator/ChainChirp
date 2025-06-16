import ora from 'ora'
import {
  getCurrentBitcoinPrice,
  getBitcoinMarketData,
} from '@/services/market'
import {
  formatPrice,
  formatPriceChange,
  formatSuccessMessage,
  formatErrorMessage,
  formatInfoLine,
  formatJson,
  formatTimestamp,
} from '@/utils/formatter'
import type { Currency } from '@/types'

// =============================================================================
// Price Command Options
// =============================================================================

export interface PriceCommandOptions {
  currency?: Currency
  json?    : boolean
  watch?   : boolean
  interval?: number
}

// =============================================================================
// Price Command Handler
// =============================================================================

export async function priceCommand(options: PriceCommandOptions = {}): Promise<void> {
  const {
    currency = 'usd',
    json = false,
    watch = false,
    interval = 30,
  } = options

  if (watch) {
    await watchPriceCommand({ currency, json, interval })
    return
  }

  await executePriceCommand({ currency, json })
}

// =============================================================================
// Single Price Execution
// =============================================================================

async function executePriceCommand(options: {
  currency: Currency
  json    : boolean
}): Promise<void> {
  const { currency, json } = options

  let spinner: ReturnType<typeof ora> | undefined
  if (!json) {
    spinner = ora('Fetching Bitcoin price...').start()
  }

  try {
    const result = await getCurrentBitcoinPrice(currency)

    if (spinner) {
      spinner.stop()
    }

    if (result.success && result.data !== undefined) {
      if (json) {
        console.log(formatJson({
          price        : result.data,
          currency     : currency.toUpperCase(),
          timestamp    : result.timestamp.toISOString(),
          executionTime: result.executionTime,
        }))
      } else {
        const formattedPrice = formatPrice(result.data, currency)
        console.log('')
        console.log(formatSuccessMessage('Bitcoin Price'))
        console.log(`  ${formattedPrice}`)
        console.log('')
        console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
        console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
      }
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      if (json) {
        console.log(formatJson({ error: errorMsg }))
      } else {
        console.error('')
        console.error(formatErrorMessage('Failed to fetch price', errorMsg))
      }
      process.exit(1)
    }
  } catch (error) {
    if (spinner) {
      spinner.stop()
    }

    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
    if (json) {
      console.log(formatJson({ error: errorMsg }))
    } else {
      console.error('')
      console.error(formatErrorMessage('Command failed', errorMsg))
    }
    process.exit(1)
  }
}

// =============================================================================
// Watch Mode Implementation
// =============================================================================

async function watchPriceCommand(options: {
  currency: Currency
  json    : boolean
  interval: number
}): Promise<void> {
  const { currency, json, interval } = options
  let previousPrice: number | undefined

  const executeWatch = async (): Promise<void> => {
    try {
      const result = await getCurrentBitcoinPrice(currency)

      if (result.success && result.data !== undefined) {
        if (json) {
          const output = {
            price        : result.data,
            currency     : currency.toUpperCase(),
            timestamp    : result.timestamp.toISOString(),
            executionTime: result.executionTime,
            change       : previousPrice ? result.data - previousPrice : null,
            changePercent: previousPrice ? ((result.data - previousPrice) / previousPrice) * 100 : null,
          }
          console.log(formatJson(output))
        } else {
          if (!process.stdout.isTTY) {
            // Non-interactive mode, don't clear screen
          } else {
            // Clear screen for interactive mode
            console.clear()
          }

          const formattedPrice = formatPrice(result.data, currency)
          let changeText = ''
          
          if (previousPrice && previousPrice !== result.data) {
            const change = result.data - previousPrice
            const changePercent = (change / previousPrice) * 100
            changeText = ` ${formatPriceChange(change)} (${formatPriceChange(changePercent, true)})`
          }

          console.log('')
          console.log(formatSuccessMessage('Bitcoin Price' + changeText))
          console.log(`  ${formattedPrice}`)
          console.log('')
          console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
          console.log(formatInfoLine('Interval', `${interval}s`))
          console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
        }

        previousPrice = result.data
      } else {
        const errorMsg = result.error?.message || 'Unknown error occurred'
        if (json) {
          console.log(formatJson({ error: errorMsg, timestamp: new Date().toISOString() }))
        } else {
          console.error(formatErrorMessage('Failed to fetch price', errorMsg))
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      if (json) {
        console.log(formatJson({ error: errorMsg, timestamp: new Date().toISOString() }))
      } else {
        console.error(formatErrorMessage('Watch failed', errorMsg))
      }
    }
  }

  // Initial execution
  await executeWatch()

  // Set up interval
  const intervalId = setInterval(executeWatch, interval * 1000)

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(intervalId)
    console.log('\n' + formatSuccessMessage('Watch stopped'))
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    clearInterval(intervalId)
    process.exit(0)
  })
}

// =============================================================================
// Extended Price Command with Market Data
// =============================================================================

export async function detailedPriceCommand(options: PriceCommandOptions = {}): Promise<void> {
  const {
    currency = 'usd',
    json = false,
  } = options

  let spinner: ReturnType<typeof ora> | undefined
  if (!json) {
    spinner = ora('Fetching detailed Bitcoin data...').start()
  }

  try {
    const result = await getBitcoinMarketData(currency)

    if (spinner) {
      spinner.stop()
    }

    if (result.success && result.data) {
      const data = result.data

      if (json) {
        console.log(formatJson({
          price           : data.price,
          currency        : data.currency.toUpperCase(),
          change24h       : data.change24h,
          changePercent24h: data.changePercent24h,
          change7d        : data.change7d,
          change30d       : data.change30d,
          marketCap       : data.marketCap,
          volume24h       : data.volume24h,
          high24h         : data.high24h,
          low24h          : data.low24h,
          ath             : data.ath,
          atl             : data.atl,
          lastUpdated     : data.lastUpdated.toISOString(),
          executionTime   : result.executionTime,
        }))
      } else {
        const formattedPrice = formatPrice(data.price, currency)
        const change24h = formatPriceChange(data.change24h)
        const changePercent24h = formatPriceChange(data.changePercent24h, true)

        console.log('')
        console.log(formatSuccessMessage('Bitcoin Market Data'))
        console.log(`  ${formattedPrice} ${change24h} (${changePercent24h})`)
        console.log('')
        console.log(formatInfoLine('24h High', formatPrice(data.high24h, currency)))
        console.log(formatInfoLine('24h Low', formatPrice(data.low24h, currency)))
        console.log(formatInfoLine('24h Volume', formatPrice(data.volume24h, currency)))
        console.log(formatInfoLine('Market Cap', formatPrice(data.marketCap, currency)))
        console.log(formatInfoLine('All-Time High', formatPrice(data.ath, currency)))
        console.log(formatInfoLine('All-Time Low', formatPrice(data.atl, currency)))
        console.log('')
        console.log(formatInfoLine('Updated', formatTimestamp(data.lastUpdated)))
        console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
      }
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      if (json) {
        console.log(formatJson({ error: errorMsg }))
      } else {
        console.error('')
        console.error(formatErrorMessage('Failed to fetch market data', errorMsg))
      }
      process.exit(1)
    }
  } catch (error) {
    if (spinner) {
      spinner.stop()
    }

    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
    if (json) {
      console.log(formatJson({ error: errorMsg }))
    } else {
      console.error('')
      console.error(formatErrorMessage('Command failed', errorMsg))
    }
    process.exit(1)
  }
}
