import ora from 'ora'
import {
  getRecommendedFees,
  getFeeHistory,
} from '@/services/chain'
import {
  formatSuccessMessage,
  formatErrorMessage,
  formatInfoLine,
  formatTimestamp,
  statusSymbol,
} from '@/utils/formatter'
import {
  withWatch,
  withJson,
  createWatchJsonFormatter,
  type BaseCommandOptions,
} from '@/commands/decorators'
import type { FeeEstimate, CommandResult } from '@/types'

// =============================================================================
// Fees Command Options
// =============================================================================

export interface FeesCommandOptions extends BaseCommandOptions {
  history?: number  // Hours of history to show
}

// =============================================================================
// Core Fees Command (Business Logic Only)
// =============================================================================

async function executeFeesCommand(options: {
  history?: number
}): Promise<CommandResult<FeeEstimate | FeeEstimate[]>> {
  const { history } = options

  if (history) {
    return getFeeHistory(history)
  } else {
    return getRecommendedFees()
  }
}

// =============================================================================
// Human-Readable Output Renderers
// =============================================================================

function renderFeesData(data: FeeEstimate | FeeEstimate[], result: CommandResult<any>, _showHistory = false) {
  if (Array.isArray(data)) {
    renderFeesHistory(data, result)
  } else {
    renderCurrentFees(data, result)
  }
}

function renderCurrentFees(data: FeeEstimate, result: CommandResult<any>) {
  console.log('')
  console.log(formatSuccessMessage('Bitcoin Fee Estimates'))
  console.log('')

  const feeTypes = [
    { key: 'fastest' as const, label: 'Next Block (Fastest)', value: data.fastest },
    { key: 'halfHour' as const, label: '~30 Minutes', value: data.halfHour },
    { key: 'hour' as const, label: '~1 Hour', value: data.hour },
    { key: 'economy' as const, label: '~24 Hours (Economy)', value: data.economy },
    { key: 'minimum' as const, label: 'Low Priority', value: data.minimum },
  ]

  feeTypes.forEach(({ label, value }) => {
    const feeText = formatFeeWithLevel(value)
    console.log(formatInfoLine(label, feeText))
  })

  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
}

function renderFeesHistory(history: FeeEstimate[], result: CommandResult<any>) {
  console.log('')
  console.log(formatSuccessMessage(`Bitcoin Fee History (${history.length} entries)`))
  console.log('')

  if (history.length === 0) {
    console.log('  No fee history available')
    return
  }

  // For now just show the current fees since we don't have real history
  const currentFees = history[0]
  if (currentFees) {
    renderCurrentFees(currentFees, result)
  }
}

// =============================================================================
// Watch Mode Renderers
// =============================================================================

const feesWatchRenderer = (data: FeeEstimate | FeeEstimate[], result: CommandResult<any>, previousData?: FeeEstimate | FeeEstimate[]) => {
  let changeText = ''
  
  if (previousData && !Array.isArray(data) && !Array.isArray(previousData)) {
    const fastestChange = data.fastest - previousData.fastest
    if (fastestChange !== 0) {
      const sign = fastestChange > 0 ? '+' : ''
      changeText = ` (${sign}${fastestChange} sat/vB)`
    }
  }

  console.log('')
  console.log(formatSuccessMessage('Bitcoin Fee Estimates' + changeText))
  console.log('')

  if (Array.isArray(data)) {
    renderFeesHistory(data, result)
  } else {
    const feeTypes = [
      { label: 'Next Block (Fastest)', value: data.fastest },
      { label: '~30 Minutes', value: data.halfHour },
      { label: '~1 Hour', value: data.hour },
      { label: '~24 Hours (Economy)', value: data.economy },
      { label: 'Low Priority', value: data.minimum },
    ]

    feeTypes.forEach(({ label, value }) => {
      const feeText = formatFeeWithLevel(value)
      console.log(formatInfoLine(label, feeText))
    })
  }

  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Interval', '30s'))
  console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
}

const feesJsonFormatter = (data: FeeEstimate | FeeEstimate[], result: CommandResult<any>) => {
  if (Array.isArray(data)) {
    return {
      history: data.map(fee => ({
        fastest  : fee.fastest,
        halfHour : fee.halfHour,
        hour     : fee.hour,
        economy  : fee.economy,
        minimum  : fee.minimum,
        unit     : fee.unit,
        timestamp: fee.timestamp.toISOString(),
      })),
      count        : data.length,
      executionTime: result.executionTime,
    }
  } else {
    return {
      fastest      : data.fastest,
      halfHour     : data.halfHour,
      hour         : data.hour,
      economy      : data.economy,
      minimum      : data.minimum,
      unit         : data.unit,
      timestamp    : data.timestamp.toISOString(),
      executionTime: result.executionTime,
    }
  }
}

const feesWatchJsonFormatter = createWatchJsonFormatter(
  feesJsonFormatter,
  (current: FeeEstimate | FeeEstimate[], previous: FeeEstimate | FeeEstimate[]) => {
    if (Array.isArray(current) || Array.isArray(previous)) {
      return {} // No comparison for arrays
    }
    
    return {
      fastestChange : current.fastest - previous.fastest,
      halfHourChange: current.halfHour - previous.halfHour,
      hourChange    : current.hour - previous.hour,
      economyChange : current.economy - previous.economy,
      minimumChange : current.minimum - previous.minimum,
    }
  }
)

// =============================================================================
// Utility Functions
// =============================================================================

function getFeeLevel(feeRate: number): 'low' | 'medium' | 'high' {
  if (feeRate < 10) {
    return 'low'
  } else if (feeRate < 50) {
    return 'medium'
  } else {
    return 'high'
  }
}

function getFeeEmoji(level: 'low' | 'medium' | 'high'): string {
  return statusSymbol(level)
}

function formatFeeWithLevel(fee: number): string {
  const level = getFeeLevel(fee)
  const emoji = getFeeEmoji(level)
  return `${emoji} ${fee} sat/vB`
}

// =============================================================================
// Decorated Command Functions
// =============================================================================

const watchFeesCommand = withWatch<FeesCommandOptions, FeeEstimate | FeeEstimate[]>(
  feesWatchRenderer,
  feesWatchJsonFormatter
)(executeFeesCommand)

const jsonFeesCommand = withJson<FeesCommandOptions, FeeEstimate | FeeEstimate[]>(
  feesJsonFormatter
)(executeFeesCommand)

// =============================================================================
// Main Fees Command Handler
// =============================================================================

export async function feesCommand(options: FeesCommandOptions = {}): Promise<void> {
  const {
    history,
    json = false,
    watch = false,
    interval = 30,
  } = options

  // Handle watch mode
  if (watch) {
    await watchFeesCommand({ history, json: json || false, interval })
    return
  }

  // Handle JSON mode
  if (json) {
    await jsonFeesCommand({ history, json: true })
    return
  }

  // Handle human-readable mode
  let spinner: ReturnType<typeof ora> | undefined
  
  if (history) {
    spinner = ora(`Fetching ${history}h fee history...`).start()
  } else {
    spinner = ora('Fetching fee estimates...').start()
  }

  try {
    const result = await executeFeesCommand({ history })

    if (spinner) {
      spinner.stop()
    }

    if (result.success && result.data) {
      renderFeesData(result.data, result, !!history)
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      console.error('')
      console.error(formatErrorMessage('Failed to fetch fee data', errorMsg))
      process.exit(1)
    }
  } catch (error) {
    if (spinner) {
      spinner.stop()
    }

    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('')
    console.error(formatErrorMessage('Command failed', errorMsg))
    process.exit(1)
  }
}
