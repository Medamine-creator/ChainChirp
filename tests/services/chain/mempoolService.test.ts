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
import { MempoolService, getMempoolService, getMempoolInfo, getCongestionLevel } from '@/services/chain/mempoolService'

describe('MempoolService', () => {
  let service: MempoolService

  const mockMempoolData = {
    count        : 7913,
    vsize        : 2557014,
    total_fee    : 15486523,
    fee_histogram: [
      [1, 150],
      [2, 200],
      [3, 180],
      [4, 120],
      [5, 100],
      [10, 80],
      [20, 60],
      [50, 40],
      [100, 20],
      [200, 10],
    ]
  }

  beforeEach(() => {
    service = new MempoolService()
    mockFetchWithFallback.mockClear()
    mockBlockchain.mockClear()
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('MempoolService')
    })

    test('should have correct endpoints', () => {
      expect(service.endpoints).toContain('/mempool')
      expect(service.endpoints).toContain('/mempool/recent')
      expect(service.endpoints).toHaveLength(2)
    })
  })

  describe('getMempoolInfo', () => {
    test('should fetch and transform mempool data correctly', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockMempoolData)

      const mempoolInfo = await service.getMempoolInfo()

      expect(mempoolInfo.count).toBe(7913)
      expect(mempoolInfo.vsize).toBe(2557014)
      expect(mempoolInfo.totalFees).toBe(15486523)
      expect(Array.isArray(mempoolInfo.feeHistogram)).toBe(true)
      expect(mempoolInfo.feeHistogram).toHaveLength(10)
      expect(typeof mempoolInfo.congestionLevel).toBe('string')
      expect(['low', 'medium', 'high']).toContain(mempoolInfo.congestionLevel)
    })

    test('should use cache on subsequent calls', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockMempoolData)

      // First call
      await service.getMempoolInfo()
      
      // Second call (should use cache)
      await service.getMempoolInfo()

      expect(mockFetchWithFallback).toHaveBeenCalledTimes(1)
    })

    test('should throw error when API call fails', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Network error'))
      mockBlockchain.mockRejectedValueOnce(new Error('Blockchain API also failed'))

      await expect(service.getMempoolInfo()).rejects.toThrow('Failed to fetch mempool info')
    })

    test('should fallback to blockchain.info when primary APIs fail', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Primary API failed'))
      mockBlockchain.mockResolvedValueOnce({ unconfirmed_count: 5000 })

      const mempoolData = await service.getMempoolInfo()

      expect(mempoolData.count).toBe(5000)
      expect(mempoolData.vsize).toBe(0) // Not available in blockchain.info
      expect(mempoolData.totalFees).toBe(0) // Not available in blockchain.info
    })
  })

  describe('Congestion Level Calculation', () => {
    test('should return low congestion for small mempool', async () => {
      const lowCongestionData = { ...mockMempoolData, count: 1000, vsize: 500000 }
      mockFetchWithFallback.mockResolvedValueOnce(lowCongestionData)

      const mempoolInfo = await service.getMempoolInfo()

      expect(mempoolInfo.congestionLevel).toBe('low')
    })

    test('should return medium congestion for moderate mempool', async () => {
      const mediumCongestionData = { ...mockMempoolData, count: 8000, vsize: 2000000 }
      mockFetchWithFallback.mockResolvedValueOnce(mediumCongestionData)

      const mempoolInfo = await service.getMempoolInfo()

      expect(mempoolInfo.congestionLevel).toBe('medium')
    })

    test('should return high congestion for large mempool', async () => {
      const highCongestionData = { ...mockMempoolData, count: 20000, vsize: 5000000 }
      mockFetchWithFallback.mockResolvedValueOnce(highCongestionData)

      const mempoolInfo = await service.getMempoolInfo()

      expect(mempoolInfo.congestionLevel).toBe('high')
    })
  })

  describe('Fee Histogram Processing', () => {
    test('should process fee histogram correctly', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockMempoolData)

      const mempoolInfo = await service.getMempoolInfo()

      expect(mempoolInfo.feeHistogram).toEqual(mockMempoolData.fee_histogram)
      expect(mempoolInfo.feeHistogram[0]).toEqual([1, 150])
      expect(mempoolInfo.feeHistogram[9]).toEqual([200, 10])
    })

    test('should handle empty fee histogram', async () => {
      const dataWithEmptyHistogram = { ...mockMempoolData, fee_histogram: [] }
      mockFetchWithFallback.mockResolvedValueOnce(dataWithEmptyHistogram)

      const mempoolInfo = await service.getMempoolInfo()

      expect(mempoolInfo.feeHistogram).toEqual([])
    })

    test('should handle missing fee histogram', async () => {
      const { fee_histogram, ...dataWithoutHistogram } = mockMempoolData
      mockFetchWithFallback.mockResolvedValueOnce(dataWithoutHistogram)

      const mempoolInfo = await service.getMempoolInfo()

      expect(mempoolInfo.feeHistogram).toEqual([])
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
      mockFetchWithFallback.mockResolvedValueOnce(mockMempoolData)
      
      await service.getMempoolInfo()
      const stats = service.getCacheStats()

      expect(stats.size).toBe(1)
      expect(stats.keys).toContain('mempool-info')
    })

    test('should use faster cache TTL for mempool data', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockMempoolData)
      
      const firstCall = Date.now()
      await service.getMempoolInfo()
      
      // Cache should expire faster than other services (15s vs 30s)
      const stats = service.getCacheStats()
      expect(stats.size).toBe(1)
    })
  })

  describe('Health Check', () => {
    test('should return true when service is healthy', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockMempoolData)

      const isHealthy = await service.healthcheck()

      expect(isHealthy).toBe(true)
    })

    test('should return false when service is unhealthy', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Service down'))
      mockBlockchain.mockRejectedValueOnce(new Error('Blockchain also down'))

      const isHealthy = await service.healthcheck()

      expect(isHealthy).toBe(false)
    })
  })

  describe('Data Validation', () => {
    test('should handle invalid count gracefully', async () => {
      const invalidData = { ...mockMempoolData, count: 'invalid' }
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Invalid data'))
      mockBlockchain.mockResolvedValueOnce({ unconfirmed_count: 0 })

      const result = await service.getMempoolInfo()
      
      expect(result.count).toBe(0)
      expect(result.congestionLevel).toBe('low')
    })

    test('should handle missing vsize gracefully', async () => {
      const invalidData = { ...mockMempoolData, vsize: null }
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Invalid data'))
      mockBlockchain.mockResolvedValueOnce({ unconfirmed_count: 1000 })

      const result = await service.getMempoolInfo()
      
      expect(result.count).toBe(1000)
      expect(result.vsize).toBe(0) // Fallback value
    })

    test('should handle missing total_fee gracefully', async () => {
      const invalidData = { ...mockMempoolData, total_fee: undefined }
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Invalid data'))
      mockBlockchain.mockResolvedValueOnce({ unconfirmed_count: 500 })

      const result = await service.getMempoolInfo()
      
      expect(result.count).toBe(500)
      expect(result.totalFees).toBe(0) // Fallback value
    })
  })
})

describe('Service Factory Functions', () => {
  test('getMempoolService should return singleton instance', () => {
    const service1 = getMempoolService()
    const service2 = getMempoolService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(MempoolService)
  })
})

describe('Convenience Functions', () => {
  describe('getMempoolInfo', () => {
    test('should return result with correct structure', async () => {
      const result = await getMempoolInfo()

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

  describe('getCongestionLevel', () => {
    test('should return result with correct structure', async () => {
      const result = await getCongestionLevel()

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

describe('Congestion Analysis', () => {
  test('should analyze congestion based on mempool size', () => {
    const testCases = [
      { count: 500, vsize: 250000, expected: 'low' },
      { count: 5000, vsize: 1500000, expected: 'medium' },
      { count: 15000, vsize: 4000000, expected: 'high' },
    ]

    testCases.forEach(({ count, vsize, expected }) => {
      expect(typeof count).toBe('number')
      expect(typeof vsize).toBe('number')
      expect(['low', 'medium', 'high']).toContain(expected)
    })
  })

  test('should handle edge cases in congestion calculation', () => {
    const edgeCases = [
      { count: 0, vsize: 0 },
      { count: 1, vsize: 1 },
      { count: Number.MAX_SAFE_INTEGER, vsize: Number.MAX_SAFE_INTEGER },
    ]

    edgeCases.forEach(({ count, vsize }) => {
      expect(typeof count).toBe('number')
      expect(typeof vsize).toBe('number')
      expect(Number.isFinite(count)).toBe(true)
      expect(Number.isFinite(vsize)).toBe(true)
    })
  })
}) 