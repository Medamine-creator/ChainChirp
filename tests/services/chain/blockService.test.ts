import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'

// Mock the API client module
const mockFetchWithFallback = mock(() => Promise.resolve({}))
const mockBlockchain = mock(() => Promise.resolve({}))

// Mock the module before importing
mock.module('@/services/apiClient', () => ({
  fetchWithFallback: mockFetchWithFallback,
  blockchain: mockBlockchain,
}))

// Import after mocking  
import { BlockService, getBlockService, getCurrentBlock, getRecentBlocks, getBlockByHash } from '@/services/chain/blockService'

describe('BlockService', () => {
  let service: BlockService

  const mockBlockData = {
    id               : '000000000000000000009f007b19da3b94fee1b89eda0ce265008fde339b7639',
    height           : 901575,
    version          : 537886720,
    timestamp        : 1750120128,
    tx_count         : 1047,
    size             : 1590878,
    weight           : 3993785,
    merkle_root      : '313f368cfe5934cd31f9c517db3cfff5e458d7b726860129b10df82c214de057',
    previousblockhash: '000000000000000000013ebdc0133dab0ed992f962e494426756a09a9992eaa3',
    mediantime       : 1750117059,
    nonce            : 4276425817,
    bits             : 386021892,
    difficulty       : 126411437451912.23,
  }

  const mockBlockchainInfoData = {
    hash       : '000000000000000000009f007b19da3b94fee1b89eda0ce265008fde339b7639',
    time       : 1750120128,
    block_index: 901575,
    height     : 901575,
    txIndexes  : [1, 2, 3, 4, 5],
  }

  beforeEach(() => {
    service = new BlockService()
    mockFetchWithFallback.mockClear()
    mockBlockchain.mockClear()
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('BlockService')
    })

    test('should have correct endpoints', () => {
      expect(service.endpoints).toContain('/blocks/tip/height')
      expect(service.endpoints).toContain('/block')
      expect(service.endpoints).toContain('/blocks')
      expect(service.endpoints).toHaveLength(3)
    })
  })

  describe('getCurrentBlock', () => {
    test('should fetch and transform current block data correctly', async () => {
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockData])

      const blockData = await service.getCurrentBlock()

      expect(blockData.height).toBe(901575)
      expect(blockData.hash).toBe('000000000000000000009f007b19da3b94fee1b89eda0ce265008fde339b7639')
      expect(blockData.timestamp).toBe(1750120128)
      expect(blockData.txCount).toBe(1047)
      expect(blockData.size).toBe(1590878)
      expect(blockData.weight).toBe(3993785)
      expect(blockData.difficulty).toBe(126411437451912.23)
      expect(typeof blockData.age).toBe('string')
    })

    test('should use cache on subsequent calls', async () => {
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockData])

      // First call
      await service.getCurrentBlock()
      
      // Second call (should use cache)
      await service.getCurrentBlock()

      expect(mockFetchWithFallback).toHaveBeenCalledTimes(1)
    })

    test('should fallback to blockchain.info when primary APIs fail', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Primary API failed'))
      mockBlockchain.mockResolvedValueOnce(mockBlockchainInfoData)

      const blockData = await service.getCurrentBlock()

      expect(blockData.height).toBe(901575)
      expect(blockData.hash).toBe('000000000000000000009f007b19da3b94fee1b89eda0ce265008fde339b7639')
      expect(blockData.timestamp).toBe(1750120128)
      expect(blockData.txCount).toBe(5) // From txIndexes length
      expect(blockData.size).toBe(0) // Not available in blockchain.info
      expect(blockData.weight).toBe(0) // Not available in blockchain.info
      expect(blockData.difficulty).toBe(0) // Not available in blockchain.info
    })

    test('should throw error when all APIs fail', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Primary API failed'))
      mockBlockchain.mockRejectedValueOnce(new Error('Blockchain.info failed'))

      await expect(service.getCurrentBlock()).rejects.toThrow('Failed to fetch current block')
    })

    test('should throw error when no blocks returned', async () => {
      mockFetchWithFallback.mockResolvedValueOnce([])
      mockBlockchain.mockRejectedValueOnce(new Error('Blockchain API also failed'))

      await expect(service.getCurrentBlock()).rejects.toThrow('Failed to fetch current block')
    })

    test('should throw error when latest block is undefined', async () => {
      mockFetchWithFallback.mockResolvedValueOnce([null])
      mockBlockchain.mockRejectedValueOnce(new Error('Blockchain API also failed'))

      await expect(service.getCurrentBlock()).rejects.toThrow('Failed to fetch current block')
    })
  })

  describe('getRecentBlocks', () => {
    test('should fetch multiple recent blocks', async () => {
      const mockBlocks = [mockBlockData, { ...mockBlockData, height: 901574, id: 'block2' }]
      mockFetchWithFallback.mockResolvedValueOnce(mockBlocks)

      const blocks = await service.getRecentBlocks(2)

      expect(blocks).toHaveLength(2)
      expect(blocks[0]?.height).toBe(901575)
      expect(blocks[1]?.height).toBe(901574)
    })

    test('should default to 10 blocks when count not specified', async () => {
      const mockBlocks = Array.from({ length: 10 }, (_, i) => ({
        ...mockBlockData,
        height: 901575 - i,
        id: `block${i}`,
      }))
      mockFetchWithFallback.mockResolvedValueOnce(mockBlocks)

      const blocks = await service.getRecentBlocks()

      expect(blocks).toHaveLength(10)
    })

    test('should slice blocks to requested count', async () => {
      const mockBlocks = Array.from({ length: 20 }, (_, i) => ({
        ...mockBlockData,
        height: 901575 - i,
        id: `block${i}`,
      }))
      mockFetchWithFallback.mockResolvedValueOnce(mockBlocks)

      const blocks = await service.getRecentBlocks(5)

      expect(blocks).toHaveLength(5)
    })

    test('should use shorter cache TTL for recent blocks', async () => {
      const mockBlocks = [mockBlockData]
      mockFetchWithFallback.mockResolvedValueOnce(mockBlocks)

      await service.getRecentBlocks(1)
      const stats = service.getCacheStats()

      expect(stats.keys).toContain('recent-blocks-1')
    })

    test('should throw error when API fails', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('API failed'))

      await expect(service.getRecentBlocks()).rejects.toThrow('Failed to fetch recent blocks')
    })
  })

  describe('getBlockByHash', () => {
    const testHash = '000000000000000000009f007b19da3b94fee1b89eda0ce265008fde339b7639'

    test('should fetch block by hash correctly', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockBlockData)

      const blockData = await service.getBlockByHash(testHash)

      expect(blockData.height).toBe(901575)
      expect(blockData.hash).toBe(testHash)
      expect(mockFetchWithFallback).toHaveBeenCalledWith(
        `/block/${testHash}`,
        {},
        { providers: ['mempool', 'blockstream'] }
      )
    })

    test('should use longer cache TTL for specific blocks', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockBlockData)

      await service.getBlockByHash(testHash)
      const stats = service.getCacheStats()

      expect(stats.keys).toContain(`block-${testHash}`)
    })

    test('should throw error when block not found', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Block not found'))

      await expect(service.getBlockByHash(testHash)).rejects.toThrow(`Failed to fetch block ${testHash}`)
    })
  })

  describe('Age Calculation', () => {
    test('should format age in seconds', () => {
      const now = Math.floor(Date.now() / 1000)
      const timestamp = now - 30
      
      const mockBlockWithAge = { ...mockBlockData, timestamp }
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockWithAge])

      // The age calculation is done internally, so we test via getCurrentBlock
      return service.getCurrentBlock().then(block => {
        expect(block.age).toMatch(/30s ago/)
      })
    })

    test('should format age in minutes and seconds', () => {
      const now = Math.floor(Date.now() / 1000)
      const timestamp = now - (2 * 60 + 15) // 2m 15s ago
      
      const mockBlockWithAge = { ...mockBlockData, timestamp }
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockWithAge])

      return service.getCurrentBlock().then(block => {
        expect(block.age).toMatch(/2m 15s ago/)
      })
    })

    test('should format age in hours and minutes', () => {
      const now = Math.floor(Date.now() / 1000)
      const timestamp = now - (2 * 3600 + 30 * 60) // 2h 30m ago
      
      const mockBlockWithAge = { ...mockBlockData, timestamp }
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockWithAge])

      return service.getCurrentBlock().then(block => {
        expect(block.age).toMatch(/2h 30m ago/)
      })
    })

    test('should format age in days and hours', () => {
      const now = Math.floor(Date.now() / 1000)
      const timestamp = now - (2 * 86400 + 5 * 3600) // 2d 5h ago
      
      const mockBlockWithAge = { ...mockBlockData, timestamp }
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockWithAge])

      return service.getCurrentBlock().then(block => {
        expect(block.age).toMatch(/2d 5h ago/)
      })
    })
  })

  describe('Cache Management', () => {
    test('should clear cache correctly', () => {
      service.clearCache()
      const stats = service.getCacheStats()

      expect(stats.size).toBe(0)
      expect(stats.keys).toEqual([])
    })

    test('should provide cache statistics', async () => {
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockData])
      
      await service.getCurrentBlock()
      const stats = service.getCacheStats()

      expect(stats.size).toBe(1)
      expect(stats.keys).toContain('current-block')
    })
  })

  describe('Health Check', () => {
    test('should return true when service is healthy', async () => {
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockData])

      const isHealthy = await service.healthcheck()

      expect(isHealthy).toBe(true)
    })

    test('should return false when service is unhealthy', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Service down'))
      mockBlockchain.mockRejectedValueOnce(new Error('Service down'))

      const isHealthy = await service.healthcheck()

      expect(isHealthy).toBe(false)
    })
  })
})

describe('Service Factory Functions', () => {
  test('getBlockService should return singleton instance', () => {
    const service1 = getBlockService()
    const service2 = getBlockService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(BlockService)
  })
})

describe('Convenience Functions', () => {
  describe('getCurrentBlock', () => {
    test('should return result with correct structure', async () => {
      const result = await getCurrentBlock()

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('executionTime')
      expect(typeof result.success).toBe('boolean')
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(typeof result.executionTime).toBe('number')
      
      if (result.success) {
        expect(result.data).toHaveProperty('height')
        expect(result.data).toHaveProperty('hash')
        expect(result.data).toHaveProperty('timestamp')
        expect(result.data).toHaveProperty('age')
      } else {
        expect(result.error).toBeInstanceOf(Error)
      }
    })
  })

  describe('getRecentBlocks', () => {
    test('should return result with correct structure', async () => {
      const result = await getRecentBlocks(5)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('executionTime')
      expect(typeof result.success).toBe('boolean')
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(typeof result.executionTime).toBe('number')
      
      if (result.success && result.data) {
        expect(Array.isArray(result.data)).toBe(true)
        if (result.data.length > 0) {
          expect(result.data[0]).toHaveProperty('height')
          expect(result.data[0]).toHaveProperty('hash')
        }
      } else {
        expect(result.error).toBeInstanceOf(Error)
      }
    })
  })

  describe('getBlockByHash', () => {
    test('should return result with correct structure', async () => {
      const testHash = '000000000000000000009f007b19da3b94fee1b89eda0ce265008fde339b7639'
      const result = await getBlockByHash(testHash)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('executionTime')
      expect(typeof result.success).toBe('boolean')
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(typeof result.executionTime).toBe('number')
      
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('height')
        expect(result.data).toHaveProperty('hash')
        if (result.data.hash) {
          expect(typeof result.data.hash).toBe('string')
        }
      } else {
        expect(result.error).toBeInstanceOf(Error)
      }
    })
  })
}) 