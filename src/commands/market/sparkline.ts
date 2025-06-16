import ora from 'ora'
import {
  getBitcoinSparkline,
} from '@/services/market'
import {
  formatPrice,
  formatSparkline,
  formatSuccessMessage,
  formatErrorMessage,
  formatInfoLine,
  formatJson,
} from '@/utils/formatter'
import type { Currency, TimeFrame } from '@/types'

// =============================================================================
// Sparkline Command Options
// =============================================================================

export interface SparklineCommandOptions {
  currency? : Currency
  json?     : boolean
  watch?    : boolean
  interval? : number
  timeframe?: TimeFrame
  width?    : number
  height?   : number
}

// =============================================================================
// Sparkline Command Handler
// =============================================================================

export async function sparklineCommand(options: SparklineCommandOptions = {}): Promise<void> {
  const {
    currency = 'usd',
    json = false,
    watch = false,
    interval = 30,
    timeframe = '24h',
    width = 40,
    height = 8,
  } = options

  if (watch) {
    await watchSparklineCommand({ currency, json, interval, timeframe, width, height })
    return
  }

  await executeSparklineCommand({ currency, json, timeframe, width, height })
}

// =============================================================================
// Single Sparkline Execution
// =============================================================================

async function executeSparklineCommand(options: {
  currency : Currency
  json     : boolean
  timeframe: TimeFrame
  width    : number
  height   : number
}): Promise<void> {
  const { currency, json, timeframe, width, height } = options

  let spinner: ReturnType<typeof ora> | undefined
  if (!json) {
    spinner = ora(`Fetching Bitcoin ${timeframe} sparkline...`).start()
  }

  try {
    const result = await getBitcoinSparkline(currency, timeframe)

    if (spinner) {
      spinner.stop()
    }

    if (result.success && result.data) {
      const data = result.data

      if (json) {
        console.log(formatJson({
          prices       : data.prices,
          timeframe    : data.timeframe,
          currency     : data.currency.toUpperCase(),
          width        : data.width,
          height       : data.height,
          executionTime: result.executionTime,
        }))
      } else {
        const sparkline = formatSparkline(data.prices, { width, height, color: true })
        const firstPrice = data.prices[0] ?? 0
        const lastPrice = data.prices[data.prices.length - 1] ?? 0
        const trend = lastPrice - firstPrice
        const trendPercent = firstPrice !== 0 ? ((trend / firstPrice) * 100) : 0

        console.log('')
        console.log(formatSuccessMessage(`Bitcoin ${timeframe.toUpperCase()} Price Chart`))
        console.log('')
        console.log(`  ${sparkline}`)
        console.log('')
        console.log(formatInfoLine('Period', timeframe.toUpperCase()))
        console.log(formatInfoLine('Start', formatPrice(firstPrice, currency)))
        console.log(formatInfoLine('End', formatPrice(lastPrice, currency)))
        console.log(formatInfoLine('Change', `${trend >= 0 ? '+' : ''}${trend.toFixed(2)} (${trendPercent >= 0 ? '+' : ''}${trendPercent.toFixed(2)}%)`))
        console.log(formatInfoLine('Points', data.prices.length.toString()))
        console.log('')
        console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
      }
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      if (json) {
        console.log(formatJson({ error: errorMsg }))
      } else {
        console.error('')
        console.error(formatErrorMessage('Failed to fetch sparkline data', errorMsg))
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

async function watchSparklineCommand(options: {
  currency : Currency
  json     : boolean
  interval : number
  timeframe: TimeFrame
  width    : number
  height   : number
}): Promise<void> {
  const { currency, json, interval, timeframe, width, height } = options

  const executeWatch = async (): Promise<void> => {
    try {
      const result = await getBitcoinSparkline(currency, timeframe)

      if (result.success && result.data) {
        const data = result.data

        if (json) {
          const output = {
            prices       : data.prices,
            timeframe    : data.timeframe,
            currency     : data.currency.toUpperCase(),
            width        : data.width,
            height       : data.height,
            timestamp    : new Date().toISOString(),
            executionTime: result.executionTime,
          }
          console.log(formatJson(output))
        } else {
          if (!process.stdout.isTTY) {
            // Non-interactive mode, don't clear screen
          } else {
            // Clear screen for interactive mode
            console.clear()
          }

          const sparkline = formatSparkline(data.prices, { width, height, color: true })
          const firstPrice = data.prices[0] ?? 0
          const lastPrice = data.prices[data.prices.length - 1] ?? 0
          const trend = lastPrice - firstPrice
          const trendPercent = firstPrice !== 0 ? ((trend / firstPrice) * 100) : 0

          console.log('')
          console.log(formatSuccessMessage(`Bitcoin ${timeframe.toUpperCase()} Sparkline`))
          console.log('')
          console.log(`  ${sparkline}`)
          console.log('')
          console.log(formatInfoLine('Current', formatPrice(lastPrice, currency)))
          console.log(formatInfoLine('Change', `${trend >= 0 ? '+' : ''}${trend.toFixed(2)} (${trendPercent >= 0 ? '+' : ''}${trendPercent.toFixed(2)}%)`))
          console.log(formatInfoLine('Interval', `${interval}s`))
          console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
        }
      } else {
        const errorMsg = result.error?.message || 'Unknown error occurred'
        if (json) {
          console.log(formatJson({ error: errorMsg, timestamp: new Date().toISOString() }))
        } else {
          console.error(formatErrorMessage('Failed to fetch sparkline data', errorMsg))
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
