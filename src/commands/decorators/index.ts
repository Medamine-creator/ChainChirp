// =============================================================================
// Decorators Index - Centralized Command Decorators
// =============================================================================

export {
  // JSON Decorator
  withJson,
  type JsonOptions,
  type JsonFormatter,
  type JsonErrorFormatter,
  
  // JSON Formatters
  defaultJsonFormatter,
  defaultErrorFormatter,
  priceJsonFormatter,
  volumeJsonFormatter,
  changeJsonFormatter,
  highlowJsonFormatter,
  sparklineJsonFormatter,
} from './json'

export {
  // Watch Decorator
  withWatch,
  type WatchOptions,
  type WatchRenderer,
  type WatchJsonFormatter,
  type WatchChangeCalculator,
  
  // Watch Utilities
  createBasicWatchRenderer,
  createWatchJsonFormatter,
  calculatePriceChange,
  extractPrice,
} from './watch'

export {
  // Help Decorator
  withHelp,
  type HelpOptions,
  type CommandOption,
  
  // Help Formatters
  formatCommandHelp,
  formatGlobalHelp,
  createStandardOptions,
} from './help'

export {
  // Version Decorator
  withVersion,
  type VersionOptions,
  type VersionInfo,
  
  // Version Utilities
  formatVersionInfo,
  createDefaultVersionInfo,
  getVersionString,
  showVersion,
} from './version'

export {
  // Currency Decorator
  withCurrency,
  type CurrencyOptions,
  type CurrencyInfo,
  
  // Currency Configuration
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  
  // Currency Utilities
  isValidCurrency,
  validateCurrency,
  getCurrencyInfo,
  formatCurrencyValue,
  convertToSats,
  convertFromBtc,
  getSupportedCurrencies,
  getCurrencyDisplayName,
  formatCurrencyList,
} from './currency'

export {
  // Interval Decorator
  withInterval,
  type IntervalOptions,
  type IntervalConfig,
  
  // Interval Configuration
  DEFAULT_INTERVALS,
  GLOBAL_INTERVAL_CONFIG,
  
  // Interval Utilities
  validateInterval,
  normalizeInterval,
  getRecommendedInterval,
  formatInterval,
  formatIntervalRange,
  getIntervalRecommendations,
  createIntervalValidator,
  isValidIntervalRange,
  suggestOptimalInterval,
} from './interval'

// =============================================================================
// Combined Decorator Types
// =============================================================================

export interface BaseCommandOptions {
  currency?: string
  json?    : boolean
  watch?   : boolean
  interval?: number
  help?    : boolean
  version? : boolean
}
