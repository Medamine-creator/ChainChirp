import { fetchWithFallback, blockchain } from '@/services/apiClient'
import type {
  MempoolInfo,
  BaseService,
  CommandResult,
} from '@/types'

// =============================================================================
// Mempool Service Configuration
// =============================================================================

const MEMPOOL_CACHE_TTL = 15 * 1000 // 15 seconds (faster updates for mempool)

interface MempoolCache {
  data     : MempoolInfo
  timestamp: number
}

interface MempoolSpaceMempoolResponse {
  count        : number
  vsize        : number
  total_fee    : number
  fee_histogram: number[][]
}

// =============================================================================
// Mempool Service Implementation
// =============================================================================

export class MempoolService implements BaseService {
  readonly name = 'MempoolService'
  readonly endpoints = [ '/mempool', '/mempool/recent' ]

  private cache = new Map<string, MempoolCache>()

  // ===========================================================================
  // Core Mempool Methods
  // ===========================================================================

  async getMempoolInfo(): Promise<MempoolInfo> {
    const cacheKey = 'mempool-info'
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < MEMPOOL_CACHE_TTL) {
      return cached.data
    }

    try {
      const mempoolData = await fetchWithFallback<MempoolSpaceMempoolResponse>(
        '/mempool',
        {},
        {
          providers: [ 'mempool', 'blockstream' ]
        }
      )

      const congestionLevel = this.calculateCongestionLevel(mempoolData.count, mempoolData.vsize)

      const mempoolInfo: MempoolInfo = {
        count       : mempoolData.count,
        vsize       : mempoolData.vsize,
        totalFees   : mempoolData.total_fee,
        feeHistogram: mempoolData.fee_histogram || [],
        congestionLevel,
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : mempoolInfo,
        timestamp: Date.now(),
      })

      return mempoolInfo
    } catch (error) {
      // Fallback to blockchain.info (limited data)
      try {
        const blockchainData = await blockchain<{ unconfirmed_count: number }>('/unconfirmed-transactions?format=json')
        
        const mempoolInfo: MempoolInfo = {
          count          : blockchainData.unconfirmed_count || 0,
          vsize          : 0, // Not available in blockchain.info
          totalFees      : 0, // Not available in blockchain.info
          feeHistogram   : [],
          congestionLevel: this.calculateCongestionLevel(blockchainData.unconfirmed_count || 0, 0),
        }

        // Cache the result
        this.cache.set(cacheKey, {
          data     : mempoolInfo,
          timestamp: Date.now(),
        })

        return mempoolInfo
      } catch {
        throw new Error(
          `Failed to fetch mempool info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }
  }

  async getCongestionLevel(): Promise<'low' | 'medium' | 'high'> {
    try {
      const mempoolInfo = await this.getMempoolInfo()
      return mempoolInfo.congestionLevel
    } catch (error) {
      throw new Error(
        `Failed to get congestion level: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getFeeHistogram(): Promise<number[][]> {
    try {
      const mempoolInfo = await this.getMempoolInfo()
      return mempoolInfo.feeHistogram
    } catch (error) {
      throw new Error(
        `Failed to get fee histogram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private calculateCongestionLevel(txCount: number, vsize: number): 'low' | 'medium' | 'high' {
    // Base congestion on transaction count primarily, with vsize as secondary factor
    const congestionScore = txCount + (vsize / 1000000) // Normalize vsize to similar scale
    
    if (congestionScore < 5000) {
      return 'low'
    } else if (congestionScore < 20000) {
      return 'medium'
    } else {
      return 'high'
    }
  }

  private formatVsize(vsize: number): string {
    if (vsize >= 1000000) {
      return `${(vsize / 1000000).toFixed(2)} MB`
    } else if (vsize >= 1000) {
      return `${(vsize / 1000).toFixed(2)} KB`
    }
    return `${vsize} vB`
  }

  private formatFees(sats: number): string {
    if (sats >= 100000000) {
      return `${(sats / 100000000).toFixed(2)} BTC`
    } else if (sats >= 1000) {
      return `${(sats / 1000).toFixed(0)}K sats`
    }
    return `${sats} sats`
  }

  private getCongestionEmoji(level: 'low' | 'medium' | 'high'): string {
    switch (level) {
      case 'low'   : return '🟢'
      case 'medium': return '🟡'
      case 'high'  : return '🔴'
    }
  }

  // ===========================================================================
  // Service Interface Methods
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      await this.getMempoolInfo()
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

let mempoolServiceInstance: MempoolService | null = null

export function getMempoolService(): MempoolService {
  if (!mempoolServiceInstance) {
    mempoolServiceInstance = new MempoolService()
  }
  return mempoolServiceInstance
}

// Convenience functions for easy usage
export async function getMempoolInfo(): Promise<CommandResult<MempoolInfo>> {
  const startTime = Date.now()

  try {
    const service = getMempoolService()
    const mempoolData = await service.getMempoolInfo()

    return {
      success      : true,
      data         : mempoolData,
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

export async function getCongestionLevel(): Promise<CommandResult<'low' | 'medium' | 'high'>> {
  const startTime = Date.now()

  try {
    const service = getMempoolService()
    const congestionLevel = await service.getCongestionLevel()

    return {
      success      : true,
      data         : congestionLevel,
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
