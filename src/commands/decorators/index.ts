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

// =============================================================================
// Combined Decorator Types
// =============================================================================

export interface BaseCommandOptions {
  currency?: string
  json?    : boolean
  watch?   : boolean
  interval?: number
}
