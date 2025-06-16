import { formatJson, formatSuccessMessage, formatErrorMessage } from '@/utils/formatter'
import type { CommandResult } from '@/types'

// =============================================================================
// Watch Decorator Types
// =============================================================================

export interface WatchOptions {
  watch?   : boolean
  interval?: number
  json?    : boolean
}

export interface WatchRenderer<T> {
  (data: T, result: CommandResult<T>, previousData?: T): void
}

export interface WatchJsonFormatter<T> {
  (data: T, result: CommandResult<T>, previousData?: T): Record<string, unknown>
}

export interface WatchChangeCalculator<T> {
  (current: T, previous: T): Record<string, unknown>
}

// =============================================================================
// Watch Decorator Implementation
// =============================================================================

export function withWatch<TOptions extends WatchOptions, TData>(
  humanRenderer: WatchRenderer<TData>,
  jsonFormatter: WatchJsonFormatter<TData>
) {
  return function (
    commandFn: (options: Omit<TOptions, 'watch' | 'interval'>) => Promise<CommandResult<TData>>
  ) {
    return async function (options: TOptions): Promise<void> {
      const { watch, interval = 30, ...commandOptions } = options

      if (!watch) {
        throw new Error('Watch decorator called without watch option')
      }

      let previousData: TData | undefined
      let intervalId: ReturnType<typeof setInterval>

      const executeWatch = async (): Promise<void> => {
        try {
          const result = await commandFn(commandOptions as Omit<TOptions, 'watch' | 'interval'>)

          if (result.success && result.data) {
            if (options.json) {
              const jsonData = jsonFormatter(result.data, result, previousData)
              console.log(formatJson(jsonData))
            } else {
              // Clear screen for interactive mode (but not for pipes/redirects)
              if (process.stdout.isTTY) {
                console.clear()
              }

              humanRenderer(result.data, result, previousData)
            }

            previousData = result.data
          } else {
            const errorMsg = result.error?.message || 'Unknown error occurred'
            if (options.json) {
              console.log(formatJson({ 
                error    : errorMsg, 
                timestamp: new Date().toISOString() 
              }))
            } else {
              console.error(formatErrorMessage('Watch failed', errorMsg))
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
          if (options.json) {
            console.log(formatJson({ 
              error    : errorMsg, 
              timestamp: new Date().toISOString() 
            }))
          } else {
            console.error(formatErrorMessage('Watch failed', errorMsg))
          }
        }
      }

      // Setup graceful shutdown handlers
      const cleanup = () => {
        if (intervalId) {
          clearInterval(intervalId)
        }
        if (!options.json) {
          console.log('\n' + formatSuccessMessage('Watch stopped'))
        }
        process.exit(0)
      }

      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)

      // Initial execution
      await executeWatch()

      // Set up interval
      intervalId = setInterval(executeWatch, interval * 1000)
    }
  }
}

// =============================================================================
// Common Watch Renderers
// =============================================================================

export const createBasicWatchRenderer = <T>(
  titleFn: (data: T, previousData?: T) => string,
  contentFn: (data: T, result: CommandResult<T>) => void,
  interval: number
): WatchRenderer<T> => {
  return (data: T, result: CommandResult<T>, previousData?: T) => {
    console.log('')
    console.log(formatSuccessMessage(titleFn(data, previousData)))
    contentFn(data, result)
    console.log('')
    console.log(`  ◦ Interval: ${interval}s`)
    console.log('  ◦ Press: Ctrl+C to exit')
  }
}

// =============================================================================
// Common JSON Formatters for Watch
// =============================================================================

export const createWatchJsonFormatter = <T>(
  baseFormatter: (data: T, result: CommandResult<T>) => Record<string, unknown>,
  changeCalculator?: WatchChangeCalculator<T>
): WatchJsonFormatter<T> => {
  return (data: T, result: CommandResult<T>, previousData?: T) => {
    const baseData = baseFormatter(data, result)
    
    if (previousData && changeCalculator) {
      const changes = changeCalculator(data, previousData)
      return {
        ...baseData,
        ...changes,
        timestamp: new Date().toISOString(),
      }
    }

    return {
      ...baseData,
      timestamp: new Date().toISOString(),
    }
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

export const calculatePriceChange = (current: number, previous: number) => ({
  change       : current - previous,
  changePercent: previous ? ((current - previous) / previous) * 100 : null,
})

export const extractPrice = (data: any): number => {
  return data.price || data.current || 0
}
