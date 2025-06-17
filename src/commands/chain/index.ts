// =============================================================================
// Chain Commands Index
// =============================================================================

// Export all chain command handlers
export { blockCommand } from './block'
export { mempoolCommand } from './mempool'

// Export command option types
export type { BlockCommandOptions } from './block'
export type { MempoolCommandOptions } from './mempool'

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
  // TODO: Add other chain commands as they are implemented
  // fees   : (options?: BaseCommandOptions & { history?: number }) => Promise<void>
  // hashrate: (options?: BaseCommandOptions & { detailed?: boolean }) => Promise<void>
  // halving: (options?: BaseCommandOptions & { history?: boolean }) => Promise<void>
}

// Create command registry
import { blockCommand, mempoolCommand } from '.'

export const chainCommands: ChainCommandHandlers = {
  block  : blockCommand,
  mempool: mempoolCommand,
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
  // TODO: Add descriptions for other chain commands
} as const
