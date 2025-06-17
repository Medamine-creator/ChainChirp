import ora from 'ora'
import {
  getBitcoinHighLow,
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
// HighLow Command Options
// =============================================================================

export interface HighLowCommandOptions {
  currency?: Currency
  json?    : boolean
  watch?   : boolean
  interval?: number
}

// =============================================================================
// HighLow Command Handler
// =============================================================================

export async function highlowCommand(options: HighLowCommandOptions = {}): Promise<void> {
  const {
    currency = 'usd',
    json = false,
    watch = false,
    interval = 30,
  } = options

  if (watch) {
    await watchHighLowCommand({ currency, json, interval })
    return
  }

  await executeHighLowCommand({ currency, json })
}

// =============================================================================
// Single HighLow Execution
// =============================================================================

async function executeHighLowCommand(options: {
  currency: Currency
  json    : boolean
}): Promise<void> {
  const { currency, json } = options

  let spinner: ReturnType<typeof ora> | undefined
  if (!json) {
    spinner = ora('Fetching Bitcoin high/low data...').start()
  }

  try {
    const result = await getBitcoinHighLow(currency)

    if (spinner) {
      spinner.stop()
    }

    if (result.success && result.data) {
      const data = result.data

      if (json) {
        console.log(formatJson({
          current             : data.current,
          high24h             : data.high24h,
          low24h              : data.low24h,
          ath                 : data.ath,
          athDate             : data.athDate.toISOString(),
          atl                 : data.atl,
          atlDate             : data.atlDate.toISOString(),
          currency            : data.currency.toUpperCase(),
          high24hChangePercent: data.high24hChangePercent,
          low24hChangePercent : data.low24hChangePercent,
          athChangePercent    : data.athChangePercent,
          atlChangePercent    : data.atlChangePercent,
          executionTime       : result.executionTime,
        }))
      } else {
        const currentPrice = formatPrice(data.current, currency)
        const high24h = formatPrice(data.high24h, currency)
        const low24h = formatPrice(data.low24h, currency)
        const ath = formatPrice(data.ath, currency)
        const atl = formatPrice(data.atl, currency)

        console.log('')
        console.log(formatSuccessMessage('Bitcoin High/Low Prices'))
        console.log(`  Current: ${currentPrice}`)
        console.log('')
        
        console.log(formatInfoLine('24h High', high24h))
        console.log(formatInfoLine('24h Low', low24h))
        console.log('')
        
        console.log(formatInfoLine('All-Time High', `${ath} (${formatTimestamp(data.athDate)})`))
        console.log(formatInfoLine('All-Time Low', `${atl} (${formatTimestamp(data.atlDate)})`))
        
        if (data.athChangePercent) {
          const athChange = formatPriceChange(data.athChangePercent, true)
          console.log(formatInfoLine('From ATH', athChange))
        }
        
        if (data.atlChangePercent) {
          const atlChange = formatPriceChange(data.atlChangePercent, true)
          console.log(formatInfoLine('From ATL', atlChange))
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
        console.error(formatErrorMessage('Failed to fetch high/low data', errorMsg))
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

async function watchHighLowCommand(options: {
  currency: Currency
  json    : boolean
  interval: number
}): Promise<void> {
  const { currency, json, interval } = options

  const executeWatch = async (): Promise<void> => {
    try {
      const result = await getBitcoinHighLow(currency)

      if (result.success && result.data) {
        const data = result.data

        if (json) {
          const output = {
            current             : data.current,
            high24h             : data.high24h,
            low24h              : data.low24h,
            ath                 : data.ath,
            athDate             : data.athDate.toISOString(),
            atl                 : data.atl,
            atlDate             : data.atlDate.toISOString(),
            currency            : data.currency.toUpperCase(),
            high24hChangePercent: data.high24hChangePercent,
            low24hChangePercent : data.low24hChangePercent,
            athChangePercent    : data.athChangePercent,
            atlChangePercent    : data.atlChangePercent,
            timestamp           : new Date().toISOString(),
            executionTime       : result.executionTime,
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
          const high24h = formatPrice(data.high24h, currency)
          const low24h = formatPrice(data.low24h, currency)

          console.log('')
          console.log(formatSuccessMessage('Bitcoin High/Low Prices'))
          console.log(`  Current: ${currentPrice}`)
          console.log('')
          
          console.log(formatInfoLine('24h High', high24h))
          console.log(formatInfoLine('24h Low', low24h))
          console.log(formatInfoLine('All-Time High', formatPrice(data.ath, currency)))
          console.log(formatInfoLine('All-Time Low', formatPrice(data.atl, currency)))
          
          console.log('')
          console.log(formatInfoLine('Interval', `${interval}s`))
          console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
        }
      } else {
        const errorMsg = result.error?.message || 'Unknown error occurred'
        if (json) {
          console.log(formatJson({ error: errorMsg, timestamp: new Date().toISOString() }))
        } else {
          console.error(formatErrorMessage('Failed to fetch high/low data', errorMsg))
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
