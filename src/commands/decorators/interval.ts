// =============================================================================
// Interval Decorator Types
// =============================================================================

export interface IntervalOptions {
  interval?: number
}

export interface IntervalConfig {
  min        : number
  max        : number
  default    : number
  description: string
}

// =============================================================================
// Interval Configuration
// =============================================================================

export const DEFAULT_INTERVALS: Record<string, IntervalConfig> = {
  market: {
    min        : 5,
    max        : 3600,
    default    : 30,
    description: 'Market data updates (price, volume, etc.)'
  },
  mempool: {
    min        : 5,
    max        : 300,
    default    : 15,
    description: 'Mempool status and fee updates'
  },
  fees: {
    min        : 10,
    max        : 600,
    default    : 30,
    description: 'Transaction fee estimates'
  },
  hashrate: {
    min        : 30,
    max        : 3600,
    default    : 60,
    description: 'Network hashrate and difficulty'
  },
  halving: {
    min        : 60,
    max        : 3600,
    default    : 120,
    description: 'Bitcoin halving countdown'
  },
  block: {
    min        : 10,
    max        : 600,
    default    : 30,
    description: 'Blockchain block data'
  }
}

export const GLOBAL_INTERVAL_CONFIG: IntervalConfig = {
  min        : 5,
  max        : 3600,
  default    : 30,
  description: 'General update interval'
}

// =============================================================================
// Interval Validation Functions
// =============================================================================

export function validateInterval(
  interval: number,
  config: IntervalConfig = GLOBAL_INTERVAL_CONFIG
): number {
  if (!Number.isInteger(interval) || interval < 1) {
    throw new Error(`Interval must be a positive integer (provided: ${interval})`)
  }
  
  if (interval < config.min) {
    throw new Error(
      `Interval too small. Minimum: ${config.min}s (provided: ${interval}s)`
    )
  }
  
  if (interval > config.max) {
    throw new Error(
      `Interval too large. Maximum: ${config.max}s (provided: ${interval}s)`
    )
  }
  
  return interval
}

export function normalizeInterval(
  interval: number | string | undefined,
  config: IntervalConfig = GLOBAL_INTERVAL_CONFIG
): number {
  if (interval === undefined || interval === null) {
    return config.default
  }
  
  const numericInterval = typeof interval === 'string' 
    ? parseInt(interval, 10) 
    : interval
    
  if (isNaN(numericInterval)) {
    throw new Error(`Invalid interval format: ${interval}`)
  }
  
  return validateInterval(numericInterval, config)
}

export function getRecommendedInterval(commandType: string): number {
  const config = DEFAULT_INTERVALS[commandType] || GLOBAL_INTERVAL_CONFIG
  return config.default
}

// =============================================================================
// Interval Formatting Functions
// =============================================================================

export function formatInterval(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`
  }
  
  const hours = Math.floor(seconds / 3600)
  const remainingMinutes = Math.floor((seconds % 3600) / 60)
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`
}

export function formatIntervalRange(config: IntervalConfig): string {
  return `${formatInterval(config.min)} - ${formatInterval(config.max)}`
}

export function getIntervalRecommendations(commandType?: string): string {
  if (commandType && DEFAULT_INTERVALS[commandType]) {
    const config = DEFAULT_INTERVALS[commandType]
    return `Recommended: ${formatInterval(config.default)} (${formatIntervalRange(config)})`
  }
  
  return `Recommended: ${formatInterval(GLOBAL_INTERVAL_CONFIG.default)} (${formatIntervalRange(GLOBAL_INTERVAL_CONFIG)})`
}

// =============================================================================
// Interval Decorator
// =============================================================================

export function withInterval<T extends IntervalOptions>(
  commandType?: string,
  customConfig?: Partial<IntervalConfig>
) {
  return function(target: (options: T) => Promise<void>) {
    return async function(options: T) {
      // Get configuration for command type
      const baseConfig = commandType && DEFAULT_INTERVALS[commandType] 
        ? DEFAULT_INTERVALS[commandType]
        : GLOBAL_INTERVAL_CONFIG
        
      const config = customConfig 
        ? { ...baseConfig, ...customConfig }
        : baseConfig
      
      // Validate and normalize interval
      const validatedInterval = normalizeInterval(options.interval, config)
      
      // Execute original command with validated interval
      const updatedOptions = {
        ...options,
        interval: validatedInterval
      }
      
      return target(updatedOptions)
    }
  }
}

// =============================================================================
// Interval Utilities
// =============================================================================

export function createIntervalValidator(commandType: string) {
  const config = DEFAULT_INTERVALS[commandType] || GLOBAL_INTERVAL_CONFIG
  
  return function(interval: number | string | undefined): number {
    return normalizeInterval(interval, config)
  }
}

export function isValidIntervalRange(interval: number, commandType?: string): boolean {
  const config = commandType && DEFAULT_INTERVALS[commandType]
    ? DEFAULT_INTERVALS[commandType]
    : GLOBAL_INTERVAL_CONFIG
    
  return interval >= config.min && interval <= config.max
}

export function suggestOptimalInterval(commandType: string, currentLoad?: 'low' | 'medium' | 'high'): number {
  const config = DEFAULT_INTERVALS[commandType] || GLOBAL_INTERVAL_CONFIG
  
  if (!currentLoad) {
    return config.default
  }
  
  switch (currentLoad) {
    case 'low':
      return Math.max(config.min, Math.floor(config.default * 0.5))
    case 'medium':
      return config.default
    case 'high':
      return Math.min(config.max, Math.floor(config.default * 2))
    default:
      return config.default
  }
}
