import { formatJson } from '@/utils/formatter'
import type { CommandResult } from '@/types'

// =============================================================================
// JSON Decorator Types
// =============================================================================

export interface JsonOptions {
  json?: boolean
}

export interface JsonFormatter<T> {
  (data: T, result: CommandResult<T>): Record<string, unknown>
}

export interface JsonErrorFormatter {
  (error: string): Record<string, unknown>
}

// =============================================================================
// JSON Decorator Implementation
// =============================================================================

export function withJson<TOptions extends JsonOptions, TData>(
  formatter: JsonFormatter<TData>,
  errorFormatter?: JsonErrorFormatter
) {
  return function (
    commandFn: (options: Omit<TOptions, 'json'>) => Promise<CommandResult<TData>>
  ) {
    return async function (options: TOptions): Promise<void> {
      const { json, ...commandOptions } = options
      const result = await commandFn(commandOptions as Omit<TOptions, 'json'>)

      if (result.success && result.data) {
        if (json) {
          const jsonData = formatter(result.data, result)
          console.log(formatJson(jsonData))
        } else {
          // Let the command handle human-readable output
          return
        }
      } else {
        const errorMsg = result.error?.message || 'Unknown error occurred'
        if (json) {
          const errorData = errorFormatter 
            ? errorFormatter(errorMsg)
            : { error: errorMsg }
          console.log(formatJson(errorData))
        } else {
          throw result.error || new Error(errorMsg)
        }
        process.exit(1)
      }
    }
  }
}

// =============================================================================
// Common JSON Formatters
// =============================================================================

export const defaultJsonFormatter = <T>(data: T, result: CommandResult<T>) => ({
  ...data,
  timestamp    : result.timestamp.toISOString(),
  executionTime: result.executionTime,
})

export const defaultErrorFormatter = (error: string) => ({
  error,
  timestamp: new Date().toISOString(),
})

export const priceJsonFormatter = (data: any, result: CommandResult<any>) => ({
  price        : data.price,
  currency     : data.currency?.toUpperCase(),
  timestamp    : result.timestamp.toISOString(),
  executionTime: result.executionTime,
})

export const volumeJsonFormatter = (data: any, result: CommandResult<any>) => ({
  volume24h             : data.volume24h,
  volumeChange24h       : data.volumeChange24h,
  volumeChangePercent24h: data.volumeChangePercent24h,
  currency              : data.currency?.toUpperCase(),
  timestamp             : data.timestamp.toISOString(),
  executionTime         : result.executionTime,
})

export const changeJsonFormatter = (data: any, result: CommandResult<any>) => ({
  current         : data.current,
  change1h        : data.change1h,
  change24h       : data.change24h,
  change7d        : data.change7d,
  change30d       : data.change30d,
  changePercent1h : data.changePercent1h,
  changePercent24h: data.changePercent24h,
  changePercent7d : data.changePercent7d,
  changePercent30d: data.changePercent30d,
  currency        : data.currency?.toUpperCase(),
  executionTime   : result.executionTime,
})

export const highlowJsonFormatter = (data: any, result: CommandResult<any>) => ({
  current             : data.current,
  high24h             : data.high24h,
  low24h              : data.low24h,
  ath                 : data.ath,
  athDate             : data.athDate.toISOString(),
  atl                 : data.atl,
  atlDate             : data.atlDate.toISOString(),
  currency            : data.currency?.toUpperCase(),
  athChangePercent    : data.athChangePercent,
  atlChangePercent    : data.atlChangePercent,
  high24hChangePercent: data.high24hChangePercent,
  low24hChangePercent : data.low24hChangePercent,
  executionTime       : result.executionTime,
})

export const sparklineJsonFormatter = (data: any, result: CommandResult<any>) => ({
  prices       : data.prices,
  timeframe    : data.timeframe,
  currency     : data.currency?.toUpperCase(),
  width        : data.width,
  height       : data.height,
  executionTime: result.executionTime,
})
