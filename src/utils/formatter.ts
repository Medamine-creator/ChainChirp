import chalk from 'chalk'
import type { Currency } from '@/types'

// =============================================================================
// Formatting Constants
// =============================================================================

export const SYMBOLS = {
  success: '✓',
  error  : '✕',
  info   : '◦',
  arrow  : '→',
  bullet : '•',
  dash   : '─',
} as const

export const COLORS = {
  success: chalk.green,
  error  : chalk.red,
  warning: chalk.yellow,
  info   : chalk.blue,
  muted  : chalk.gray,
  white  : chalk.white,
  bold   : chalk.bold,
} as const

// =============================================================================
// Price Formatting
// =============================================================================

export function formatPrice(
  price: number,
  currency: Currency = 'usd',
  options: {
    symbol?  : boolean
    decimals?: number
  } = {}
): string {
  const { symbol = true, decimals = 2 } = options

  if (currency === 'sats') {
    return formatSats(price)
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style                : symbol ? 'currency' : 'decimal',
    currency             : currency.toUpperCase(),
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price)

  return formatted
}

export function formatSats(sats: number): string {
  return new Intl.NumberFormat('en-US').format(sats) + ' sats'
}

export function formatPriceChange(
  change: number,
  isPercentage: boolean = false
): string {
  const prefix = change >= 0 ? '+' : ''
  const suffix = isPercentage ? '%' : ''
  const color = change >= 0 ? COLORS.success : COLORS.error
  
  return color(`${prefix}${change.toFixed(2)}${suffix}`)
}

// =============================================================================
// Volume & Market Cap Formatting  
// =============================================================================

export function formatVolume(volume: number, currency: Currency = 'usd'): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B ${currency.toUpperCase()}`
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M ${currency.toUpperCase()}`
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K ${currency.toUpperCase()}`
  }
  return `${volume.toFixed(2)} ${currency.toUpperCase()}`
}

export function formatMarketCap(marketCap: number, currency: Currency = 'usd'): string {
  if (marketCap >= 1e12) {
    return `${(marketCap / 1e12).toFixed(2)}T ${currency.toUpperCase()}`
  } else if (marketCap >= 1e9) {
    return `${(marketCap / 1e9).toFixed(2)}B ${currency.toUpperCase()}`
  } else if (marketCap >= 1e6) {
    return `${(marketCap / 1e6).toFixed(2)}M ${currency.toUpperCase()}`
  }
  return `${marketCap.toFixed(2)} ${currency.toUpperCase()}`
}

// =============================================================================
// Time Formatting
// =============================================================================

export function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month : 'short',
    day   : 'numeric',
    hour  : '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
}

// =============================================================================
// Output Formatting
// =============================================================================

export function formatSuccessMessage(title: string, subtitle?: string): string {
  let message = COLORS.success(SYMBOLS.success) + ' ' + COLORS.bold(title)
  if (subtitle) {
    message += '\n  ' + COLORS.muted(subtitle)
  }
  return message
}

export function formatErrorMessage(title: string, subtitle?: string): string {
  let message = COLORS.error(SYMBOLS.error) + ' ' + COLORS.bold(title)
  if (subtitle) {
    message += '\n  ' + COLORS.muted(subtitle)
  }
  return message
}

export function formatInfoLine(label: string, value: string): string {
  return `  ${COLORS.muted(SYMBOLS.info + ' ' + label + ':')} ${COLORS.white(value)}`
}

export function formatKeyValue(key: string, value: string, indent: number = 2): string {
  const spaces = ' '.repeat(indent)
  return `${spaces}${COLORS.muted(key)}${COLORS.white(value)}`
}

// =============================================================================
// Table Formatting
// =============================================================================

export function formatTable(
  headers: string[],
  rows: string[][],
  options: {
    padding?  : number
    separator?: string
  } = {}
): string {
  const { padding = 2, separator = ' ' } = options
  
  // Calculate column widths
  const widths = headers.map((header, i) => 
    Math.max(
      header.length,
      ...rows.map(row => (row[i] || '').length)
    )
  )

  // Format header
  const headerRow = headers
    .map((header, i) => header.padEnd((widths[i] || 0) + padding))
    .join(separator)

  // Format separator line
  const separatorRow = widths
    .map(width => COLORS.muted(SYMBOLS.dash.repeat(width + padding)))
    .join(separator)

  // Format data rows
  const dataRows = rows.map(row =>
    row
      .map((cell, i) => (cell || '').padEnd((widths[i] || 0) + padding))
      .join(separator)
  )

  return [
    COLORS.bold(headerRow),
    separatorRow,
    ...dataRows
  ].join('\n')
}

// =============================================================================
// Sparkline Formatting
// =============================================================================

export function formatSparkline(
  prices: number[],
  options: {
    width? : number
    height?: number
    color? : boolean
  } = {}
): string {
  const { width = 20, height = 8, color = true } = options
  
  if (prices.length === 0) return ''
  
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min
  
  if (range === 0) return '─'.repeat(width)
  
  const chars = [ '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█' ]
  const step = width / prices.length
  
  let sparkline = ''
  for (let i = 0; i < width; i++) {
    const priceIndex = Math.floor(i / step)
    const price = prices[priceIndex] ?? prices[prices.length - 1] ?? 0
    const normalized = (price - min) / range
    const charIndex = Math.min(Math.floor(normalized * height), chars.length - 1)
    sparkline += chars[charIndex]
  }
  
  if (color) {
    const firstPrice = prices[0] ?? 0
    const lastPrice = prices[prices.length - 1] ?? 0
    const trend = lastPrice - firstPrice
    return trend >= 0 ? COLORS.success(sparkline) : COLORS.error(sparkline)
  }
  
  return sparkline
}

// =============================================================================
// JSON Formatting
// =============================================================================

export function formatJson(data: unknown, space: number = 2): string {
  return JSON.stringify(data, null, space)
}

// =============================================================================
// Loading States
// =============================================================================

export function formatLoadingMessage(message: string): string {
  return COLORS.info(message)
}

// =============================================================================
// Utility Functions
// =============================================================================

export function stripAnsi(str: string): string {
  // Simple ANSI escape sequence removal
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[[0-9;]*m/g, '')
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
