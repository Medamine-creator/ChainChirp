import type { Currency } from '@/types'

// =============================================================================
// Currency Decorator Types
// =============================================================================

export interface CurrencyOptions {
  currency?: Currency
}

export interface CurrencyInfo {
  code    : string
  name    : string
  symbol  : string
  decimals: number
}

// =============================================================================
// Currency Configuration
// =============================================================================

export const SUPPORTED_CURRENCIES: Record<Currency, CurrencyInfo> = {
  usd: {
    code    : 'USD',
    name    : 'US Dollar',
    symbol  : '$',
    decimals: 2
  },
  eur: {
    code    : 'EUR',
    name    : 'Euro',
    symbol  : '€',
    decimals: 2
  },
  gbp: {
    code    : 'GBP',
    name    : 'British Pound',
    symbol  : '£',
    decimals: 2
  },
  jpy: {
    code    : 'JPY',
    name    : 'Japanese Yen',
    symbol  : '¥',
    decimals: 0
  },
  btc: {
    code    : 'BTC',
    name    : 'Bitcoin',
    symbol  : '₿',
    decimals: 8
  },
  eth: {
    code    : 'ETH',
    name    : 'Ethereum',
    symbol  : 'Ξ',
    decimals: 6
  },
  sats: {
    code    : 'SATS',
    name    : 'Satoshis',
    symbol  : 'sats',
    decimals: 0
  }
}

export const DEFAULT_CURRENCY: Currency = 'usd'

// =============================================================================
// Currency Validation Functions
// =============================================================================

export function isValidCurrency(currency: string): currency is Currency {
  return currency in SUPPORTED_CURRENCIES
}

export function validateCurrency(currency: string): Currency {
  const normalizedCurrency = currency.toLowerCase() as Currency
  
  if (!isValidCurrency(normalizedCurrency)) {
    const supportedList = Object.keys(SUPPORTED_CURRENCIES).join(', ')
    throw new Error(`Invalid currency '${currency}'. Supported currencies: ${supportedList}`)
  }
  
  return normalizedCurrency
}

export function getCurrencyInfo(currency: Currency): CurrencyInfo {
  return SUPPORTED_CURRENCIES[currency]
}

// =============================================================================
// Currency Formatting Functions
// =============================================================================

export function formatCurrencyValue(value: number, currency: Currency): string {
  const info = getCurrencyInfo(currency)
  
  if (currency === 'sats') {
    return `${value.toLocaleString()} ${info.symbol}`
  }
  
  if (currency === 'btc') {
    return `${info.symbol}${value.toFixed(info.decimals)}`
  }
  
  if (currency === 'jpy') {
    return `${info.symbol}${Math.round(value).toLocaleString()}`
  }
  
  return `${info.symbol}${value.toFixed(info.decimals)}`
}

export function convertToSats(value: number, currency: Currency): number {
  if (currency === 'sats') {
    return value
  }
  
  if (currency === 'btc') {
    return Math.round(value * 100000000) // 1 BTC = 100,000,000 sats
  }
  
  // For fiat currencies, we'd need exchange rate data
  // This is a placeholder - in real implementation, you'd fetch exchange rates
  throw new Error(`Cannot convert ${currency.toUpperCase()} to satoshis without exchange rate data`)
}

export function convertFromBtc(btcValue: number, targetCurrency: Currency): number {
  if (targetCurrency === 'btc') {
    return btcValue
  }
  
  if (targetCurrency === 'sats') {
    return Math.round(btcValue * 100000000)
  }
  
  // For fiat currencies, we'd need exchange rate data
  // This is a placeholder - in real implementation, you'd fetch exchange rates
  throw new Error(`Cannot convert BTC to ${targetCurrency.toUpperCase()} without exchange rate data`)
}

// =============================================================================
// Currency Decorator
// =============================================================================

export function withCurrency<T extends CurrencyOptions>(
  defaultCurrency: Currency = DEFAULT_CURRENCY
) {
  return function(target: (options: T) => Promise<void>) {
    return async function(options: T) {
      // Validate and normalize currency
      const currency = options.currency || defaultCurrency
      const validatedCurrency = validateCurrency(currency)
      
      // Execute original command with validated currency
      const updatedOptions = {
        ...options,
        currency: validatedCurrency
      }
      
      return target(updatedOptions)
    }
  }
}

// =============================================================================
// Currency Utilities
// =============================================================================

export function getSupportedCurrencies(): Currency[] {
  return Object.keys(SUPPORTED_CURRENCIES) as Currency[]
}

export function getCurrencyDisplayName(currency: Currency): string {
  const info = getCurrencyInfo(currency)
  return `${info.name} (${info.code})`
}

export function formatCurrencyList(): string {
  return getSupportedCurrencies()
    .map(currency => {
      const info = getCurrencyInfo(currency)
      return `${currency.padEnd(4)} - ${info.name} (${info.symbol})`
    })
    .join('\n')
}
