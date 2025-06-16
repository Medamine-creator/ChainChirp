import ora from 'ora'
import {
  getBitcoinPrice,
  getBitcoinDetailedPrice,
} from '@/services/market'
import {
  formatPrice,
  formatPriceChange,
  formatSuccessMessage,
  formatErrorMessage,
  formatInfoLine,
  formatTimestamp,
} from '@/utils/formatter'
import {
  withWatch,
  withJson,
  priceJsonFormatter,
  createWatchJsonFormatter,
  calculatePriceChange,
  extractPrice,
  type BaseCommandOptions,
} from '@/commands/decorators'
import type { Currency, CommandResult } from '@/types'

// =============================================================================
// Price Command Options
// =============================================================================

export interface PriceCommandOptions extends BaseCommandOptions {
  currency?: Currency
  detailed?: boolean
}

// =============================================================================
// Core Price Command (Business Logic Only)
// =============================================================================

async function executePriceCommand(options: {
  currency?: Currency
  detailed?: boolean
}): Promise<CommandResult<any>> {
  const { currency = 'usd', detailed = false } = options

  if (detailed) {
    return getBitcoinDetailedPrice(currency)
  } else {
    return getBitcoinPrice(currency)
  }
}

// =============================================================================
// Human-Readable Output Renderers
// =============================================================================

function renderPriceData(data: any, result: CommandResult<any>) {
  const formattedPrice = formatPrice(data.price, data.currency)
  
  console.log('')
  console.log(formatSuccessMessage('Bitcoin Price'))
  console.log(`  ${formattedPrice}`)
  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
}

function renderDetailedPriceData(data: any, result: CommandResult<any>) {
  const formattedPrice = formatPrice(data.price, data.currency)
  const change24h = formatPriceChange(data.change24h || 0)
  const changePercent24h = formatPriceChange(data.changePercent24h || 0, true)

  console.log('')
  console.log(formatSuccessMessage('Bitcoin Market Data'))
  console.log(`  ${formattedPrice} ${change24h} (${changePercent24h})`)
  console.log('')
  console.log(formatInfoLine('24h High', formatPrice(data.high24h || data.price, data.currency)))
  console.log(formatInfoLine('24h Low', formatPrice(data.low24h || data.price, data.currency)))
  console.log(formatInfoLine('24h Volume', formatPrice(data.volume24h || 0, data.currency)))
  console.log(formatInfoLine('Market Cap', formatPrice(data.marketCap || 0, data.currency)))
  console.log(formatInfoLine('All-Time High', formatPrice(data.ath || data.price, data.currency)))
  console.log(formatInfoLine('All-Time Low', formatPrice(data.atl || data.price, data.currency)))
  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(data.timestamp)))
  console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
}

// =============================================================================
// Watch Mode Renderers
// =============================================================================

const priceWatchRenderer = (data: any, result: CommandResult<any>, previousData?: any) => {
  const currentPrice = extractPrice(data)
  let changeText = ''
  
  if (previousData) {
    const previousPrice = extractPrice(previousData)
    if (previousPrice !== currentPrice) {
      const change = calculatePriceChange(currentPrice, previousPrice)
      changeText = ` ${formatPriceChange(change.change)} (${formatPriceChange(change.changePercent || 0, true)})`
    }
  }

  const formattedPrice = formatPrice(currentPrice, data.currency)
  
  console.log('')
  console.log(formatSuccessMessage('Bitcoin Price' + changeText))
  console.log(`  ${formattedPrice}`)
  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Interval', `${result.timestamp ? 30 : 30}s`))
  console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
}

const priceWatchJsonFormatter = createWatchJsonFormatter(
  priceJsonFormatter,
  (current: any, previous: any) => {
    const currentPrice = extractPrice(current)
    const previousPrice = extractPrice(previous)
    return calculatePriceChange(currentPrice, previousPrice)
  }
)

// =============================================================================
// Decorated Command Functions
// =============================================================================

const watchPriceCommand = withWatch<PriceCommandOptions, any>(
  priceWatchRenderer,
  priceWatchJsonFormatter
)(executePriceCommand)

const jsonPriceCommand = withJson<PriceCommandOptions, any>(
  priceJsonFormatter
)(executePriceCommand)

// =============================================================================
// Main Price Command Handler
// =============================================================================

export async function priceCommand(options: PriceCommandOptions = {}): Promise<void> {
  const {
    currency = 'usd',
    json = false,
    watch = false,
    interval = 30,
    detailed = false,
  } = options

  // Handle watch mode
  if (watch) {
    await watchPriceCommand({ currency, json, interval, detailed })
    return
  }

  // Handle JSON mode
  if (json) {
    await jsonPriceCommand({ currency, detailed })
    return
  }

  // Handle human-readable mode
  let spinner: ReturnType<typeof ora> | undefined
  spinner = ora('Fetching Bitcoin price...').start()

  try {
    const result = await executePriceCommand({ currency, detailed })

    if (spinner) {
      spinner.stop()
    }

    if (result.success && result.data) {
      if (detailed) {
        renderDetailedPriceData(result.data, result)
      } else {
        renderPriceData(result.data, result)
      }
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      console.error('')
      console.error(formatErrorMessage('Failed to fetch price', errorMsg))
      process.exit(1)
    }
  } catch (error) {
    if (spinner) {
      spinner.stop()
    }

    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('')
    console.error(formatErrorMessage('Command failed', errorMsg))
    process.exit(1)
  }
}

// =============================================================================
// Legacy Support (Detailed Price Command)
// =============================================================================

export async function detailedPriceCommand(options: PriceCommandOptions = {}): Promise<void> {
  await priceCommand({ ...options, detailed: true })
}
