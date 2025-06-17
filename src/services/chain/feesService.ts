import { fetchWithFallback } from '@/services/apiClient'
import { statusSymbol } from '@/utils/formatter'
import type {
  FeeEstimate,
  BaseService,
  CommandResult,
} from '@/types'

// =============================================================================
// Fees Service Configuration
// =============================================================================

const FEES_CACHE_TTL = 30 * 1000 // 30 seconds

interface FeesCache {
  data     : FeeEstimate
  timestamp: number
}

interface MempoolSpaceFeesResponse {
  fastestFee : number
  halfHourFee: number
  hourFee    : number
  economyFee : number
  minimumFee : number
}

interface BlockstreamFeesResponse {
  [key: string]: number // e.g., "1": 20, "6": 15, "144": 10
}

// =============================================================================
// Fees Service Implementation
// =============================================================================

export class FeesService implements BaseService {
  readonly name = 'FeesService'
  readonly endpoints = [ '/v1/fees/recommended', '/fee-estimates' ]

  private cache = new Map<string, FeesCache>()

  // ===========================================================================
  // Core Fees Methods
  // ===========================================================================

  async getRecommendedFees(): Promise<FeeEstimate> {
    const cacheKey = 'recommended-fees'
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < FEES_CACHE_TTL) {
      return cached.data
    }

    try {
      // Try mempool.space first (primary)
      const feesData = await fetchWithFallback<MempoolSpaceFeesResponse>(
        '/v1/fees/recommended',
        {},
        {
          providers: [ 'mempool', 'blockstream' ]
        }
      )

      const feeEstimate: FeeEstimate = {
        fastest  : feesData.fastestFee,
        halfHour : feesData.halfHourFee,
        hour     : feesData.hourFee,
        economy  : feesData.economyFee,
        minimum  : feesData.minimumFee,
        unit     : 'sat/vB',
        timestamp: new Date(),
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : feeEstimate,
        timestamp: Date.now(),
      })

      return feeEstimate
    } catch (error) {
      // Fallback to blockstream
      try {
        const blockstreamData = await fetchWithFallback<BlockstreamFeesResponse>(
          '/fee-estimates',
          {},
          {
            providers: [ 'blockstream' ]
          }
        )

        // Map blockstream data to our structure
        const feeEstimate: FeeEstimate = {
          fastest  : blockstreamData['1'] || blockstreamData['2'] || 20,
          halfHour : blockstreamData['3'] || blockstreamData['6'] || 15,
          hour     : blockstreamData['6'] || blockstreamData['12'] || 10,
          economy  : blockstreamData['144'] || blockstreamData['504'] || 5,
          minimum  : blockstreamData['1008'] || 1,
          unit     : 'sat/vB',
          timestamp: new Date(),
        }

        // Cache the result
        this.cache.set(cacheKey, {
          data     : feeEstimate,
          timestamp: Date.now(),
        })

        return feeEstimate
      } catch {
        throw new Error(
          `Failed to fetch fee estimates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }
  }

  async getFeeHistory(_hours: number = 24): Promise<FeeEstimate[]> {
    // For now, return single current estimate as mempool.space doesn't have history endpoint
    // This could be enhanced with a time-series storage solution
    try {
      const currentFees = await this.getRecommendedFees()
      
      // Simulate basic history by returning the current fees
      // In a real implementation, you'd store historical data
      return [ currentFees ]
    } catch (error) {
      throw new Error(
        `Failed to fetch fee history: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private getFeeLevel(feeRate: number): 'low' | 'medium' | 'high' {
    if (feeRate < 10) {
      return 'low'
    } else if (feeRate < 50) {
      return 'medium'
    } else {
      return 'high'
    }
  }

  private getFeeEmoji(level: 'low' | 'medium' | 'high'): string {
    return statusSymbol(level)
  }

  private getFeeDescription(type: keyof Omit<FeeEstimate, 'unit' | 'timestamp'>): string {
    switch (type) {
      case 'fastest': return 'Next block (fastest)'
      case 'halfHour': return '~30 minutes'
      case 'hour': return '~1 hour'
      case 'economy': return '~24 hours (economy)'
      case 'minimum': return 'Low priority'
    }
  }

  private formatFeeRange(fee: number): string {
    const level = this.getFeeLevel(fee)
    const emoji = this.getFeeEmoji(level)
    return `${emoji} ${fee} sat/vB`
  }

  // ===========================================================================
  // Service Interface Methods
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      await this.getRecommendedFees()
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

let feesServiceInstance: FeesService | null = null

export function getFeesService(): FeesService {
  if (!feesServiceInstance) {
    feesServiceInstance = new FeesService()
  }
  return feesServiceInstance
}

// Convenience functions for easy usage
export async function getRecommendedFees(): Promise<CommandResult<FeeEstimate>> {
  const startTime = Date.now()

  try {
    const service = getFeesService()
    const feesData = await service.getRecommendedFees()

    return {
      success      : true,
      data         : feesData,
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

export async function getFeeHistory(hours: number = 24): Promise<CommandResult<FeeEstimate[]>> {
  const startTime = Date.now()

  try {
    const service = getFeesService()
    const historyData = await service.getFeeHistory(hours)

    return {
      success      : true,
      data         : historyData,
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
