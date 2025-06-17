import { fetchWithFallback, blockchain } from '@/services/apiClient'
import type {
  HashrateData,
  BaseService,
  CommandResult,
} from '@/types'

// =============================================================================
// Hashrate Service Configuration
// =============================================================================

const HASHRATE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes (hashrate changes slowly)

interface HashrateCache {
  data     : HashrateData
  timestamp: number
}

interface MempoolSpaceDifficultyAdjustment {
  progressPercent      : number
  difficultyChange     : number
  estimatedRetargetDate: number
  remainingBlocks      : number
  remainingTime        : number
  previousRetarget     : number
  previousDifficulty   : number
  currentDifficulty    : number
  nextRetargetHeight   : number
  timeAvg              : number
  timeOffset           : number
  expectedBlocks       : number
}

interface MempoolSpaceBlockResponse {
  id               : string
  height           : number
  version          : number
  timestamp        : number
  tx_count         : number
  size             : number
  weight           : number
  merkle_root      : string
  previousblockhash: string
  mediantime       : number
  nonce            : number
  bits             : number
  difficulty       : number
}

interface BlockchainInfoStatsResponse {
  difficulty: number
  blocks    : number
  timestamp : number
}

// =============================================================================
// Hashrate Service Implementation
// =============================================================================

export class HashrateService implements BaseService {
  readonly name = 'HashrateService'
  readonly endpoints = [ '/v1/difficulty-adjustment', '/blocks', '/stats' ]

  private cache = new Map<string, HashrateCache>()

  // ===========================================================================
  // Core Hashrate Methods
  // ===========================================================================

  async getCurrentHashrate(): Promise<HashrateData> {
    const cacheKey = 'current-hashrate'
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < HASHRATE_CACHE_TTL) {
      return cached.data
    }

    try {
      // Get difficulty adjustment info and current blocks in parallel
      const [ difficultyData, blocks ] = await Promise.all([
        fetchWithFallback<MempoolSpaceDifficultyAdjustment>(
          '/v1/difficulty-adjustment',
          {},
          { providers: [ 'mempool' ] }
        ),
        fetchWithFallback<MempoolSpaceBlockResponse[]>(
          '/blocks',
          {},
          { providers: [ 'mempool' ] }
        )
      ])

      if (!blocks || blocks.length === 0) {
        throw new Error('No blocks returned from API')
      }

      const latestBlock = blocks[0]
      if (!latestBlock) {
        throw new Error('Latest block is undefined')
      }

      // Calculate network hashrate from current difficulty
      const hashrate = this.calculateHashrateFromDifficulty(latestBlock.difficulty)
      const { value, unit } = this.formatHashrate(hashrate)

      // Calculate reasonable time to adjustment from remaining blocks
      const reasonableTimeToAdjustment = difficultyData.remainingBlocks * 10 * 60 // blocks * 10 minutes * 60 seconds

      const hashrateData: HashrateData = {
        current                  : value,
        unit                     : unit,
        difficulty               : latestBlock.difficulty,
        adjustmentProgress       : difficultyData.progressPercent,
        estimatedTimeToAdjustment: reasonableTimeToAdjustment,
        nextAdjustmentDate       : new Date(Date.now() + reasonableTimeToAdjustment * 1000),
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : hashrateData,
        timestamp: Date.now(),
      })

      return hashrateData
    } catch (error) {
      // Fallback to blockstream API if mempool.space fails
      try {
        const blocks = await fetchWithFallback<MempoolSpaceBlockResponse[]>(
          '/blocks',
          {},
          { providers: [ 'blockstream' ] }
        )

        if (!blocks || blocks.length === 0) {
          throw new Error('No blocks returned from API')
        }

        const latestBlock = blocks[0]
        if (!latestBlock) {
          throw new Error('Latest block is undefined')
        }

        const hashrate = this.calculateHashrateFromDifficulty(latestBlock.difficulty)
        const { value, unit } = this.formatHashrate(hashrate)

        // Calculate rough adjustment progress (block height % 2016)
        const blocksIntoAdjustment = latestBlock.height % 2016
        const adjustmentProgress = (blocksIntoAdjustment / 2016) * 100

        const hashrateData: HashrateData = {
          current                  : value,
          unit                     : unit,
          difficulty               : latestBlock.difficulty,
          adjustmentProgress       : adjustmentProgress,
          estimatedTimeToAdjustment: (2016 - blocksIntoAdjustment) * 10 * 60, // Rough estimate
          nextAdjustmentDate       : new Date(Date.now() + (2016 - blocksIntoAdjustment) * 10 * 60 * 1000),
        }

        // Cache the result
        this.cache.set(cacheKey, {
          data     : hashrateData,
          timestamp: Date.now(),
        })

        return hashrateData
      } catch {
        // Final fallback to blockchain.info
        try {
          const stats = await blockchain<BlockchainInfoStatsResponse>('/stats')
          
          const hashrate = this.calculateHashrateFromDifficulty(stats.difficulty)
          const { value, unit } = this.formatHashrate(hashrate)

          // Calculate rough adjustment progress
          const blocksIntoAdjustment = stats.blocks % 2016
          const adjustmentProgress = (blocksIntoAdjustment / 2016) * 100

          const hashrateData: HashrateData = {
            current                  : value,
            unit                     : unit,
            difficulty               : stats.difficulty,
            adjustmentProgress       : adjustmentProgress,
            estimatedTimeToAdjustment: (2016 - blocksIntoAdjustment) * 10 * 60,
            nextAdjustmentDate       : new Date(Date.now() + (2016 - blocksIntoAdjustment) * 10 * 60 * 1000),
          }

          // Cache the result
          this.cache.set(cacheKey, {
            data     : hashrateData,
            timestamp: Date.now(),
          })

          return hashrateData
        } catch {
          throw new Error(
            `Failed to fetch hashrate data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          )
        }
      }
    }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private calculateHashrateFromDifficulty(difficulty: number): number {
    // Network hashrate = difficulty * 2^32 / target_time
    // Target time is 600 seconds (10 minutes)
    return (difficulty * Math.pow(2, 32)) / 600
  }

  private formatHashrate(hashrate: number): { value: number; unit: 'TH/s' | 'EH/s' } {
    if (hashrate >= 1e18) {
      return { value: parseFloat((hashrate / 1e18).toFixed(2)), unit: 'EH/s' }
    } else {
      return { value: parseFloat((hashrate / 1e12).toFixed(2)), unit: 'TH/s' }
    }
  }

  private formatTimeRemaining(seconds: number): string {
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

  // ===========================================================================
  // Service Interface Methods
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      await this.getCurrentHashrate()
      return true
    } catch {
      return false
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): {
    size: number
    keys: string[]
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// =============================================================================
// Service Instance & Convenience Functions
// =============================================================================

let hashrateServiceInstance: HashrateService | null = null

export function getHashrateService(): HashrateService {
  if (!hashrateServiceInstance) {
    hashrateServiceInstance = new HashrateService()
  }
  return hashrateServiceInstance
}

// Convenience functions for easy usage
export async function getCurrentHashrate(): Promise<CommandResult<HashrateData>> {
  const startTime = Date.now()

  try {
    const service = getHashrateService()
    const hashrateData = await service.getCurrentHashrate()

    return {
      success      : true,
      data         : hashrateData,
      timestamp    : new Date(),
      executionTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success      : false,
      error        : error as Error,
      timestamp    : new Date(),
      executionTime: Date.now() - startTime,
    }
  }
}
