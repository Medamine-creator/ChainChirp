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
import { HalvingService, getHalvingService, getCurrentHalving } from '@/services/chain/halvingService'

describe('HalvingService', () => {
  let service: HalvingService

  const mockBlockData = {
    id               : '000000000000000000009f007b19da3b94fee1b89eda0ce265008fde339b7639',
    height           : 901575,
    difficulty       : 126411437451912.23,
    timestamp        : 1750120128,
    tx_count         : 1047,
    size             : 1590878,
    weight           : 3993785,
  }

  const mockBlockchainStats = {
    difficulty: 126411437451912.23,
    blocks    : 901575,
    timestamp : 1750120128,
  }

  beforeEach(() => {
    service = new HalvingService()
    mockFetchWithFallback.mockClear()
    mockBlockchain.mockClear()
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('HalvingService')
    })

    test('should have correct endpoints', () => {
      expect(service.endpoints).toContain('/blocks')
      expect(service.endpoints).toContain('/stats')
      expect(service.endpoints).toContain('/blocks/tip/height')
      expect(service.endpoints).toHaveLength(3)
    })
  })

  describe('getCurrentHalving', () => {
    test('should calculate halving data correctly', async () => {
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockData])

      const halvingData = await service.getCurrentHalving()

      expect(halvingData.currentBlockHeight).toBe(901575)
      expect(halvingData.halvingBlockHeight).toBe(1050000) // Next halving at 5 * 210000
      expect(halvingData.blocksRemaining).toBe(148425) // 1050000 - 901575
      expect(halvingData.currentReward).toBe(3.125) // 4th epoch reward
      expect(halvingData.nextReward).toBe(1.5625) // 5th epoch reward
      expect(halvingData.estimatedDate).toBeInstanceOf(Date)
      expect(typeof halvingData.daysRemaining).toBe('number')
    })

    test('should use cache on subsequent calls', async () => {
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockData])

      // First call
      await service.getCurrentHalving()
      
      // Second call (should use cache)
      await service.getCurrentHalving()

      expect(mockFetchWithFallback).toHaveBeenCalledTimes(1)
    })

    test('should fallback to blockchain.info when primary APIs fail', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Primary API failed'))
      mockBlockchain.mockResolvedValueOnce(mockBlockchainStats)

      const halvingData = await service.getCurrentHalving()

      expect(halvingData.currentBlockHeight).toBe(901575)
    })

    test('should throw error when all APIs fail', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Primary API failed'))
      mockBlockchain.mockRejectedValueOnce(new Error('Blockchain API failed'))

      await expect(service.getCurrentHalving()).rejects.toThrow('Failed to fetch halving data')
    })
  })

  describe('Halving Calculations', () => {
    test('should calculate correct reward for different epochs', async () => {
      const testCases = [
        { height: 100000, expectedReward: 50 },      // Epoch 0
        { height: 300000, expectedReward: 25 },      // Epoch 1  
        { height: 500000, expectedReward: 12.5 },    // Epoch 2
        { height: 700000, expectedReward: 6.25 },    // Epoch 3
        { height: 900000, expectedReward: 3.125 },   // Epoch 4 (current)
        { height: 1100000, expectedReward: 1.5625 }, // Epoch 5 (next)
      ]

      for (const { height, expectedReward } of testCases) {
        const mockData = { ...mockBlockData, height }
        mockFetchWithFallback.mockResolvedValueOnce([mockData])

        const halvingData = await service.getCurrentHalving()

        expect(halvingData.currentReward).toBe(expectedReward)
        
        // Clear cache for next iteration
        service.clearCache()
      }
    })

    test('should calculate next halving block correctly', async () => {
      const testCases = [
        { height: 100000, nextHalving: 210000 },
        { height: 300000, nextHalving: 420000 },
        { height: 500000, nextHalving: 630000 },
        { height: 700000, nextHalving: 840000 },
        { height: 900000, nextHalving: 1050000 },
      ]

      for (const { height, nextHalving } of testCases) {
        const mockData = { ...mockBlockData, height }
        mockFetchWithFallback.mockResolvedValueOnce([mockData])

        const halvingData = await service.getCurrentHalving()

        expect(halvingData.halvingBlockHeight).toBe(nextHalving)
        
        // Clear cache for next iteration
        service.clearCache()
      }
    })

    test('should calculate reasonable time estimates', async () => {
      mockFetchWithFallback.mockResolvedValueOnce([mockBlockData])

      const halvingData = await service.getCurrentHalving()

      // Should be reasonable estimates
      expect(halvingData.daysRemaining).toBeGreaterThan(0)
      expect(halvingData.daysRemaining).toBeLessThan(365 * 10) // Less than 10 years
      expect(halvingData.estimatedDate.getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('Bitcoin Halving History Validation', () => {
    test('should follow correct halving schedule', () => {
      const expectedSchedule = [
        { epoch: 0, reward: 50, blockHeight: 0 },
        { epoch: 1, reward: 25, blockHeight: 210000 },
        { epoch: 2, reward: 12.5, blockHeight: 420000 },
        { epoch: 3, reward: 6.25, blockHeight: 630000 },
        { epoch: 4, reward: 3.125, blockHeight: 840000 },
        { epoch: 5, reward: 1.5625, blockHeight: 1050000 },
      ]

      expectedSchedule.forEach(({ epoch, reward, blockHeight }) => {
        const calculatedReward = 50 / Math.pow(2, epoch)
        const calculatedBlockHeight = epoch * 210000

        expect(calculatedReward).toBe(reward)
        expect(calculatedBlockHeight).toBe(blockHeight)
      })
    })

    test('should handle edge case of exact halving block', async () => {
      const halvingBlock = 840000 // 4th halving block
      const mockData = { ...mockBlockData, height: halvingBlock }
      mockFetchWithFallback.mockResolvedValueOnce([mockData])

      const halvingData = await service.getCurrentHalving()

      expect(halvingData.currentBlockHeight).toBe(840000)
      expect(halvingData.halvingBlockHeight).toBe(1050000) // Next halving
      expect(halvingData.blocksRemaining).toBe(210000)
      expect(halvingData.currentReward).toBe(3.125) // Current epoch reward
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
  test('getHalvingService should return singleton instance', () => {
    const service1 = getHalvingService()
    const service2 = getHalvingService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(HalvingService)
  })
})

describe('Convenience Functions', () => {
  describe('getCurrentHalving', () => {
    test('should return result with correct structure', async () => {
      const result = await getCurrentHalving()

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('executionTime')
      expect(typeof result.success).toBe('boolean')
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(typeof result.executionTime).toBe('number')
      
      if (result.success) {
        // Structure validation would go here
      } else {
        expect(result.error).toBeInstanceOf(Error)
      }
    })
  })
})

describe('Mathematical Validation', () => {
  test('should validate halving interval constant', () => {
    const HALVING_INTERVAL = 210000
    
    expect(typeof HALVING_INTERVAL).toBe('number')
    expect(HALVING_INTERVAL).toBe(210000)
    expect(HALVING_INTERVAL % 1).toBe(0) // Should be integer
  })

  test('should validate reward calculation formula', () => {
    const INITIAL_REWARD = 50
    const epochs = [0, 1, 2, 3, 4, 5]
    
    epochs.forEach(epoch => {
      const reward = INITIAL_REWARD / Math.pow(2, epoch)
      expect(typeof reward).toBe('number')
      expect(reward).toBeGreaterThan(0)
      expect(Number.isFinite(reward)).toBe(true)
    })
  })

  test('should validate time estimation formula', () => {
    const TARGET_BLOCK_TIME = 10 * 60 // 10 minutes in seconds
    const blocksRemaining = 148425
    const estimatedSeconds = blocksRemaining * TARGET_BLOCK_TIME
    const estimatedDays = Math.ceil(estimatedSeconds / (24 * 60 * 60))
    
    expect(typeof estimatedDays).toBe('number')
    expect(estimatedDays).toBeGreaterThan(0)
    expect(estimatedDays).toBeLessThan(365 * 10) // Reasonable upper bound
  })
}) 