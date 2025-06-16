import ora from 'ora'
import {
  getBitcoinVolume,
} from '@/services/market'
import {
  formatVolume,
  formatPriceChange,
  formatSuccessMessage,
  formatErrorMessage,
  formatInfoLine,
  formatJson,
  formatTimestamp,
} from '@/utils/formatter'
import type { Currency } from '@/types'

// =============================================================================
// Volume Command Options
// =============================================================================

export interface VolumeCommandOptions {
  currency?: Currency
  json?    : boolean
  watch?   : boolean
  interval?: number
}

// =============================================================================
// Volume Command Handler
// =============================================================================

export async function volumeCommand(options: VolumeCommandOptions = {}): Promise<void> {
  const {
    currency = 'usd',
    json = false,
    watch = false,
    interval = 30,
  } = options

  if (watch) {
    await watchVolumeCommand({ currency, json, interval })
    return
  }

  await executeVolumeCommand({ currency, json })
}

// =============================================================================
// Single Volume Execution
// =============================================================================

async function executeVolumeCommand(options: {
  currency: Currency
  json    : boolean
}): Promise<void> {
  const { currency, json } = options

  let spinner: ReturnType<typeof ora> | undefined
  if (!json) {
    spinner = ora('Fetching Bitcoin volume data...').start()
  }

  try {
    const result = await getBitcoinVolume(currency)

    if (spinner) {
      spinner.stop()
    }

    if (result.success && result.data) {
      const data = result.data

      if (json) {
        console.log(formatJson({
          volume24h             : data.volume24h,
          volumeChange24h       : data.volumeChange24h,
          volumeChangePercent24h: data.volumeChangePercent24h,
          currency              : data.currency.toUpperCase(),
          timestamp             : data.timestamp.toISOString(),
          executionTime         : result.executionTime,
        }))
      } else {
        const formattedVolume = formatVolume(data.volume24h, currency)
        const volumeChange = formatPriceChange(data.volumeChange24h)
        const volumeChangePercent = formatPriceChange(data.volumeChangePercent24h, true)

        console.log('')
        console.log(formatSuccessMessage('Bitcoin 24h Volume'))
        console.log(`  ${formattedVolume}`)
        console.log('')
        console.log(formatInfoLine('24h Change', `${volumeChange} (${volumeChangePercent})`))
        console.log(formatInfoLine('Updated', formatTimestamp(data.timestamp)))
        console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
      }
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      if (json) {
        console.log(formatJson({ error: errorMsg }))
      } else {
        console.error('')
        console.error(formatErrorMessage('Failed to fetch volume data', errorMsg))
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

async function watchVolumeCommand(options: {
  currency: Currency
  json    : boolean
  interval: number
}): Promise<void> {
  const { currency, json, interval } = options

  const executeWatch = async (): Promise<void> => {
    try {
      const result = await getBitcoinVolume(currency)

      if (result.success && result.data) {
        if (json) {
          const output = {
            volume24h             : result.data.volume24h,
            volumeChange24h       : result.data.volumeChange24h,
            volumeChangePercent24h: result.data.volumeChangePercent24h,
            currency              : result.data.currency.toUpperCase(),
            timestamp             : result.data.timestamp.toISOString(),
            executionTime         : result.executionTime,
          }
          console.log(formatJson(output))
        } else {
          if (!process.stdout.isTTY) {
            // Non-interactive mode, don't clear screen
          } else {
            // Clear screen for interactive mode
            console.clear()
          }

          const formattedVolume = formatVolume(result.data.volume24h, currency)
          const volumeChange = formatPriceChange(result.data.volumeChange24h)
          const volumeChangePercent = formatPriceChange(result.data.volumeChangePercent24h, true)

          console.log('')
          console.log(formatSuccessMessage(`Bitcoin 24h Volume ${volumeChange} (${volumeChangePercent})`))
          console.log(`  ${formattedVolume}`)
          console.log('')
          console.log(formatInfoLine('Updated', formatTimestamp(result.data.timestamp)))
          console.log(formatInfoLine('Interval', `${interval}s`))
          console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
        }
      } else {
        const errorMsg = result.error?.message || 'Unknown error occurred'
        if (json) {
          console.log(formatJson({ error: errorMsg, timestamp: new Date().toISOString() }))
        } else {
          console.error(formatErrorMessage('Failed to fetch volume data', errorMsg))
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
