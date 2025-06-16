import { formatJson } from '@/utils/formatter'
import type { CommandResult } from '@/types'

// =============================================================================
// JSON Output Decorator Types
// =============================================================================

export interface JsonOptions {
  json?: boolean
}

export interface OutputHandlers<T> {
  success: (data: T, result: CommandResult<T>) => void
  error: (error: string) => void
}

// =============================================================================
// JSON Output Decorator
// =============================================================================

export function withJsonOutput<T>(
  handlers: OutputHandlers<T>
) {
  return function (options: JsonOptions = {}) {
    const { json = false } = options

    return {
      handleSuccess(data: T, result: CommandResult<T>): void {
        if (json) {
          // For JSON output, we need to determine what data to show
          // This will be customized per command type
          console.log(formatJson({
            ...(typeof data === 'object' && data !== null ? data : { data }),
            executionTime: result.executionTime,
            timestamp: result.timestamp.toISOString(),
          }))
        } else {
          handlers.success(data, result)
        }
      },

      handleError(error: string): void {
        if (json) {
          console.log(formatJson({ 
            error,
            timestamp: new Date().toISOString()
          }))
        } else {
          handlers.error(error)
        }
      },

      isJsonMode(): boolean {
        return json
      }
    }
  }
}

// =============================================================================
// JSON Output Helper Functions
// =============================================================================

export function createJsonSuccessHandler<T>(
  dataTransformer: (data: T, result: CommandResult<T>) => Record<string, unknown>
) {
  return function (data: T, result: CommandResult<T>): void {
    const transformedData = dataTransformer(data, result)
    console.log(formatJson({
      ...transformedData,
      executionTime: result.executionTime,
      timestamp: result.timestamp.toISOString(),
    }))
  }
}

export function createJsonErrorHandler() {
  return function (error: string): void {
    console.log(formatJson({ 
      error,
      timestamp: new Date().toISOString()
    }))
  }
}

// =============================================================================
// Specialized JSON Handlers for Common Command Types
// =============================================================================

export const jsonHandlers = {
  price: {
    success: createJsonSuccessHandler((data: any, result) => ({
      price: data.price,
      currency: data.currency?.toUpperCase() || 'USD',
    })),
    error: createJsonErrorHandler()
  },

  volume: {
    success: createJsonSuccessHandler((data: any, result) => ({
      volume24h: data.volume24h,
      volumeChange24h: data.volumeChange24h,
      volumeChangePercent24h: data.volumeChangePercent24h,
      currency: data.currency?.toUpperCase() || 'USD',
    })),
    error: createJsonErrorHandler()
  },

  change: {
    success: createJsonSuccessHandler((data: any, result) => ({
      current: data.current,
      change1h: data.change1h,
      change24h: data.change24h,
      change7d: data.change7d,
      change30d: data.change30d,
      changePercent1h: data.changePercent1h,
      changePercent24h: data.changePercent24h,
      changePercent7d: data.changePercent7d,
      changePercent30d: data.changePercent30d,
      currency: data.currency?.toUpperCase() || 'USD',
    })),
    error: createJsonErrorHandler()
  },

  highlow: {
    success: createJsonSuccessHandler((data: any, result) => ({
      current: data.current,
      high24h: data.high24h,
      low24h: data.low24h,
      ath: data.ath,
      athDate: data.athDate?.toISOString(),
      atl: data.atl,
      atlDate: data.atlDate?.toISOString(),
      athChangePercent: data.athChangePercent,
      atlChangePercent: data.atlChangePercent,
      currency: data.currency?.toUpperCase() || 'USD',
    })),
    error: createJsonErrorHandler()
  },

  sparkline: {
    success: createJsonSuccessHandler((data: any, result) => ({
      prices: data.prices,
      timeframe: data.timeframe,
      currency: data.currency?.toUpperCase() || 'USD',
      width: data.width,
      height: data.height,
    })),
    error: createJsonErrorHandler()
  }
}
