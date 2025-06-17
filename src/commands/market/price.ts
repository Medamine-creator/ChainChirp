import {
  getBitcoinPrice,
  getBitcoinDetailedPrice,
} from '@/services/market'
import {
  formatPrice,
  formatPriceChange,
  formatTimestamp,
  symbol,
} from '@/utils/formatter'
import logger from '@/utils/logger'
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
// Human-Readable Output Renderers (Enhanced)
// =============================================================================

function renderPriceData(data: any, result: CommandResult<any>) {
  const formattedPrice = formatPrice(data.price, data.currency)
  
  logger.newline()
  logger.success('Bitcoin Price')
  logger.renderLine('Price', `${symbol('bitcoin')} ${formattedPrice}`, 'success')
  logger.newline()
  logger.renderLine('Updated', formatTimestamp(result.timestamp), 'info')
  logger.renderLine('Latency', `${result.executionTime}ms`)
}

function renderDetailedPriceData(data: any, result: CommandResult<any>) {
  const formattedPrice = formatPrice(data.price, data.currency)
  const change24h = formatPriceChange(data.change24h || 0)
  const changePercent24h = formatPriceChange(data.changePercent24h || 0, true)
  const priceWithChange = `${symbol('bitcoin')} ${formattedPrice} ${change24h} (${changePercent24h})`

  logger.newline()
  logger.success('Bitcoin Market Data')
  logger.renderLine('Price', priceWithChange, 'success')
  logger.newline()
  
  // Market metrics
  logger.renderLine('24h High', formatPrice(data.high24h || data.price, data.currency))
  logger.renderLine('24h Low', formatPrice(data.low24h || data.price, data.currency))
  logger.renderLine('24h Volume', formatPrice(data.volume24h || 0, data.currency))
  logger.renderLine('Market Cap', formatPrice(data.marketCap || 0, data.currency))
  logger.renderLine('ATH', formatPrice(data.ath || data.price, data.currency))
  logger.renderLine('ATL', formatPrice(data.atl || data.price, data.currency))
  
  logger.newline()
  logger.renderLine('Updated', formatTimestamp(data.timestamp), 'info')
  logger.renderLine('Latency', `${result.executionTime}ms`)
}

// =============================================================================
// Watch Mode Renderers (Enhanced)
// =============================================================================

const priceWatchRenderer = (data: any, result: CommandResult<any>, previousData?: any) => {
  const currentPrice = extractPrice(data)
  let changeText = ''
  let priceState: 'success' | 'warning' | 'error' = 'success'
  
  if (previousData) {
    const previousPrice = extractPrice(previousData)
    if (previousPrice !== currentPrice) {
      const change = calculatePriceChange(currentPrice, previousPrice)
      changeText = ` ${formatPriceChange(change.change)} (${formatPriceChange(change.changePercent || 0, true)})`
      priceState = change.change >= 0 ? 'success' : 'error'
    }
  }

  const formattedPrice = formatPrice(currentPrice, data.currency)
  const priceDisplay = `${symbol('bitcoin')} ${formattedPrice}${changeText}`
  
  logger.clearScreen()
  logger.newline()
  logger.watchHeader('Bitcoin Price', 30)
  logger.renderLine('Price', priceDisplay, priceState)
  logger.newline()
  logger.renderLine('Updated', formatTimestamp(result.timestamp), 'info')
  logger.renderLine('Interval', '30s')
  logger.watchFooter()
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
// Main Price Command Handler (Enhanced)
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
    await watchPriceCommand({ currency, json: json || false, interval, detailed })
    return
  }

  // Handle JSON mode
  if (json) {
    await jsonPriceCommand({ currency, detailed, json: true })
    return
  }

  // Handle human-readable mode with new logger system
  try {
    const result = await logger.withSpinner(
      () => executePriceCommand({ currency, detailed }),
      'Fetching Bitcoin price…',
      {
        successMessage: undefined, // Don't show success message, we'll render our own
      }
    )

    if (result.success && result.data) {
      if (detailed) {
        renderDetailedPriceData(result.data, result)
      } else {
        renderPriceData(result.data, result)
      }
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      logger.newline()
      logger.error('Failed to fetch price', errorMsg)
      process.exit(1)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
    logger.newline()
    logger.error('Command failed', errorMsg)
    process.exit(1)
  }
}

// =============================================================================
// Legacy Support (Detailed Price Command)
// =============================================================================

export async function detailedPriceCommand(options: PriceCommandOptions = {}): Promise<void> {
  await priceCommand({ ...options, detailed: true })
}
