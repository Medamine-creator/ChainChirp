// =============================================================================
// Chain Commands Index
// =============================================================================

// Export all chain command handlers
export { blockCommand } from './block'
export { mempoolCommand } from './mempool'
export { feesCommand } from './fees'
export { hashrateCommand } from './hashrate'
export { halvingCommand } from './halving'

// Export command option types
export type { BlockCommandOptions } from './block'
export type { MempoolCommandOptions } from './mempool'
export type { FeesCommandOptions } from './fees'
export type { HashrateCommandOptions } from './hashrate'
export type { HalvingCommandOptions } from './halving'

// =============================================================================
// Command Registry for CLI Integration
// =============================================================================

import type { BaseCommandOptions } from '@/commands/decorators'

export interface ChainCommandHandlers {
  block: (options?: BaseCommandOptions & { 
    recent?: number
    hash?  : string
  }) => Promise<void>
  mempool: (options?: BaseCommandOptions & { 
    detailed?: boolean 
  }) => Promise<void>
  fees: (options?: BaseCommandOptions & { 
    history?: number
  }) => Promise<void>
  hashrate: (options?: BaseCommandOptions) => Promise<void>
  halving : (options?: BaseCommandOptions) => Promise<void>
}

// Create command registry
import { blockCommand, mempoolCommand, feesCommand, hashrateCommand, halvingCommand } from '.'

export const chainCommands: ChainCommandHandlers = {
  block   : blockCommand,
  mempool : mempoolCommand,
  fees    : feesCommand,
  hashrate: hashrateCommand,
  halving : halvingCommand,
}

// =============================================================================
// Command Descriptions for Help System
// =============================================================================

export const chainCommandDescriptions = {
  block: {
    description: 'Get latest Bitcoin block information and recent blocks',
    usage      : 'chainchirp block [options]',
    examples   : [
      'chainchirp block',
      'chainchirp block --recent 5',
      'chainchirp block --hash 000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
      'chainchirp block --json',
      'chainchirp block --watch',
    ],
  },
  mempool: {
    description: 'Get Bitcoin mempool status and congestion analysis',
    usage      : 'chainchirp mempool [options]',
    examples   : [
      'chainchirp mempool',
      'chainchirp mempool --detailed',
      'chainchirp mempool --watch',
      'chainchirp mempool --json',
      'chainchirp mempool --watch --detailed',
    ],
  },
  fees: {
    description: 'Get Bitcoin fee estimates for transaction prioritization',
    usage      : 'chainchirp fees [options]',
    examples   : [
      'chainchirp fees',
      'chainchirp fees --history 24',
      'chainchirp fees --watch',
      'chainchirp fees --json',
      'chainchirp fees --watch --json',
    ],
  },
  hashrate: {
    description: 'Get Bitcoin network hashrate and difficulty adjustment progress',
    usage      : 'chainchirp hashrate [options]',
    examples   : [
      'chainchirp hashrate',
      'chainchirp hashrate --watch',
      'chainchirp hashrate --json',
      'chainchirp hashrate --watch --json',
    ],
  },
  halving: {
    description: 'Get Bitcoin halving countdown and reward information',
    usage      : 'chainchirp halving [options]',
    examples   : [
      'chainchirp halving',
      'chainchirp halving --watch',
      'chainchirp halving --json',
      'chainchirp halving --watch --json',
    ],
  },
} as const
