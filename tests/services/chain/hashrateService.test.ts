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
import { HashrateService, getHashrateService, getCurrentHashrate } from '@/services/chain/hashrateService'

describe('HashrateService', () => {
  let service: HashrateService

  const mockDifficultyData = {
    progressPercent      : 20.98,
    difficultyChange     : 0.094,
    estimatedRetargetDate: 1751078046032,
    remainingBlocks      : 1593,
    remainingTime        : 956794032,
    currentDifficulty    : 126411437451912.23,
  }

  const mockBlockData = {
    id               : '000000000000000000009f007b19da3b94fee1b89eda0ce265008fde339b7639',
    height           : 901575,
    difficulty       : 126411437451912.23,
    timestamp        : 1750120128,
    tx_count         : 1047,
    size             : 1590878,
    weight           : 3993785,
  }

  beforeEach(() => {
    service = new HashrateService()
    mockFetchWithFallback.mockClear()
    mockBlockchain.mockClear()
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('HashrateService')
    })

    test('should have correct endpoints', () => {
      expect(service.endpoints).toContain('/v1/difficulty-adjustment')
      expect(service.endpoints).toContain('/blocks')
      expect(service.endpoints).toContain('/stats')
      expect(service.endpoints).toHaveLength(3)
    })
  })

  describe('getCurrentHashrate', () => {
    test('should fetch and calculate hashrate correctly', async () => {
      mockFetchWithFallback
        .mockResolvedValueOnce(mockDifficultyData)
        .mockResolvedValueOnce([mockBlockData])

      const hashrateData = await service.getCurrentHashrate()

      expect(typeof hashrateData.current).toBe('number')
      expect(hashrateData.current).toBeGreaterThan(0)
      expect(['TH/s', 'EH/s']).toContain(hashrateData.unit)
      expect(hashrateData.difficulty).toBe(126411437451912.23)
      expect(hashrateData.adjustmentProgress).toBe(20.98)
      expect(typeof hashrateData.estimatedTimeToAdjustment).toBe('number')
      expect(hashrateData.nextAdjustmentDate).toBeInstanceOf(Date)
    })

    test('should use cache on subsequent calls', async () => {
      mockFetchWithFallback
        .mockResolvedValueOnce(mockDifficultyData)
        .mockResolvedValueOnce([mockBlockData])

      // First call
      await service.getCurrentHashrate()
      
      // Second call (should use cache)
      await service.getCurrentHashrate()

      expect(mockFetchWithFallback).toHaveBeenCalledTimes(2) // Both parallel calls in first request
    })

    test('should fallback to blockstream when mempool fails', async () => {
      // Primary flow makes 2 parallel calls - both fail
      mockFetchWithFallback
        .mockRejectedValueOnce(new Error('Difficulty adjustment failed'))
        .mockRejectedValueOnce(new Error('Blocks API failed'))
        // Fallback call succeeds  
        .mockResolvedValueOnce([mockBlockData])

      const hashrateData = await service.getCurrentHashrate()

      expect(typeof hashrateData.current).toBe('number')
      expect(hashrateData.current).toBeGreaterThan(0)
      expect(['TH/s', 'EH/s']).toContain(hashrateData.unit)
      expect(hashrateData.difficulty).toBe(126411437451912.23)
    })
  })

  describe('Hashrate Calculations', () => {
    test('should format hashrate in correct units', async () => {
      mockFetchWithFallback
        .mockResolvedValueOnce(mockDifficultyData)
        .mockResolvedValueOnce([mockBlockData])

      const hashrateData = await service.getCurrentHashrate()

      // Current Bitcoin network should be in EH/s range
      expect(hashrateData.unit).toBe('EH/s')
      expect(hashrateData.current).toBeGreaterThan(100) // At least 100 EH/s
    })

    test('should calculate time estimates reasonably', async () => {
      mockFetchWithFallback
        .mockResolvedValueOnce(mockDifficultyData)
        .mockResolvedValueOnce([mockBlockData])

      const hashrateData = await service.getCurrentHashrate()

      // Should be reasonable time estimate (not crazy large)
      expect(hashrateData.estimatedTimeToAdjustment).toBeLessThan(2016 * 10 * 60) // Max 2 weeks
      expect(hashrateData.estimatedTimeToAdjustment).toBeGreaterThan(0)
    })
  })

  describe('Health Check', () => {
    test('should return true when service is healthy', async () => {
      mockFetchWithFallback
        .mockResolvedValueOnce(mockDifficultyData)
        .mockResolvedValueOnce([mockBlockData])

      const isHealthy = await service.healthcheck()

      expect(isHealthy).toBe(true)
    })

    test('should return false when service is unhealthy', async () => {
      mockFetchWithFallback.mockRejectedValue(new Error('Service down'))
      mockBlockchain.mockRejectedValue(new Error('Service down'))

      const isHealthy = await service.healthcheck()

      expect(isHealthy).toBe(false)
    })
  })
})

describe('Service Factory Functions', () => {
  test('getHashrateService should return singleton instance', () => {
    const service1 = getHashrateService()
    const service2 = getHashrateService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(HashrateService)
  })
})

describe('Convenience Functions', () => {
  describe('getCurrentHashrate', () => {
    test('should return result with correct structure', async () => {
      const result = await getCurrentHashrate()

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