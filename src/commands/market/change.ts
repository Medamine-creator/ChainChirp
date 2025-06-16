import ora from 'ora'
import {
  getBitcoinPriceChange,
} from '@/services/market'
import {
  formatPrice,
  formatPriceChange,
  formatSuccessMessage,
  formatErrorMessage,
  formatInfoLine,
  formatJson,
} from '@/utils/formatter'
import type { Currency } from '@/types'

// =============================================================================
// Change Command Options
// =============================================================================

export interface ChangeCommandOptions {
  currency?: Currency
  json?    : boolean
  watch?   : boolean
  interval?: number
  detailed?: boolean
}

// =============================================================================
// Change Command Handler
// =============================================================================

export async function changeCommand(options: ChangeCommandOptions = {}): Promise<void> {
  const {
    currency = 'usd',
    json = false,
    watch = false,
    interval = 30,
    detailed = false,
  } = options

  if (watch) {
    await watchChangeCommand({ currency, json, interval, detailed })
    return
  }

  await executeChangeCommand({ currency, json, detailed })
}

// =============================================================================
// Single Change Execution
// =============================================================================

async function executeChangeCommand(options: {
  currency: Currency
  json    : boolean
  detailed: boolean
}): Promise<void> {
  const { currency, json, detailed } = options

  let spinner: ReturnType<typeof ora> | undefined
  if (!json) {
    spinner = ora('Fetching Bitcoin price changes...').start()
  }

  try {
    const result = await getBitcoinPriceChange(currency)

    if (spinner) {
      spinner.stop()
    }

    if (result.success && result.data) {
      const data = result.data

      if (json) {
        console.log(formatJson({
          current         : data.current,
          change1h        : data.change1h,
          change24h       : data.change24h,
          change7d        : data.change7d,
          change30d       : data.change30d,
          changePercent1h : data.changePercent1h,
          changePercent24h: data.changePercent24h,
          changePercent7d : data.changePercent7d,
          changePercent30d: data.changePercent30d,
          currency        : data.currency.toUpperCase(),
          executionTime   : result.executionTime,
        }))
      } else {
        const currentPrice = formatPrice(data.current, currency)
        
        console.log('')
        console.log(formatSuccessMessage('Bitcoin Price Changes'))
        console.log(`  Current: ${currentPrice}`)
        console.log('')
        
        if (data.change1h !== undefined && data.changePercent1h !== undefined && data.change1h !== 0) {
          const change1h = formatPriceChange(data.change1h)
          const changePercent1h = formatPriceChange(data.changePercent1h, true)
          console.log(formatInfoLine('1 Hour', `${change1h} (${changePercent1h})`))
        }
        
        const change24h = formatPriceChange(data.change24h)
        const changePercent24h = formatPriceChange(data.changePercent24h, true)
        console.log(formatInfoLine('24 Hours', `${change24h} (${changePercent24h})`))
        
        if (detailed) {
          if (data.change7d !== undefined && data.changePercent7d !== undefined) {
            const change7d = formatPriceChange(data.change7d)
            const changePercent7d = formatPriceChange(data.changePercent7d, true)
            console.log(formatInfoLine('7 Days', `${change7d} (${changePercent7d})`))
          }
          
          if (data.change30d !== undefined && data.changePercent30d !== undefined) {
            const change30d = formatPriceChange(data.change30d)
            const changePercent30d = formatPriceChange(data.changePercent30d, true)
            console.log(formatInfoLine('30 Days', `${change30d} (${changePercent30d})`))
          }
        }
        
        console.log('')
        console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
      }
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      if (json) {
        console.log(formatJson({ error: errorMsg }))
      } else {
        console.error('')
        console.error(formatErrorMessage('Failed to fetch price changes', errorMsg))
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

async function watchChangeCommand(options: {
  currency: Currency
  json    : boolean
  interval: number
  detailed: boolean
}): Promise<void> {
  const { currency, json, interval, detailed } = options

  const executeWatch = async (): Promise<void> => {
    try {
      const result = await getBitcoinPriceChange(currency)

      if (result.success && result.data) {
        const data = result.data

        if (json) {
          const output = {
            current         : data.current,
            change1h        : data.change1h,
            change24h       : data.change24h,
            change7d        : data.change7d,
            change30d       : data.change30d,
            changePercent1h : data.changePercent1h,
            changePercent24h: data.changePercent24h,
            changePercent7d : data.changePercent7d,
            changePercent30d: data.changePercent30d,
            currency        : data.currency.toUpperCase(),
            timestamp       : new Date().toISOString(),
            executionTime   : result.executionTime,
          }
          console.log(formatJson(output))
        } else {
          if (!process.stdout.isTTY) {
            // Non-interactive mode, don't clear screen
          } else {
            // Clear screen for interactive mode
            console.clear()
          }

          const currentPrice = formatPrice(data.current, currency)
          const change24h = formatPriceChange(data.change24h)
          const changePercent24h = formatPriceChange(data.changePercent24h, true)

          console.log('')
          console.log(formatSuccessMessage(`Bitcoin Changes ${change24h} (${changePercent24h})`))
          console.log(`  Current: ${currentPrice}`)
          console.log('')
          
          if (data.change1h !== undefined && data.changePercent1h !== undefined && data.change1h !== 0) {
            const change1h = formatPriceChange(data.change1h)
            const changePercent1h = formatPriceChange(data.changePercent1h, true)
            console.log(formatInfoLine('1 Hour', `${change1h} (${changePercent1h})`))
          }
          
          console.log(formatInfoLine('24 Hours', `${change24h} (${changePercent24h})`))
          
          if (detailed) {
            if (data.change7d !== undefined && data.changePercent7d !== undefined) {
              const change7d = formatPriceChange(data.change7d)
              const changePercent7d = formatPriceChange(data.changePercent7d, true)
              console.log(formatInfoLine('7 Days', `${change7d} (${changePercent7d})`))
            }
            
            if (data.change30d !== undefined && data.changePercent30d !== undefined) {
              const change30d = formatPriceChange(data.change30d)
              const changePercent30d = formatPriceChange(data.changePercent30d, true)
              console.log(formatInfoLine('30 Days', `${change30d} (${changePercent30d})`))
            }
          }
          
          console.log('')
          console.log(formatInfoLine('Interval', `${interval}s`))
          console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
        }
      } else {
        const errorMsg = result.error?.message || 'Unknown error occurred'
        if (json) {
          console.log(formatJson({ error: errorMsg, timestamp: new Date().toISOString() }))
        } else {
          console.error(formatErrorMessage('Failed to fetch price changes', errorMsg))
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
