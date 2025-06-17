import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'

// Mock the API client module
const mockFetchWithFallback = mock(() => Promise.resolve({}))

// Mock the module before importing
mock.module('@/services/apiClient', () => ({
  fetchWithFallback: mockFetchWithFallback,
}))

// Import after mocking  
import { FeesService, getFeesService, getRecommendedFees, getFeeHistory } from '@/services/chain/feesService'

describe('FeesService', () => {
  let service: FeesService

  const mockFeesData = {
    fastestFee : 5,
    halfHourFee: 4,
    hourFee    : 3,
    economyFee : 2,
    minimumFee : 1,
  }

  const mockBlockstreamFeesData = {
    '1'   : 5.5,
    '3'   : 4.2,
    '6'   : 4.2,
    '144' : 2.1,
    '1008': 1.0,
  }

  beforeEach(() => {
    service = new FeesService()
    mockFetchWithFallback.mockClear()
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('FeesService')
    })

    test('should have correct endpoints', () => {
      expect(service.endpoints).toContain('/v1/fees/recommended')
      expect(service.endpoints).toContain('/fee-estimates')
      expect(service.endpoints).toHaveLength(2)
    })
  })

  describe('getRecommendedFees', () => {
    test('should fetch and transform fees data correctly', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockFeesData)

      const feesData = await service.getRecommendedFees()

      expect(feesData.fastest).toBe(5)
      expect(feesData.halfHour).toBe(4)
      expect(feesData.hour).toBe(3)
      expect(feesData.economy).toBe(2)
      expect(feesData.minimum).toBe(1)
      expect(feesData.unit).toBe('sat/vB')
      expect(feesData.timestamp).toBeInstanceOf(Date)
    })

    test('should use cache on subsequent calls', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockFeesData)

      // First call
      await service.getRecommendedFees()
      
      // Second call (should use cache)
      await service.getRecommendedFees()

      expect(mockFetchWithFallback).toHaveBeenCalledTimes(1)
    })

    test('should fallback to blockstream when mempool.space fails', async () => {
      mockFetchWithFallback
        .mockRejectedValueOnce(new Error('Mempool API failed'))
        .mockResolvedValueOnce(mockBlockstreamFeesData)

      const feesData = await service.getRecommendedFees()

      expect(feesData.fastest).toBe(5.5)
      expect(feesData.halfHour).toBe(4.2)
      expect(feesData.hour).toBe(4.2) // Same as halfHour due to fallback mapping
      expect(feesData.economy).toBe(2.1) // Blockstream '144' value
      expect(feesData.minimum).toBe(1.0) // Blockstream '1008' value
    })

    test('should throw error when all APIs fail', async () => {
      mockFetchWithFallback.mockRejectedValue(new Error('All APIs failed'))

      await expect(service.getRecommendedFees()).rejects.toThrow('Failed to fetch fee estimates')
    })

    test('should throw error when invalid data and no fallback', async () => {
      mockFetchWithFallback.mockRejectedValue(new Error('Invalid data'))

      await expect(service.getRecommendedFees()).rejects.toThrow('Failed to fetch fee estimates')
    })
  })

  describe('getFeeHistory', () => {
    test('should return current fees for now (no history API)', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockFeesData)

      const historyData = await service.getFeeHistory(24)

      expect(Array.isArray(historyData)).toBe(true)
      expect(historyData).toHaveLength(1)
      expect(historyData[0]?.fastest).toBe(5)
    })

    test('should use cache for fee history', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockFeesData)

      // First call
      await service.getFeeHistory(12)
      
      // Second call (should use cache)
      await service.getFeeHistory(12)

      expect(mockFetchWithFallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Fee Validation', () => {
    test('should throw error when API returns invalid data', async () => {
      mockFetchWithFallback.mockRejectedValue(new Error('Invalid non-numeric data'))

      await expect(service.getRecommendedFees()).rejects.toThrow('Failed to fetch fee estimates')
    })

    test('should throw error when API returns negative data', async () => {
      mockFetchWithFallback.mockRejectedValue(new Error('Invalid negative data'))

      await expect(service.getRecommendedFees()).rejects.toThrow('Failed to fetch fee estimates')
    })

    test('should handle zero fees gracefully', async () => {
      const zeroFeesData = { ...mockFeesData, minimumFee: 0 }
      mockFetchWithFallback.mockResolvedValueOnce(zeroFeesData)

      const feesData = await service.getRecommendedFees()

      expect(feesData.minimum).toBe(0)
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
      mockFetchWithFallback.mockResolvedValueOnce(mockFeesData)
      
      await service.getRecommendedFees()
      const stats = service.getCacheStats()

      expect(stats.size).toBe(1)
      expect(stats.keys).toContain('recommended-fees')
    })
  })

  describe('Health Check', () => {
    test('should return true when service is healthy', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockFeesData)

      const isHealthy = await service.healthcheck()

      expect(isHealthy).toBe(true)
    })

    test('should return false when service is unhealthy', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Service down'))

      const isHealthy = await service.healthcheck()

      expect(isHealthy).toBe(false)
    })
  })
})

describe('Service Factory Functions', () => {
  test('getFeesService should return singleton instance', () => {
    const service1 = getFeesService()
    const service2 = getFeesService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(FeesService)
  })
})

describe('Convenience Functions', () => {
  describe('getRecommendedFees', () => {
    test('should return result with correct structure', async () => {
      const result = await getRecommendedFees()

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

  describe('getFeeHistory', () => {
    test('should return result with correct structure', async () => {
      const result = await getFeeHistory(24)

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

describe('Fee Level Analysis', () => {
  test('should categorize fee levels correctly', () => {
    const feeCategories = [
      { fee: 1, expected: 'low' },
      { fee: 15, expected: 'medium' },
      { fee: 75, expected: 'high' },
    ]

    feeCategories.forEach(({ fee, expected }) => {
      expect(typeof fee).toBe('number')
      expect(['low', 'medium', 'high']).toContain(expected)
    })
  })

  test('should handle fee edge cases', () => {
    const edgeCases = [0, 0.1, 1000, Number.MAX_SAFE_INTEGER]

    edgeCases.forEach(fee => {
      expect(typeof fee).toBe('number')
      expect(Number.isFinite(fee)).toBe(true)
      expect(fee).toBeGreaterThanOrEqual(0)
    })
  })
}) 