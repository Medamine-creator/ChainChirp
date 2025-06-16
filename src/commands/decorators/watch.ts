import { formatSuccessMessage } from '@/utils/formatter'

// =============================================================================
// Watch Mode Decorator Types
// =============================================================================

export interface WatchOptions {
  watch?   : boolean
  interval?: number
}

export interface WatchHandler<T> {
  execute: () => Promise<T>
  onData: (data: T) => void
  onError: (error: Error) => void
}

// =============================================================================
// Watch Mode Decorator
// =============================================================================

export function withWatch<T>(handler: WatchHandler<T>) {
  return function (options: WatchOptions = {}) {
    const { watch = false, interval = 30 } = options

    if (!watch) {
      // Single execution mode
      return {
        async run(): Promise<void> {
          try {
            const data = await handler.execute()
            handler.onData(data)
          } catch (error) {
            handler.onError(error as Error)
          }
        }
      }
    }

    // Watch mode
    return {
      async run(): Promise<void> {
        let intervalId: NodeJS.Timeout | null = null

        const executeWatch = async (): Promise<void> => {
          try {
            const data = await handler.execute()
            handler.onData(data)
          } catch (error) {
            handler.onError(error as Error)
          }
        }

        // Handle graceful shutdown
        const cleanup = () => {
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          console.log('\n' + formatSuccessMessage('Watch stopped'))
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
}

// =============================================================================
// Watch Mode Helper Functions
// =============================================================================

export function createWatchHandler<T>(
  executeFunction: () => Promise<T>,
  onDataFunction: (data: T) => void,
  onErrorFunction: (error: Error) => void
): WatchHandler<T> {
  return {
    execute: executeFunction,
    onData: onDataFunction,
    onError: onErrorFunction,
  }
}

export function clearScreen(): void {
  if (process.stdout.isTTY) {
    console.clear()
  }
}

// =============================================================================
// Watch Mode Display Helpers
// =============================================================================

export function createWatchDisplayInfo(interval: number): string[] {
  return [
    `Interval: ${interval}s`,
    'Press: Ctrl+C to exit'
  ]
}
