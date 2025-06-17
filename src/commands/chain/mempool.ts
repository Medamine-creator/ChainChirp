import ora from 'ora'
import {
  getMempoolInfo,
} from '@/services/chain'
import {
  formatSuccessMessage,
  formatErrorMessage,
  formatInfoLine,
  formatTimestamp,
  formatNumber,
} from '@/utils/formatter'
import {
  withWatch,
  withJson,
  createWatchJsonFormatter,
  type BaseCommandOptions,
} from '@/commands/decorators'
import type { MempoolInfo, CommandResult } from '@/types'

// =============================================================================
// Mempool Command Options
// =============================================================================

export interface MempoolCommandOptions extends BaseCommandOptions {
  detailed?: boolean  // Show fee histogram + analysis
}

// =============================================================================
// Core Mempool Command (Business Logic Only)
// =============================================================================

async function executeMempoolCommand(_options: {
  detailed?: boolean
}): Promise<CommandResult<MempoolInfo>> {
  return getMempoolInfo()
}

// =============================================================================
// Human-Readable Output Renderers
// =============================================================================

function renderMempoolData(data: MempoolInfo, result: CommandResult<any>, detailed = false) {
  const formattedCount = formatNumber(data.count, 0)
  const formattedVsize = formatVsize(data.vsize)
  const formattedFees = formatFees(data.totalFees)
  const congestionEmoji = getCongestionEmoji(data.congestionLevel)
  const congestionText = data.congestionLevel.charAt(0).toUpperCase() + data.congestionLevel.slice(1)

  console.log('')
  console.log(formatSuccessMessage('Bitcoin Mempool Status'))
  console.log('')
  console.log(formatInfoLine('Transactions', formattedCount))
  console.log(formatInfoLine('Virtual Size', formattedVsize))
  console.log(formatInfoLine('Total Fees', formattedFees))
  console.log(formatInfoLine('Congestion', `${congestionEmoji} ${congestionText}`))

  if (detailed && data.feeHistogram.length > 0) {
    console.log('')
    console.log(formatSuccessMessage('Fee Histogram'))
    console.log('')
    renderFeeHistogram(data.feeHistogram)
  }

  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
}

function renderFeeHistogram(histogram: number[][]) {
  console.log('  Fee Range (sat/vB)    Transactions')
  console.log('  ──────────────────    ────────────')
  
  histogram.slice(0, 10).forEach((entry) => {
    const feeRate = entry[0] || 0
    const txCount = entry[1] || 0
    
    const feeRangeText = `${feeRate}+`.padEnd(18)
    const txCountText = formatNumber(txCount, 0)
    const barLength = Math.min(Math.floor(txCount / Math.max(...histogram.map(h => h[1] || 1)) * 20), 20)
    const bar = '█'.repeat(barLength).padEnd(20)
    
    console.log(`  ${feeRangeText}    ${txCountText.padStart(8)} ${bar}`)
  })
}

// =============================================================================
// Watch Mode Renderers
// =============================================================================

const mempoolWatchRenderer = (data: MempoolInfo, result: CommandResult<any>, previousData?: MempoolInfo) => {
  let changeText = ''
  
  if (previousData) {
    const txDiff = data.count - previousData.count
    if (txDiff !== 0) {
      const sign = txDiff > 0 ? '+' : ''
      changeText = ` (${sign}${txDiff} txs)`
    }
  }

  const congestionEmoji = getCongestionEmoji(data.congestionLevel)
  const congestionText = data.congestionLevel.charAt(0).toUpperCase() + data.congestionLevel.slice(1)

  console.log('')
  console.log(formatSuccessMessage('Bitcoin Mempool Status' + changeText))
  console.log('')
  console.log(formatInfoLine('Transactions', formatNumber(data.count, 0)))
  console.log(formatInfoLine('Virtual Size', formatVsize(data.vsize)))
  console.log(formatInfoLine('Total Fees', formatFees(data.totalFees)))
  console.log(formatInfoLine('Congestion', `${congestionEmoji} ${congestionText}`))
  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Interval', '15s'))
  console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
}

const mempoolJsonFormatter = (data: MempoolInfo, result: CommandResult<any>) => {
  return {
    count          : data.count,
    vsize          : data.vsize,
    totalFees      : data.totalFees,
    congestionLevel: data.congestionLevel,
    feeHistogram   : data.feeHistogram,
    executionTime  : result.executionTime,
  }
}

const mempoolWatchJsonFormatter = createWatchJsonFormatter(
  mempoolJsonFormatter,
  (current: MempoolInfo, previous: MempoolInfo) => {
    return {
      txCountChange     : current.count - previous.count,
      vsizeChange       : current.vsize - previous.vsize,
      feesChange        : current.totalFees - previous.totalFees,
      congestionChange  : current.congestionLevel !== previous.congestionLevel,
      newCongestionLevel: current.congestionLevel,
      oldCongestionLevel: previous.congestionLevel,
    }
  }
)

// =============================================================================
// Utility Functions
// =============================================================================

function formatVsize(vsize: number): string {
  if (vsize === 0) return 'N/A'
  
  if (vsize >= 1000000) {
    return `${(vsize / 1000000).toFixed(2)} MB`
  } else if (vsize >= 1000) {
    return `${(vsize / 1000).toFixed(2)} KB`
  }
  return `${vsize} vB`
}

function formatFees(sats: number): string {
  if (sats === 0) return 'N/A'
  
  if (sats >= 100000000) {
    return `${(sats / 100000000).toFixed(2)} BTC`
  } else if (sats >= 1000) {
    return `${(sats / 1000).toFixed(0)}K sats`
  }
  return `${sats} sats`
}

function getCongestionEmoji(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low'   : return '🟢'
    case 'medium': return '🟡'
    case 'high'  : return '🔴'
  }
}

// =============================================================================
// Decorated Command Functions
// =============================================================================

const watchMempoolCommand = withWatch<MempoolCommandOptions, MempoolInfo>(
  mempoolWatchRenderer,
  mempoolWatchJsonFormatter
)(executeMempoolCommand)

const jsonMempoolCommand = withJson<MempoolCommandOptions, MempoolInfo>(
  mempoolJsonFormatter
)(executeMempoolCommand)

// =============================================================================
// Main Mempool Command Handler
// =============================================================================

export async function mempoolCommand(options: MempoolCommandOptions = {}): Promise<void> {
  const {
    detailed = false,
    json = false,
    watch = false,
    interval = 15, // Faster interval for mempool updates
  } = options

  // Handle watch mode
  if (watch) {
    await watchMempoolCommand({ detailed, json: json || false, interval })
    return
  }

  // Handle JSON mode
  if (json) {
    await jsonMempoolCommand({ detailed, json: true })
    return
  }

  // Handle human-readable mode
  let spinner: ReturnType<typeof ora> | undefined
  spinner = ora('Fetching mempool status...').start()

  try {
    const result = await executeMempoolCommand({ detailed })

    if (spinner) {
      spinner.stop()
    }

    if (result.success && result.data) {
      renderMempoolData(result.data, result, detailed)
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      console.error('')
      console.error(formatErrorMessage('Failed to fetch mempool data', errorMsg))
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
