import chalk from 'chalk'
import type { Currency } from '@/types'

// =============================================================================
// Design System - Stripe/Vercel Quality Palette
// =============================================================================

export const PALETTE = {
  // Primary text colors
  primary: chalk.whiteBright,
  heading: chalk.cyanBright,
  muted  : chalk.dim,
  
  // State colors
  success: chalk.greenBright,
  warning: chalk.yellowBright,
  error  : chalk.redBright,
  info   : chalk.blueBright,
  
  // Accent colors (cyan → magenta → pink progression)
  cyan   : chalk.cyanBright,
  magenta: chalk.magentaBright,
  pink   : chalk.hex('#FF69B4'),
  
  // Utility
  bold: chalk.bold,
  dim : chalk.dim,
} as const

// =============================================================================
// Unicode Symbols (1-column width, reliable across terminals)
// =============================================================================

export const SYMBOLS = {
  success  : '✔',
  error    : '✖',
  warning  : '⚠',
  info     : ' ',
  bitcoin  : '₿',
  lightning: 'ᛋ',
  
  // Utility symbols
  arrow  : '→',
  bullet : '•',
  dash   : '─',
  spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
} as const

// =============================================================================
// Core Formatter Functions
// =============================================================================

/**
 * Format a metric label with consistent width (16 chars)
 */
export function label(text: string): string {
  return PALETTE.muted(text.padEnd(16))
}

/**
 * Format a value with optional color
 */
export function value(text: string | number, color?: keyof typeof PALETTE): string {
  const str = typeof text === 'number' ? text.toString() : text
  return color ? PALETTE[color](str) : PALETTE.primary(str)
}

/**
 * Get Unicode symbol for a given kind
 */
export function symbol(kind: keyof typeof SYMBOLS): string {
  return SYMBOLS[kind]
}

/**
 * Get colored status indicator (replaces emoji circles)
 */
export function statusSymbol(level: 'low' | 'medium' | 'high' | 'neutral'): string {
  const symbol = '●'
  
  switch (level) {
    case 'low'    : return PALETTE.success(symbol)  // Green
    case 'medium' : return PALETTE.warning(symbol)  // Yellow
    case 'high'   : return PALETTE.error(symbol)    // Red
    case 'neutral': return PALETTE.muted('○')       // Gray circle outline
    default       : return PALETTE.muted('○')
  }
}

/**
 * Strip ANSI escape codes from string (for --json mode)
 */
export function stripAnsi(str: string): string {
  // More comprehensive ANSI escape sequence removal
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[[0-9;]*[mGKHF]/g, '')
}

// =============================================================================
// Price Formatting (Enhanced)
// =============================================================================

export function formatPrice(
  price: number,
  currency: Currency = 'usd',
  options: {
    symbol?  : boolean
    decimals?: number
    compact? : boolean
  } = {}
): string {
  const { symbol: showSymbol = true, decimals = 2, compact = false } = options

  if (currency === 'sats') {
    return formatSats(price, compact)
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style                : showSymbol ? 'currency' : 'decimal',
    currency             : currency.toUpperCase(),
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation             : compact ? 'compact' : 'standard',
    // Add thousand separators for better readability
    useGrouping          : true,
  }).format(price)

  return formatted
}

export function formatSats(sats: number, compact: boolean = false): string {
  const formatted = new Intl.NumberFormat('en-US', {
    notation   : compact ? 'compact' : 'standard',
    useGrouping: true,
  }).format(sats)
  
  return `${formatted} sats`
}

export function formatPriceChange(
  change: number,
  isPercentage: boolean = false
): string {
  const prefix = change >= 0 ? '+' : ''
  const suffix = isPercentage ? '%' : ''
  const color = change >= 0 ? 'success' : 'error'
  
  return value(`${prefix}${change.toFixed(2)}${suffix}`, color)
}

// =============================================================================
// Volume & Market Cap Formatting (Enhanced)
// =============================================================================

export function formatVolume(volume: number, currency: Currency = 'usd'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    notation             : 'compact',
    maximumFractionDigits: 2,
  }).format(volume)
  
  return `${formatted} ${currency.toUpperCase()}`
}

export function formatMarketCap(marketCap: number, currency: Currency = 'usd'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    notation             : 'compact',
    maximumFractionDigits: 2,
  }).format(marketCap)
  
  return `${formatted} ${currency.toUpperCase()}`
}

// =============================================================================
// Time Formatting (Enhanced)
// =============================================================================

export function formatTimestamp(date: Date = new Date()): string {
  return date.toLocaleString('en-US', {
    hour  : '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
// Status Messages (Stripe/Vercel Style)
// =============================================================================

export function formatSuccessMessage(title: string, subtitle?: string): string {
  let message = `${PALETTE.success(SYMBOLS.success)} ${PALETTE.heading(title)}`
  if (subtitle) {
    message += `\n${' '.repeat(4)}${PALETTE.muted(subtitle)}`
  }
  return message
}

export function formatErrorMessage(title: string, subtitle?: string): string {
  let message = `${PALETTE.error(SYMBOLS.error)} ${PALETTE.heading(title)}`
  if (subtitle) {
    message += `\n${' '.repeat(4)}${PALETTE.muted(subtitle)}`
  }
  return message
}

export function formatWarningMessage(title: string, subtitle?: string): string {
  let message = `${PALETTE.warning(SYMBOLS.warning)} ${PALETTE.heading(title)}`
  if (subtitle) {
    message += `\n${' '.repeat(4)}${PALETTE.muted(subtitle)}`
  }
  return message
}

export function formatInfoMessage(title: string, subtitle?: string): string {
  let message = `${PALETTE.info(SYMBOLS.info)} ${PALETTE.heading(title)}`
  if (subtitle) {
    message += `\n${' '.repeat(4)}${PALETTE.muted(subtitle)}`
  }
  return message
}

// =============================================================================
// Metric Line Formatting (16-char label + value)
// =============================================================================

export function formatMetricLine(
  labelText: string, 
  valueText: string | number, 
  state?: 'success' | 'warning' | 'error' | 'info'
): string {
  // Always reserve 4 characters for symbol space to maintain alignment with wider labels
  const stateSymbol = state ? `${PALETTE[state](SYMBOLS[state])} ` : '  '
  const formattedLabel = label(labelText)
  const formattedValue = typeof valueText === 'string' ? valueText : value(valueText)
  
  return `${stateSymbol}${formattedLabel} ${formattedValue}`
}

// =============================================================================
// Table Formatting (Enhanced)
// =============================================================================

export function formatTable(
  headers: string[],
  rows: string[][],
  options: {
    padding?   : number
    separator? : string
    alignments?: ('left' | 'right' | 'center')[]
  } = {}
): string {
  const { padding = 2, separator = ' ', alignments = [] } = options
  
  // Calculate column widths based on content
  const widths = headers.map((header, i) => 
    Math.max(
      stripAnsi(header).length,
      ...rows.map(row => stripAnsi(row[i] || '').length)
    )
  )

  // Format header
  const headerRow = headers
    .map((header, i) => {
      const width = (widths[i] || 0) + padding
      return PALETTE.heading(header.padEnd(width))
    })
    .join(separator)

  // Format separator line
  const separatorRow = widths
    .map(width => PALETTE.muted(SYMBOLS.dash.repeat(width + padding)))
    .join(separator)

  // Format data rows with alignment
  const dataRows = rows.map(row =>
    row
      .map((cell, i) => {
        const width = (widths[i] || 0) + padding
        const alignment = alignments[i] || 'left'
        const cleanCell = cell || ''
        
        switch (alignment) {
          case 'right':
            return cleanCell.padStart(width)
          case 'center': {
            const totalPadding = width - stripAnsi(cleanCell).length
            const leftPadding = Math.floor(totalPadding / 2)
            const rightPadding = totalPadding - leftPadding
            return ' '.repeat(leftPadding) + cleanCell + ' '.repeat(rightPadding)
          }
          default:
            return cleanCell.padEnd(width)
        }
      })
      .join(separator)
  )

  return [ headerRow, separatorRow, ...dataRows ].join('\n')
}

// =============================================================================
// Sparkline Formatting (Enhanced)
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
  
  if (prices.length === 0) return PALETTE.muted('─'.repeat(width))
  
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min
  
  if (range === 0) return PALETTE.muted('─'.repeat(width))
  
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
    return trend >= 0 ? PALETTE.success(sparkline) : PALETTE.error(sparkline)
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
// Utility Functions
// =============================================================================

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping          : true,
  }).format(value)
}

// =============================================================================
// Environment Detection
// =============================================================================

export function isColorSupported(): boolean {
  return process.stdout.isTTY && !process.env.NO_COLOR
}

export function isTTY(): boolean {
  return process.stdout.isTTY
}

// =============================================================================
// Legacy Compatibility (Deprecated - use new functions above)
// =============================================================================

export function formatInfoLine(labelText: string, valueText: string): string {
  return formatMetricLine(labelText, valueText, 'info')
}

export function formatKeyValue(key: string, valueText: string, indent: number = 2): string {
  const spaces = ' '.repeat(indent)
  return `${spaces}${PALETTE.muted(key)}${PALETTE.primary(valueText)}`
}

export function formatLoadingMessage(message: string): string {
  return PALETTE.info(message)
}

// Re-export for backward compatibility
export const COLORS = {
  success: PALETTE.success,
  error  : PALETTE.error,
  warning: PALETTE.warning,
  info   : PALETTE.info,
  muted  : PALETTE.muted,
  white  : PALETTE.primary,
  bold   : PALETTE.bold,
} as const
