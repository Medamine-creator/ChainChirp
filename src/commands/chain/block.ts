import ora from 'ora'
import {
  getCurrentBlock,
  getRecentBlocks,
  getBlockByHash,
} from '@/services/chain'
import {
  formatSuccessMessage,
  formatErrorMessage,
  formatInfoLine,
  formatTimestamp,
  formatNumber,
  formatTable,
} from '@/utils/formatter'
import {
  withWatch,
  withJson,
  createWatchJsonFormatter,
  type BaseCommandOptions,
} from '@/commands/decorators'
import type { BlockData, CommandResult } from '@/types'

// =============================================================================
// Block Command Options
// =============================================================================

export interface BlockCommandOptions extends BaseCommandOptions {
  recent?: number  // Show N recent blocks
  hash?  : string  // Get specific block by hash
}

// =============================================================================
// Core Block Command (Business Logic Only)
// =============================================================================

async function executeBlockCommand(options: {
  recent?: number
  hash?  : string
}): Promise<CommandResult<BlockData | BlockData[]>> {
  const { recent, hash } = options

  if (hash) {
    return getBlockByHash(hash)
  } else if (recent) {
    return getRecentBlocks(recent)
  } else {
    return getCurrentBlock()
  }
}

// =============================================================================
// Human-Readable Output Renderers
// =============================================================================

function renderBlockData(data: BlockData, result: CommandResult<any>) {
  const formattedHeight = formatNumber(data.height, 0)
  const formattedTxCount = formatNumber(data.txCount, 0)
  const formattedSize = formatSize(data.size)
  const formattedWeight = formatWeight(data.weight)
  const formattedDifficulty = formatDifficulty(data.difficulty)

  console.log('')
  console.log(formatSuccessMessage('Latest Bitcoin Block'))
  console.log('')
  console.log(formatInfoLine('Height', formattedHeight))
  console.log(formatInfoLine('Hash', data.hash))
  console.log(formatInfoLine('Timestamp', formatTimestamp(new Date(data.timestamp * 1000))))
  console.log(formatInfoLine('Age', data.age))
  console.log(formatInfoLine('Transactions', formattedTxCount))
  
  if (data.size > 0) {
    console.log(formatInfoLine('Size', formattedSize))
  }
  
  if (data.weight > 0) {
    console.log(formatInfoLine('Weight', formattedWeight))
  }
  
  if (data.difficulty > 0) {
    console.log(formatInfoLine('Difficulty', formattedDifficulty))
  }
  
  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
}

function renderRecentBlocksData(blocks: BlockData[], result: CommandResult<any>) {
  console.log('')
  console.log(formatSuccessMessage(`Recent ${blocks.length} Bitcoin Blocks`))
  console.log('')

  const headers = [ 'Height', 'Age', 'Transactions', 'Size', 'Hash' ]
  const rows = blocks.map(block => [
    formatNumber(block.height, 0),
    block.age,
    formatNumber(block.txCount, 0),
    formatSize(block.size),
    `${block.hash.substring(0, 16)}...`
  ])

  console.log(formatTable(headers, rows))
  console.log('')
  console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
  console.log(formatInfoLine('Latency', `${result.executionTime}ms`))
}

// =============================================================================
// Watch Mode Renderers
// =============================================================================

const blockWatchRenderer = (data: BlockData | BlockData[], result: CommandResult<any>, previousData?: any) => {
  if (Array.isArray(data)) {
    renderRecentBlocksData(data, result)
  } else {
    let changeText = ''
    
    if (previousData && !Array.isArray(previousData)) {
      const currentHeight = data.height
      const previousHeight = previousData.height
      
      if (currentHeight > previousHeight) {
        const newBlocks = currentHeight - previousHeight
        changeText = ` (+${newBlocks} ${newBlocks === 1 ? 'block' : 'blocks'})`
      }
    }

    console.log('')
    console.log(formatSuccessMessage('Latest Bitcoin Block' + changeText))
    console.log('')
    console.log(formatInfoLine('Height', formatNumber(data.height, 0)))
    console.log(formatInfoLine('Hash', data.hash))
    console.log(formatInfoLine('Age', data.age))
    console.log(formatInfoLine('Transactions', formatNumber(data.txCount, 0)))
    console.log('')
    console.log(formatInfoLine('Updated', formatTimestamp(result.timestamp)))
    console.log(formatInfoLine('Interval', '30s'))
    console.log(formatInfoLine('Press', 'Ctrl+C to exit'))
  }
}

const blockJsonFormatter = (data: BlockData | BlockData[], result: CommandResult<any>) => {
  if (Array.isArray(data)) {
    return {
      blocks: data.map(block => ({
        height    : block.height,
        hash      : block.hash,
        timestamp : block.timestamp,
        age       : block.age,
        txCount   : block.txCount,
        size      : block.size,
        weight    : block.weight,
        difficulty: block.difficulty,
      })),
      count        : data.length,
      executionTime: result.executionTime,
    }
  } else {
    return {
      height       : data.height,
      hash         : data.hash,
      timestamp    : data.timestamp,
      age          : data.age,
      txCount      : data.txCount,
      size         : data.size,
      weight       : data.weight,
      difficulty   : data.difficulty,
      executionTime: result.executionTime,
    }
  }
}

const blockWatchJsonFormatter = createWatchJsonFormatter(
  blockJsonFormatter,
  (current: BlockData | BlockData[], previous: BlockData | BlockData[]) => {
    if (Array.isArray(current) || Array.isArray(previous)) {
      return {} // No comparison for arrays
    }
    
    return {
      heightChange: current.height - previous.height,
      newBlocks   : current.height > previous.height ? current.height - previous.height : 0,
    }
  }
)

// =============================================================================
// Utility Functions
// =============================================================================

function formatSize(bytes: number): string {
  if (bytes === 0) return 'N/A'
  
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  }
  return `${bytes} bytes`
}

function formatWeight(weight: number): string {
  if (weight === 0) return 'N/A'
  
  if (weight >= 1000000) {
    return `${(weight / 1000000).toFixed(2)} MWU`
  } else if (weight >= 1000) {
    return `${(weight / 1000).toFixed(2)} KWU`
  }
  return `${weight} WU`
}

function formatDifficulty(difficulty: number): string {
  if (difficulty === 0) return 'N/A'
  
  if (difficulty >= 1e15) {
    return `${(difficulty / 1e15).toFixed(2)}P`
  } else if (difficulty >= 1e12) {
    return `${(difficulty / 1e12).toFixed(2)}T`
  } else if (difficulty >= 1e9) {
    return `${(difficulty / 1e9).toFixed(2)}B`
  }
  return formatNumber(difficulty, 0)
}

// =============================================================================
// Decorated Command Functions
// =============================================================================

const watchBlockCommand = withWatch<BlockCommandOptions, BlockData | BlockData[]>(
  blockWatchRenderer,
  blockWatchJsonFormatter
)(executeBlockCommand)

const jsonBlockCommand = withJson<BlockCommandOptions, BlockData | BlockData[]>(
  blockJsonFormatter
)(executeBlockCommand)

// =============================================================================
// Main Block Command Handler
// =============================================================================

export async function blockCommand(options: BlockCommandOptions = {}): Promise<void> {
  const {
    recent,
    hash,
    json = false,
    watch = false,
    interval = 30,
  } = options

  // Handle watch mode
  if (watch) {
    await watchBlockCommand({ recent, hash, json, interval })
    return
  }

  // Handle JSON mode
  if (json) {
    await jsonBlockCommand({ recent, hash })
    return
  }

  // Handle human-readable mode
  let spinner: ReturnType<typeof ora> | undefined
  
  if (hash) {
    spinner = ora(`Fetching block ${hash}...`).start()
  } else if (recent) {
    spinner = ora(`Fetching recent ${recent} blocks...`).start()
  } else {
    spinner = ora('Fetching latest block...').start()
  }

  try {
    const result = await executeBlockCommand({ recent, hash })

    if (spinner) {
      spinner.stop()
    }

    if (result.success && result.data) {
      if (Array.isArray(result.data)) {
        renderRecentBlocksData(result.data, result)
      } else {
        renderBlockData(result.data, result)
      }
    } else {
      const errorMsg = result.error?.message || 'Unknown error occurred'
      console.error('')
      console.error(formatErrorMessage('Failed to fetch block data', errorMsg))
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
