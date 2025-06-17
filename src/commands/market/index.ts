// =============================================================================
// Market Commands Index
// =============================================================================

// Export all market command handlers
export { priceCommand, detailedPriceCommand } from './price'
export { volumeCommand } from './volume'
export { changeCommand } from './change'
export { highlowCommand } from './highlow'
export { sparklineCommand } from './sparkline'

// Export command option types
export type { PriceCommandOptions } from './price'
export type { VolumeCommandOptions } from './volume'
export type { ChangeCommandOptions } from './change'
export type { HighLowCommandOptions } from './highlow'
export type { SparklineCommandOptions } from './sparkline'

// =============================================================================
// Command Registry for CLI Integration
// =============================================================================

import type { Currency, TimeFrame } from '@/types'

export interface BaseCommandOptions {
  currency?: Currency
  json?    : boolean
  watch?   : boolean
  interval?: number
}

export interface MarketCommandHandlers {
  price    : (options?: BaseCommandOptions) => Promise<void>
  volume   : (options?: BaseCommandOptions) => Promise<void>
  change   : (options?: BaseCommandOptions & { detailed?: boolean }) => Promise<void>
  highlow  : (options?: BaseCommandOptions) => Promise<void>
  sparkline: (options?: BaseCommandOptions & { 
    timeframe?: TimeFrame
    width?    : number
    height?   : number
  }) => Promise<void>
}

// Create command registry
import {
  priceCommand,
  volumeCommand,
  changeCommand,
  highlowCommand,
  sparklineCommand,
} from '.'

export const marketCommands: MarketCommandHandlers = {
  price    : priceCommand,
  volume   : volumeCommand,
  change   : changeCommand,
  highlow  : highlowCommand,
  sparkline: sparklineCommand,
}

// =============================================================================
// Command Descriptions for Help System
// =============================================================================

export const marketCommandDescriptions = {
  price: {
    description: 'Get current Bitcoin price and comprehensive market data',
    usage      : 'chainchirp price [options]',
    examples   : [
      'chainchirp price',
      'chainchirp price --detailed',
      'chainchirp price --currency eur',
      'chainchirp price --json',
      'chainchirp price --watch --interval 5',
    ],
  },
  volume: {
    description: 'Get Bitcoin 24h trading volume across all major exchanges',
    usage      : 'chainchirp volume [options]',
    examples   : [
      'chainchirp volume',
      'chainchirp volume --currency eur',
      'chainchirp volume --json',
      'chainchirp volume --watch',
    ],
  },
  change: {
    description: 'Get Bitcoin price changes over multiple time periods',
    usage      : 'chainchirp change [options]',
    examples   : [
      'chainchirp change',
      'chainchirp change --detailed',
      'chainchirp change --watch --detailed',
      'chainchirp change --json',
    ],
  },
  highlow: {
    description: 'Get Bitcoin high/low prices (24h + all-time records)',
    usage      : 'chainchirp highlow [options] | chainchirp hl [options]',
    examples   : [
      'chainchirp highlow',
      'chainchirp hl',
      'chainchirp hl --watch',
      'chainchirp highlow --json',
    ],
  },
  sparkline: {
    description: 'Generate ASCII price charts with customizable timeframes',
    usage      : 'chainchirp sparkline [options] | chainchirp spark [options]',
    examples   : [
      'chainchirp sparkline',
      'chainchirp spark --timeframe 7d',
      'chainchirp sparkline --width 60 --height 10',
      'chainchirp spark --watch --timeframe 1h',
    ],
  },
} as const
