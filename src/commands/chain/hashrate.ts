import ora from 'ora'
import {
  getCurrentHashrate,
} from '@/services/chain'
import {
  formatSuccessMessage,
  formatErrorMessage,
  formatInfoLine,
  formatTimestamp,
} from '@/utils/formatter'
import {
  withWatch,
  withJson,
  createWatchJsonFormatter,
  type BaseCommandOptions,
} from '@/commands/decorators'
import type { HashrateData, CommandResult } from '@/types'

// =============================================================================
// Hashrate Command Options
// =============================================================================

export type HashrateCommandOptions = BaseCommandOptions

// =============================================================================
// Core Hashrate Command (Business Logic Only)
// =============================================================================

async function executeHashrateCommand(_options: Record<string, unknown>): Promise<CommandResult<HashrateData>> {
  return getCurrentHashrate()
}

// =============================================================================
// Human-Readable Output Renderers
// =============================================================================

function renderHashrateData(data: HashrateData, result: CommandResult<any>) {
  console.log('')
  console.log(formatSuccessMessage('Bitcoin Network Hashrate'))
  console.log('')

  // Current hashrate
  const hashrateText = `${data.current} ${data.unit}`
  console.log(formatInfoLine('Current Hashrate', hashrateText))

  // Difficulty
  const difficultyText = data.difficulty.toLocaleString()
  console.log(formatInfoLine('Difficulty', difficultyText))

  // Difficulty adjustment progress
  const progressText = `${data.adjustmentProgress.toFixed(1)}%`
  const progressEmoji = getProgressEmoji(data.adjustmentProgress)
  console.log(formatInfoLine('Adjustment Progress', `${progressEmoji} ${progressText}`))

  // Time to next adjustment
  const timeText = formatTimeRemaining(data.estimatedTimeToAdjustment)
  console.log(formatInfoLine('Time to Adjustment', timeText))

  // Next adjustment date
  const dateText = data.nextAdjustmentDate.toLocaleDateString('en-US', {
    month : 'short',
    day   : 'numeric',
    year  : 'numeric',
    hour  : '2-digit',
    minute: '2-digit',
  })
  console.log(formatInfoLine('Next Adjustment', dateText))

  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
}

// =============================================================================
// Watch Mode Renderers
// =============================================================================

const hashrateWatchRenderer = (data: HashrateData, result: CommandResult<any>, previousData?: HashrateData) => {
  let changeText = ''
  
  if (previousData) {
    const hashrateChange = data.current - previousData.current
    if (Math.abs(hashrateChange) > 0.01) { // Only show significant changes
      const sign = hashrateChange > 0 ? '+' : ''
      const changePercent = ((hashrateChange / previousData.current) * 100).toFixed(2)
      changeText = ` (${sign}${hashrateChange.toFixed(2)} ${data.unit}, ${sign}${changePercent}%)`
    }
  }

  console.log('')
  console.log(formatSuccessMessage('Bitcoin Network Hashrate' + changeText))
  console.log('')

  const hashrateText = `${data.current} ${data.unit}`
  const progressText = `${data.adjustmentProgress.toFixed(1)}%`
  const progressEmoji = getProgressEmoji(data.adjustmentProgress)
  const timeText = formatTimeRemaining(data.estimatedTimeToAdjustment)

  console.log(formatInfoLine('Current Hashrate', hashrateText))
  console.log(formatInfoLine('Difficulty', data.difficulty.toLocaleString()))
  console.log(formatInfoLine('Adjustment Progress', `${progressEmoji} ${progressText}`))
  console.log(formatInfoLine('Time to Adjustment', timeText))

  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Interval', '60s'))
  console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
}

const hashrateJsonFormatter = (data: HashrateData, result: CommandResult<any>) => {
  return {
    current                  : data.current,
    unit                     : data.unit,
    difficulty               : data.difficulty,
    adjustmentProgress       : data.adjustmentProgress,
    estimatedTimeToAdjustment: data.estimatedTimeToAdjustment,
    nextAdjustmentDate       : data.nextAdjustmentDate.toISOString(),
    executionTime            : result.executionTime,
  }
}

const hashrateWatchJsonFormatter = createWatchJsonFormatter(
  hashrateJsonFormatter,
  (current: HashrateData, previous: HashrateData) => {
    const hashrateChange = current.current - previous.current
    const hashrateChangePercent = ((hashrateChange / previous.current) * 100)
    const difficultyChange = current.difficulty - previous.difficulty
    const progressChange = current.adjustmentProgress - previous.adjustmentProgress
    
    return {
      hashrateChange       : parseFloat(hashrateChange.toFixed(2)),
      hashrateChangePercent: parseFloat(hashrateChangePercent.toFixed(4)),
      difficultyChange     : difficultyChange,
      progressChange       : parseFloat(progressChange.toFixed(2)),
    }
  }
)

// =============================================================================
// Utility Functions
// =============================================================================

function getProgressEmoji(progress: number): string {
  if (progress < 25) {
    return '🟢' // Early in period
  } else if (progress < 50) {
    return '🟡' // Mid period
  } else if (progress < 75) {
    return '🟠' // Late period
  } else {
    return '🔴' // Very close to adjustment
  }
}

function formatTimeRemaining(seconds: number): string {
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minutes`
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  } else {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}d ${hours}h`
  }
}

// =============================================================================
// Decorated Command Functions
// =============================================================================

const watchHashrateCommand = withWatch<HashrateCommandOptions, HashrateData>(
  hashrateWatchRenderer,
  hashrateWatchJsonFormatter
)(executeHashrateCommand)

const jsonHashrateCommand = withJson<HashrateCommandOptions, HashrateData>(
  hashrateJsonFormatter
)(executeHashrateCommand)

// =============================================================================
// Main Hashrate Command Handler
// =============================================================================

export async function hashrateCommand(options: HashrateCommandOptions = {}): Promise<void> {
  const {
    json = false,
    watch = false,
    interval = 60, // Default 60s interval for hashrate (changes slowly)
  } = options

  // Handle watch mode
  if (watch) {
    await watchHashrateCommand({ json: json || false, interval })
    return
  }

  // Handle JSON mode
  if (json) {
    await jsonHashrateCommand({ json: true })
    return
  }

  // Handle human-readable mode
  const spinner = ora('Fetching network hashrate...').start()

  try {
    const result = await executeHashrateCommand({})

    spinner.stop()

    if (result.success && result.data) {
      renderHashrateData(result.data, result)
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      console.error('')
      console.error(formatErrorMessage('Failed to fetch hashrate data', errorMsg))
      process.exit(1)
    }
  } catch (error) {
    spinner.stop()

    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('')
    console.error(formatErrorMessage('Command failed', errorMsg))
    process.exit(1)
  }
}
