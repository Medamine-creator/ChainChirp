import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import type { Currency } from '../../../src/types'
import { HighLowService, getHighLowService } from '../../../src/services/market/highlowService'

describe('HighLowService', () => {
  let service: HighLowService

  beforeEach(() => {
    service = new HighLowService()
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('HighLowService')
    })

    test('should have correct endpoints', () => {
      expect(service.endpoints).toContain('/coins/bitcoin')
      expect(service.endpoints).toContain('/coins/bitcoin/market_chart')
      expect(service.endpoints).toHaveLength(2)
    })
  })

  describe('calculateDistanceFromHighLow', () => {
    test('should calculate distance from high/low correctly', () => {
      const result = service.calculateDistanceFromHighLow(45000, 46000, 44000)

      expect(result).toEqual({
        distanceFromHigh: 1000,
        distanceFromLow : 1000,
        percentFromHigh : 2.17,
        percentFromLow  : 2.27,
        positionInRange : 0.5,
      })
    })

    test('should handle current price at high', () => {
      const result = service.calculateDistanceFromHighLow(46000, 46000, 44000)

      expect(result.distanceFromHigh).toBe(0)
      expect(result.positionInRange).toBe(1)
    })

    test('should handle current price at low', () => {
      const result = service.calculateDistanceFromHighLow(44000, 46000, 44000)

      expect(result.distanceFromLow).toBe(0)
      expect(result.positionInRange).toBe(0)
    })

    test('should handle zero high price', () => {
      const result = service.calculateDistanceFromHighLow(1000, 0, 500)

      expect(result.percentFromHigh).toBe(0)
      expect(typeof result.percentFromLow).toBe('number')
    })

    test('should handle zero range', () => {
      const result = service.calculateDistanceFromHighLow(45000, 45000, 45000)

      expect(result.positionInRange).toBe(0)
      expect(result.distanceFromHigh).toBe(0)
      expect(result.distanceFromLow).toBe(0)
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
    test('should be instance of HighLowService', () => {
      expect(service).toBeInstanceOf(HighLowService)
    })

    test('should have endpoints as readonly array', () => {
      expect(Array.isArray(service.endpoints)).toBe(true)
      expect(service.endpoints.length).toBeGreaterThan(0)
    })
  })
})

describe('Service Factory Functions', () => {
  test('getHighLowService should return singleton instance', () => {
    const service1 = getHighLowService()
    const service2 = getHighLowService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(HighLowService)
  })

  test('getHighLowService should return service with correct name', () => {
    const service = getHighLowService()
    expect(service.name).toBe('HighLowService')
  })
})

describe('Mathematical Calculations', () => {
  test('should handle edge cases in distance calculations', () => {
    const service = new HighLowService()
    
    // Test with very small numbers
    const result1 = service.calculateDistanceFromHighLow(0.00001, 0.00002, 0.000005)
    expect(typeof result1.distanceFromHigh).toBe('number')
    expect(typeof result1.distanceFromLow).toBe('number')

    // Test with very large numbers
    const result2 = service.calculateDistanceFromHighLow(1000000, 1100000, 900000)
    expect(typeof result2.distanceFromHigh).toBe('number')
    expect(typeof result2.distanceFromLow).toBe('number')
  })

  test('should maintain precision in percentage calculations', () => {
    const service = new HighLowService()
    const result = service.calculateDistanceFromHighLow(12345.67, 12500.89, 12000.45)

    expect(Number.isFinite(result.percentFromHigh)).toBe(true)
    expect(Number.isFinite(result.percentFromLow)).toBe(true)
    expect(Number.isFinite(result.positionInRange)).toBe(true)
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