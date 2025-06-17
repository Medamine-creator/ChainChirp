import ora, { type Ora } from 'ora'
import {
  formatMetricLine,
  formatSuccessMessage,
  formatErrorMessage,
  formatWarningMessage,
  formatInfoMessage,
  formatTimestamp,
  isColorSupported,
  isTTY,
  stripAnsi,
  SYMBOLS,
  PALETTE,
} from './formatter'

// =============================================================================
// Logger State
// =============================================================================

let iconsEnabled = true
let currentSpinner: Ora | null = null

// =============================================================================
// Core Logger Functions
// =============================================================================

/**
 * Render a formatted line with label, value, and optional state
 */
export function renderLine(
  labelText: string,
  valueText: string | number,
  state?: 'success' | 'warning' | 'error' | 'info'
): void {
  const line = formatMetricLine(labelText, valueText, state)
  console.log(line)
}

/**
 * Render multiple metric lines at once
 */
export function renderLines(lines: Array<{
  label : string
  value : string | number
  state?: 'success' | 'warning' | 'error' | 'info'
}>): void {
  lines.forEach(({ label, value, state }) => {
    renderLine(label, value, state)
  })
}

// =============================================================================
// Status Messages
// =============================================================================

/**
 * Log success message with optional subtitle
 */
export function success(title: string, subtitle?: string): void {
  console.log(formatSuccessMessage(title, subtitle))
}

/**
 * Log error message with optional subtitle
 */
export function error(title: string, subtitle?: string): void {
  console.error(formatErrorMessage(title, subtitle))
}

/**
 * Log warning message with optional subtitle
 */
export function warning(title: string, subtitle?: string): void {
  console.log(formatWarningMessage(title, subtitle))
}

/**
 * Log info message with optional subtitle
 */
export function info(title: string, subtitle?: string): void {
  console.log(formatInfoMessage(title, subtitle))
}

// =============================================================================
// Spinner Management
// =============================================================================

/**
 * Create and start a spinner with enhanced options
 */
export function startSpinner(message: string, options: {
  interval?: number
} = {}): Ora {
  const { interval = process.env.SSH_CONNECTION ? 200 : 100 } = options
  
  if (currentSpinner) {
    currentSpinner.stop()
  }
  
  const spinner = ora({
    text   : message,
    interval,
    spinner: {
      interval,
      frames: SYMBOLS.spinner.split(''),
    },
    color    : 'cyan',
    // Disable in non-TTY or NO_COLOR environments
    isEnabled: isTTY() && isColorSupported(),
  }).start()
  
  currentSpinner = spinner
  return spinner
}

/**
 * Stop the current spinner
 */
export function stopSpinner(): void {
  if (currentSpinner) {
    currentSpinner.stop()
    currentSpinner = null
  }
}

/**
 * Update spinner text
 */
export function updateSpinner(message: string): void {
  if (currentSpinner) {
    currentSpinner.text = message
  }
}

/**
 * Succeed the current spinner with a message
 */
export function succeedSpinner(message?: string): void {
  if (currentSpinner) {
    currentSpinner.succeed(message)
    currentSpinner = null
  }
}

/**
 * Fail the current spinner with a message
 */
export function failSpinner(message?: string): void {
  if (currentSpinner) {
    currentSpinner.fail(message)
    currentSpinner = null
  }
}

/**
 * Warn with the current spinner
 */
export function warnSpinner(message?: string): void {
  if (currentSpinner) {
    currentSpinner.warn(message)
    currentSpinner = null
  }
}

/**
 * Higher-order function to wrap async operations with spinner
 */
export async function withSpinner<T>(
  asyncFn: () => Promise<T>,
  message: string,
  options: {
    successMessage?: string
    errorMessage?  : string
    interval?      : number
  } = {}
): Promise<T> {
  const { successMessage, errorMessage, interval } = options
  
  startSpinner(message, { interval })
  
  try {
    const result = await asyncFn()
    
    if (successMessage) {
      succeedSpinner(successMessage)
    } else {
      stopSpinner()
    }
    
    return result
  } catch (err) {
    if (errorMessage) {
      failSpinner(errorMessage)
    } else {
      stopSpinner()
    }
    throw err
  }
}

// =============================================================================
// Screen Management
// =============================================================================

/**
 * Clear screen (only in TTY environments)
 */
export function clearScreen(): void {
  if (isTTY()) {
    console.clear()
  }
}

/**
 * Move cursor up by specified lines
 */
export function cursorUp(lines: number = 1): void {
  if (isTTY() && isColorSupported()) {
    process.stdout.write(`\u001b[${lines}A`)
  }
}

/**
 * Clear current line
 */
export function clearLine(): void {
  if (isTTY() && isColorSupported()) {
    process.stdout.write('\u001b[2K\u001b[0G')
  }
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Disable icons globally
 */
export function disableIcons(): void {
  iconsEnabled = false
}

/**
 * Enable icons globally
 */
export function enableIcons(): void {
  iconsEnabled = true
}

/**
 * Check if icons are enabled
 */
export function areIconsEnabled(): boolean {
  return iconsEnabled && isColorSupported()
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Log a separator line
 */
export function separator(char: string = '─', length: number = 50): void {
  console.log(PALETTE.muted(char.repeat(length)))
}

/**
 * Log an empty line
 */
export function newline(): void {
  console.log()
}

/**
 * Log raw text (for JSON output, bypasses formatting)
 */
export function raw(text: string): void {
  console.log(text)
}

/**
 * Log clean text (strips ANSI codes)
 */
export function clean(text: string): void {
  console.log(stripAnsi(text))
}

/**
 * Create a timestamp for logging
 */
export function timestamp(): string {
  return formatTimestamp(new Date())
}

// =============================================================================
// Watch Mode Utilities
// =============================================================================

/**
 * Log watch mode header with timestamp and interval
 */
export function watchHeader(title: string, interval: number): void {
  console.log(formatSuccessMessage(title, `Refreshing every ${interval}s • ${timestamp()}`))
  newline()
}

/**
 * Log watch mode footer with instructions
 */
export function watchFooter(): void {
  newline()
  renderLine('Press', 'Ctrl+C to exit', 'info')
}

/**
 * Single spinner instance for watch mode
 */
let watchSpinner: Ora | null = null

/**
 * Start watch mode spinner (persistent across refreshes)
 */
export function startWatchSpinner(message: string = 'Refreshing…'): void {
  if (!watchSpinner) {
    watchSpinner = ora({
      text     : message,
      interval : 150,
      spinner  : 'dots',
      color    : 'cyan',
      isEnabled: isTTY() && isColorSupported(),
    })
  }
  
  watchSpinner.text = message
  watchSpinner.start()
}

/**
 * Stop watch mode spinner
 */
export function stopWatchSpinner(): void {
  if (watchSpinner && watchSpinner.isSpinning) {
    watchSpinner.stop()
  }
}

/**
 * Update watch spinner text
 */
export function updateWatchSpinner(message: string): void {
  if (watchSpinner) {
    watchSpinner.text = message
  }
}

// =============================================================================
// Export Default Logger Instance
// =============================================================================

export const logger = {
  // Core functions
  renderLine,
  renderLines,
  
  // Status messages
  success,
  error,
  warning,
  info,
  
  // Spinner management
  startSpinner,
  stopSpinner,
  updateSpinner,
  succeedSpinner,
  failSpinner,
  warnSpinner,
  withSpinner,
  
  // Screen management
  clearScreen,
  cursorUp,
  clearLine,
  
  // Configuration
  disableIcons,
  enableIcons,
  areIconsEnabled,
  
  // Utilities
  separator,
  newline,
  raw,
  clean,
  timestamp,
  
  // Watch mode
  watchHeader,
  watchFooter,
  startWatchSpinner,
  stopWatchSpinner,
  updateWatchSpinner,
} as const

export default logger
