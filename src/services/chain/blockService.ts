import { fetchWithFallback, blockchain } from '@/services/apiClient'
import type {
  BlockData,
  BaseService,
  CommandResult,
} from '@/types'

// =============================================================================
// Block Service Configuration
// =============================================================================

const BLOCK_CACHE_TTL = 30 * 1000 // 30 seconds

interface BlockCache {
  data     : BlockData
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

interface BlockchainInfoBlockResponse {
  hash       : string
  time       : number
  block_index: number
  height     : number
  txIndexes  : number[]
}

// =============================================================================
// Block Service Implementation
// =============================================================================

export class BlockService implements BaseService {
  readonly name = 'BlockService'
  readonly endpoints = [ '/blocks/tip/height', '/block', '/blocks' ]

  private cache = new Map<string, BlockCache>()

  // ===========================================================================
  // Core Block Methods
  // ===========================================================================

  async getCurrentBlock(): Promise<BlockData> {
    const cacheKey = 'current-block'
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < BLOCK_CACHE_TTL) {
      return cached.data
    }

    try {
      // Get recent blocks (mempool.space returns latest first)
      const blocks = await fetchWithFallback<MempoolSpaceBlockResponse[]>(
        '/blocks',
        {},
        {
          providers: [ 'mempool', 'blockstream' ]
        }
      )

      if (!blocks || blocks.length === 0) {
        throw new Error('No blocks returned from API')
      }

      const latestBlock = blocks[0]
      if (!latestBlock) {
        throw new Error('Latest block is undefined')
      }

      const block: BlockData = {
        height    : latestBlock.height,
        hash      : latestBlock.id,
        timestamp : latestBlock.timestamp,
        txCount   : latestBlock.tx_count,
        size      : latestBlock.size,
        weight    : latestBlock.weight,
        difficulty: latestBlock.difficulty,
        age       : this.calculateAge(latestBlock.timestamp),
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : block,
        timestamp: Date.now(),
      })

      return block
    } catch (error) {
      // Fallback to blockchain.info
      try {
        const blockchainData = await blockchain<BlockchainInfoBlockResponse>('/latestblock')
        
        const block: BlockData = {
          height    : blockchainData.height,
          hash      : blockchainData.hash,
          timestamp : blockchainData.time,
          txCount   : blockchainData.txIndexes?.length || 0,
          size      : 0, // Not available in blockchain.info
          weight    : 0, // Not available in blockchain.info
          difficulty: 0, // Not available in blockchain.info
          age       : this.calculateAge(blockchainData.time),
        }

        // Cache the result
        this.cache.set(cacheKey, {
          data     : block,
          timestamp: Date.now(),
        })

        return block
      } catch {
        throw new Error(
          `Failed to fetch current block: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }
  }

  async getRecentBlocks(count: number = 10): Promise<BlockData[]> {
    const cacheKey = `recent-blocks-${count}`
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid (shorter TTL for recent blocks)
    if (cached && Date.now() - cached.timestamp < BLOCK_CACHE_TTL / 2) {
      return cached.data as unknown as BlockData[]
    }

    try {
      // Get recent blocks and slice to requested count
      const blocks = await fetchWithFallback<MempoolSpaceBlockResponse[]>(
        '/blocks',
        {},
        {
          providers: [ 'mempool', 'blockstream' ]
        }
      )

      if (!blocks || blocks.length === 0) {
        throw new Error('No blocks returned from API')
      }

      const blockData: BlockData[] = blocks
        .slice(0, count)
        .map((block) => ({
          height    : block.height,
          hash      : block.id,
          timestamp : block.timestamp,
          txCount   : block.tx_count,
          size      : block.size,
          weight    : block.weight,
          difficulty: block.difficulty,
          age       : this.calculateAge(block.timestamp),
        }))

      // Cache the result
      this.cache.set(cacheKey, {
        data     : blockData as unknown as BlockData,
        timestamp: Date.now(),
      })

      return blockData
    } catch (error) {
      throw new Error(
        `Failed to fetch recent blocks: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getBlockByHash(hash: string): Promise<BlockData> {
    const cacheKey = `block-${hash}`
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid (longer TTL for specific blocks)
    if (cached && Date.now() - cached.timestamp < BLOCK_CACHE_TTL * 10) {
      return cached.data
    }

    try {
      const blockData = await fetchWithFallback<MempoolSpaceBlockResponse>(
        `/block/${hash}`,
        {},
        {
          providers: [ 'mempool', 'blockstream' ]
        }
      )

      const block: BlockData = {
        height    : blockData.height,
        hash      : blockData.id,
        timestamp : blockData.timestamp,
        txCount   : blockData.tx_count,
        size      : blockData.size,
        weight    : blockData.weight,
        difficulty: blockData.difficulty,
        age       : this.calculateAge(blockData.timestamp),
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : block,
        timestamp: Date.now(),
      })

      return block
    } catch (error) {
      throw new Error(
        `Failed to fetch block ${hash}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private calculateAge(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000)
    const ageSeconds = now - timestamp

    if (ageSeconds < 60) {
      return `${ageSeconds}s ago`
    } else if (ageSeconds < 3600) {
      const minutes = Math.floor(ageSeconds / 60)
      const seconds = ageSeconds % 60
      return `${minutes}m ${seconds}s ago`
    } else if (ageSeconds < 86400) {
      const hours = Math.floor(ageSeconds / 3600)
      const minutes = Math.floor((ageSeconds % 3600) / 60)
      return `${hours}h ${minutes}m ago`
    } else {
      const days = Math.floor(ageSeconds / 86400)
      const hours = Math.floor((ageSeconds % 86400) / 3600)
      return `${days}d ${hours}h ago`
    }
  }

  private formatHashrate(difficulty: number): string {
    // Approximate hashrate from difficulty (simplified calculation)
    const hashrate = difficulty * Math.pow(2, 32) / 600 // 10 minute target
    
    if (hashrate >= 1e21) {
      return `${(hashrate / 1e21).toFixed(2)} ZH/s`
    } else if (hashrate >= 1e18) {
      return `${(hashrate / 1e18).toFixed(2)} EH/s`
    } else if (hashrate >= 1e15) {
      return `${(hashrate / 1e15).toFixed(2)} PH/s`
    } else if (hashrate >= 1e12) {
      return `${(hashrate / 1e12).toFixed(2)} TH/s`
    }
    return `${hashrate.toFixed(2)} H/s`
  }

  // ===========================================================================
  // Service Interface Methods
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      await this.getCurrentBlock()
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

let blockServiceInstance: BlockService | null = null

export function getBlockService(): BlockService {
  if (!blockServiceInstance) {
    blockServiceInstance = new BlockService()
  }
  return blockServiceInstance
}

// Convenience functions for easy usage
export async function getCurrentBlock(): Promise<CommandResult<BlockData>> {
  const startTime = Date.now()

  try {
    const service = getBlockService()
    const blockData = await service.getCurrentBlock()

    return {
      success      : true,
      data         : blockData,
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

export async function getRecentBlocks(count: number = 10): Promise<CommandResult<BlockData[]>> {
  const startTime = Date.now()

  try {
    const service = getBlockService()
    const blockData = await service.getRecentBlocks(count)

    return {
      success      : true,
      data         : blockData,
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

export async function getBlockByHash(hash: string): Promise<CommandResult<BlockData>> {
  const startTime = Date.now()

  try {
    const service = getBlockService()
    const blockData = await service.getBlockByHash(hash)

    return {
      success      : true,
      data         : blockData,
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
