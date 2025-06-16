import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import type { Currency } from '../../../src/types'
import { ChangeService, getChangeService, getBitcoinPriceChange } from '../../../src/services/market/changeService'

// Create a mock for the API client
const mockApiResponse = mock(() => Promise.resolve({}))

describe('ChangeService', () => {
  let service: ChangeService

  beforeEach(() => {
    service = new ChangeService()
    mockApiResponse.mockClear()
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('ChangeService')
    })

    test('should have correct endpoints', () => {
      expect(service.endpoints).toContain('/simple/price')
      expect(service.endpoints).toContain('/coins/bitcoin/market_chart')
      expect(service.endpoints).toContain('/coins/bitcoin')
      expect(service.endpoints).toHaveLength(3)
    })
  })

  describe('calculateChangeFromPrices', () => {
    test('should calculate change correctly', () => {
      const result = service.calculateChangeFromPrices(45000, 44000)

      expect(result).toEqual({
        absolute  : 1000,
        percentage: 2.27,
      })
    })

    test('should handle zero previous price', () => {
      const result = service.calculateChangeFromPrices(45000, 0)

      expect(result).toEqual({
        absolute  : 45000,
        percentage: 0,
      })
    })

    test('should handle negative change', () => {
      const result = service.calculateChangeFromPrices(44000, 45000)

      expect(result).toEqual({
        absolute  : -1000,
        percentage: -2.22,
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

    test('should provide cache statistics structure', () => {
      const stats = service.getCacheStats()

      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('keys')
      expect(typeof stats.size).toBe('number')
      expect(Array.isArray(stats.keys)).toBe(true)
    })
  })

  describe('Service Properties', () => {
    test('should be instance of ChangeService', () => {
      expect(service).toBeInstanceOf(ChangeService)
    })

    test('should have endpoints as readonly array', () => {
      expect(Array.isArray(service.endpoints)).toBe(true)
      expect(service.endpoints.length).toBeGreaterThan(0)
    })
  })
})

describe('Service Factory Functions', () => {
  test('getChangeService should return singleton instance', () => {
    const service1 = getChangeService()
    const service2 = getChangeService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(ChangeService)
  })

  test('getChangeService should return service with correct name', () => {
    const service = getChangeService()
    expect(service.name).toBe('ChangeService')
  })
})

describe('Type Safety', () => {
  test('should handle different currency types', () => {
    const currencies: Currency[] = ['usd', 'eur', 'gbp', 'jpy', 'btc', 'eth', 'sats']
    
    currencies.forEach(currency => {
      expect(typeof currency).toBe('string')
      expect(['usd', 'eur', 'gbp', 'jpy', 'btc', 'eth', 'sats']).toContain(currency)
    })
  })
})

describe('Error Handling', () => {
  test('should handle calculation edge cases', () => {
    const testService = new ChangeService()
    
    // Test with very small numbers
    const result1 = testService.calculateChangeFromPrices(0.00001, 0.00002)
    expect(typeof result1.absolute).toBe('number')
    expect(typeof result1.percentage).toBe('number')

    // Test with very large numbers
    const result2 = testService.calculateChangeFromPrices(1000000, 999999)
    expect(typeof result2.absolute).toBe('number')
    expect(typeof result2.percentage).toBe('number')
  })

  test('should handle identical prices', () => {
    const testService = new ChangeService()
    const result = testService.calculateChangeFromPrices(45000, 45000)
    
    expect(result).toEqual({
      absolute  : 0,
      percentage: 0,
    })
  })
}) 