import { fetchWithFallback, blockchain } from '@/services/apiClient'
import type {
  HalvingData,
  BaseService,
  CommandResult,
} from '@/types'

// =============================================================================
// Halving Service Configuration
// =============================================================================

const HALVING_CACHE_TTL = 10 * 60 * 1000 // 10 minutes (halving data changes slowly)

interface HalvingCache {
  data     : HalvingData
  timestamp: number
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
// Bitcoin Halving Constants
// =============================================================================

const HALVING_INTERVAL = 210000 // Blocks between halvings
const INITIAL_REWARD = 50 // Initial block reward in BTC
const TARGET_BLOCK_TIME = 10 * 60 // 10 minutes in seconds

// Bitcoin halving history for reference
// Genesis: 50 BTC (2009-01-03)
// 1st halving: 25 BTC (2012-11-28, block 210,000)
// 2nd halving: 12.5 BTC (2016-07-09, block 420,000)
// 3rd halving: 6.25 BTC (2020-05-11, block 630,000)
// 4th halving: 3.125 BTC (2024-04-20, block 840,000) ← Current
// 5th halving: 1.5625 BTC (≈2028, block 1,050,000) ← Next

// =============================================================================
// Halving Service Implementation
// =============================================================================

export class HalvingService implements BaseService {
  readonly name = 'HalvingService'
  readonly endpoints = [ '/blocks', '/stats', '/blocks/tip/height' ]

  private cache = new Map<string, HalvingCache>()

  // ===========================================================================
  // Core Halving Methods
  // ===========================================================================

  async getCurrentHalving(): Promise<HalvingData> {
    const cacheKey = 'current-halving'
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < HALVING_CACHE_TTL) {
      return cached.data
    }

    try {
      // Get current block height from mempool.space or blockstream
      const currentBlockHeight = await this.getCurrentBlockHeight()
      
      // Calculate halving data
      const halvingData = this.calculateHalvingData(currentBlockHeight)

      // Cache the result
      this.cache.set(cacheKey, {
        data     : halvingData,
        timestamp: Date.now(),
      })

      return halvingData
    } catch (error) {
      throw new Error(
        `Failed to fetch halving data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private async getCurrentBlockHeight(): Promise<number> {
    try {
      // Try mempool.space first
      const blocks = await fetchWithFallback<MempoolSpaceBlockResponse[]>(
        '/blocks',
        {},
        { providers: [ 'mempool', 'blockstream' ] }
      )

      if (blocks && blocks.length > 0 && blocks[0]) {
        return blocks[0].height
      }

      throw new Error('No blocks returned from primary APIs')
    } catch {
      // Fallback to blockchain.info
      try {
        const stats = await blockchain<BlockchainInfoStatsResponse>('/stats')
        return stats.blocks
      } catch {
        throw new Error('Failed to get current block height from all APIs')
      }
    }
  }

  private calculateHalvingData(currentBlockHeight: number): HalvingData {
    // Find current halving epoch
    const currentEpoch = Math.floor(currentBlockHeight / HALVING_INTERVAL)
    
    // Calculate next halving block height
    const nextHalvingBlockHeight = (currentEpoch + 1) * HALVING_INTERVAL
    
    // Calculate current and next rewards
    const currentReward = this.calculateReward(currentEpoch)
    const nextReward = this.calculateReward(currentEpoch + 1)
    
    // Calculate blocks remaining
    const blocksRemaining = nextHalvingBlockHeight - currentBlockHeight
    
    // Estimate time to halving (blocks * 10 minutes)
    const secondsRemaining = blocksRemaining * TARGET_BLOCK_TIME
    const daysRemaining = Math.ceil(secondsRemaining / (24 * 60 * 60))
    
    // Estimate halving date
    const estimatedDate = new Date(Date.now() + secondsRemaining * 1000)

    return {
      currentBlockHeight: currentBlockHeight,
      halvingBlockHeight: nextHalvingBlockHeight,
      blocksRemaining   : blocksRemaining,
      estimatedDate     : estimatedDate,
      daysRemaining     : daysRemaining,
      currentReward     : currentReward,
      nextReward        : nextReward,
    }
  }

  private calculateReward(epoch: number): number {
    // Each halving reduces reward by half
    return INITIAL_REWARD / Math.pow(2, epoch)
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private formatTimeRemaining(days: number): string {
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

  private getHalvingProgress(currentHeight: number): number {
    const currentEpoch = Math.floor(currentHeight / HALVING_INTERVAL)
    const epochStartHeight = currentEpoch * HALVING_INTERVAL
    const progressInEpoch = currentHeight - epochStartHeight
    return (progressInEpoch / HALVING_INTERVAL) * 100
  }

  // ===========================================================================
  // Service Interface Methods
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      await this.getCurrentHalving()
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

let halvingServiceInstance: HalvingService | null = null

export function getHalvingService(): HalvingService {
  if (!halvingServiceInstance) {
    halvingServiceInstance = new HalvingService()
  }
  return halvingServiceInstance
}

// Convenience functions for easy usage
export async function getCurrentHalving(): Promise<CommandResult<HalvingData>> {
  const startTime = Date.now()

  try {
    const service = getHalvingService()
    const halvingData = await service.getCurrentHalving()

    return {
      success      : true,
      data         : halvingData,
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
