import ora from 'ora'
import {
  getCurrentHalving,
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
import type { HalvingData, CommandResult } from '@/types'

// =============================================================================
// Halving Command Options
// =============================================================================

export type HalvingCommandOptions = BaseCommandOptions

// =============================================================================
// Core Halving Command (Business Logic Only)
// =============================================================================

async function executeHalvingCommand(_options: Record<string, unknown>): Promise<CommandResult<HalvingData>> {
  return getCurrentHalving()
}

// =============================================================================
// Human-Readable Output Renderers
// =============================================================================

function renderHalvingData(data: HalvingData, result: CommandResult<any>) {
  console.log('')
  console.log(formatSuccessMessage('Bitcoin Halving Countdown'))
  console.log('')

  // Current block height
  const heightText = data.currentBlockHeight.toLocaleString()
  console.log(formatInfoLine('Current Block', heightText))

  // Next halving block
  const halvingHeightText = data.halvingBlockHeight.toLocaleString()
  console.log(formatInfoLine('Next Halving Block', halvingHeightText))

  // Blocks remaining with progress
  const remainingText = `${data.blocksRemaining.toLocaleString()} blocks`
  const progress = ((data.halvingBlockHeight - data.currentBlockHeight - data.blocksRemaining) / 210000) * 100
  const progressEmoji = getProgressEmoji(progress)
  console.log(formatInfoLine('Blocks Remaining', `${progressEmoji} ${remainingText}`))

  // Time estimates
  const timeText = formatTimeRemaining(data.daysRemaining)
  console.log(formatInfoLine('Estimated Time', timeText))

  // Estimated date
  const dateText = data.estimatedDate.toLocaleDateString('en-US', {
    month: 'long',
    day  : 'numeric',
    year : 'numeric',
  })
  console.log(formatInfoLine('Estimated Date', dateText))

  // Current and next rewards
  const currentRewardText = `${data.currentReward} BTC`
  const nextRewardText = `${data.nextReward} BTC`
  console.log('')
  console.log(formatInfoLine('Current Reward', currentRewardText))
  console.log(formatInfoLine('Next Reward', `${nextRewardText} (-50%)`))

  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
}

// =============================================================================
// Watch Mode Renderers
// =============================================================================

const halvingWatchRenderer = (data: HalvingData, result: CommandResult<any>, previousData?: HalvingData) => {
  let changeText = ''
  
  if (previousData) {
    const blockChange = previousData.blocksRemaining - data.blocksRemaining
    if (blockChange > 0) {
      changeText = ` (-${blockChange} blocks)`
    }
  }

  console.log('')
  console.log(formatSuccessMessage('Bitcoin Halving Countdown' + changeText))
  console.log('')

  const heightText = data.currentBlockHeight.toLocaleString()
  const halvingHeightText = data.halvingBlockHeight.toLocaleString()
  const remainingText = `${data.blocksRemaining.toLocaleString()} blocks`
  
  const progress = ((data.halvingBlockHeight - data.currentBlockHeight - data.blocksRemaining) / 210000) * 100
  const progressEmoji = getProgressEmoji(progress)
  const timeText = formatTimeRemaining(data.daysRemaining)

  console.log(formatInfoLine('Current Block', heightText))
  console.log(formatInfoLine('Next Halving Block', halvingHeightText))
  console.log(formatInfoLine('Blocks Remaining', `${progressEmoji} ${remainingText}`))
  console.log(formatInfoLine('Estimated Time', timeText))

  console.log('')
  console.log(formatInfoLine('Current Reward', `${data.currentReward} BTC`))
  console.log(formatInfoLine('Next Reward', `${data.nextReward} BTC (-50%)`))

  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Interval', '120s'))
  console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
}

const halvingJsonFormatter = (data: HalvingData, result: CommandResult<any>) => {
  return {
    currentBlockHeight: data.currentBlockHeight,
    halvingBlockHeight: data.halvingBlockHeight,
    blocksRemaining   : data.blocksRemaining,
    daysRemaining     : data.daysRemaining,
    estimatedDate     : data.estimatedDate.toISOString(),
    currentReward     : data.currentReward,
    nextReward        : data.nextReward,
    executionTime     : result.executionTime,
  }
}

const halvingWatchJsonFormatter = createWatchJsonFormatter(
  halvingJsonFormatter,
  (current: HalvingData, previous: HalvingData) => {
    const blockChange = previous.blocksRemaining - current.blocksRemaining
    const dayChange = previous.daysRemaining - current.daysRemaining
    
    return {
      blockChange: blockChange,
      dayChange  : dayChange,
    }
  }
)

// =============================================================================
// Utility Functions
// =============================================================================

function getProgressEmoji(progress: number): string {
  if (progress < 25) {
    return '🟢' // Early in cycle
  } else if (progress < 50) {
    return '🟡' // Mid cycle
  } else if (progress < 75) {
    return '🟠' // Late cycle
  } else {
    return '🔴' // Very close to halving
  }
}

function formatTimeRemaining(days: number): string {
  if (days < 1) {
    return 'Less than 1 day'
  } else if (days < 30) {
    return `${days} days`
  } else if (days < 365) {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    return remainingDays > 0 ? `${months} months, ${remainingDays} days` : `${months} months`
  } else {
    const years = Math.floor(days / 365)
    const remainingDays = days % 365
    const months = Math.floor(remainingDays / 30)
    if (months > 0) {
      return `${years} years, ${months} months`
    } else {
      return `${years} years`
    }
  }
}

// =============================================================================
// Decorated Command Functions
// =============================================================================

const watchHalvingCommand = withWatch<HalvingCommandOptions, HalvingData>(
  halvingWatchRenderer,
  halvingWatchJsonFormatter
)(executeHalvingCommand)

const jsonHalvingCommand = withJson<HalvingCommandOptions, HalvingData>(
  halvingJsonFormatter
)(executeHalvingCommand)

// =============================================================================
// Main Halving Command Handler
// =============================================================================

export async function halvingCommand(options: HalvingCommandOptions = {}): Promise<void> {
  const {
    json = false,
    watch = false,
    interval = 120, // Default 120s interval for halving (changes very slowly)
  } = options

  // Handle watch mode
  if (watch) {
    await watchHalvingCommand({ json: json || false, interval })
    return
  }

  // Handle JSON mode
  if (json) {
    await jsonHalvingCommand({ json: true })
    return
  }

  // Handle human-readable mode
  const spinner = ora('Calculating halving countdown...').start()

  try {
    const result = await executeHalvingCommand({})

    spinner.stop()

    if (result.success && result.data) {
      renderHalvingData(result.data, result)
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      console.error('')
      console.error(formatErrorMessage('Failed to fetch halving data', errorMsg))
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
