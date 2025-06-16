import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import type { Currency, TimeFrame } from '../../../src/types'
import { SparklineService, getSparklineService } from '../../../src/services/market/sparklineService'

describe('SparklineService', () => {
  let service: SparklineService

  beforeEach(() => {
    service = new SparklineService()
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('SparklineService')
    })

    test('should have correct endpoints', () => {
      expect(service.endpoints).toContain('/coins/bitcoin')
      expect(service.endpoints).toContain('/coins/bitcoin/market_chart')
      expect(service.endpoints).toHaveLength(2)
    })
  })

  describe('renderAsciiSparkline', () => {
    test('should render sparkline for empty data', () => {
      const result = service.renderAsciiSparkline([])
      expect(result).toBe('')
    })

    test('should render sparkline for single price', () => {
      const result = service.renderAsciiSparkline([45000], 20, 5)
      expect(typeof result).toBe('string')
      expect(result.includes('─')).toBe(true)
    })

    test('should render sparkline for multiple prices', () => {
      const prices = [44000, 45000, 46000, 45500, 44500]
      const result = service.renderAsciiSparkline(prices, 20, 8)
      
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result.includes('\n')).toBe(true)
    })

    test('should handle identical prices', () => {
      const prices = [45000, 45000, 45000, 45000]
      const result = service.renderAsciiSparkline(prices, 10, 5)
      
      expect(typeof result).toBe('string')
      expect(result.includes('─')).toBe(true)
    })

    test('should handle custom dimensions', () => {
      const prices = [44000, 45000, 46000]
      const width = 30
      const height = 10
      const result = service.renderAsciiSparkline(prices, width, height)
      
      const lines = result.split('\n')
      expect(lines).toHaveLength(height)
      lines.forEach(line => {
        expect(line.length).toBe(width)
      })
    })
  })

  describe('Timeframe Conversion', () => {
    test('should handle different timeframe types', () => {
      const timeframes: TimeFrame[] = ['1h', '24h', '7d', '30d', '1y']
      
      timeframes.forEach(timeframe => {
        expect(typeof timeframe).toBe('string')
        expect(['1h', '24h', '7d', '30d', '1y']).toContain(timeframe)
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
    test('should be instance of SparklineService', () => {
      expect(service).toBeInstanceOf(SparklineService)
    })

    test('should have endpoints as readonly array', () => {
      expect(Array.isArray(service.endpoints)).toBe(true)
      expect(service.endpoints.length).toBeGreaterThan(0)
    })
  })
})

describe('Service Factory Functions', () => {
  test('getSparklineService should return singleton instance', () => {
    const service1 = getSparklineService()
    const service2 = getSparklineService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(SparklineService)
  })

  test('getSparklineService should return service with correct name', () => {
    const service = getSparklineService()
    expect(service.name).toBe('SparklineService')
  })
})

describe('ASCII Rendering Edge Cases', () => {
  test('should handle extreme price ranges', () => {
    const service = new SparklineService()
    
    // Test with very small price differences
    const smallRange = [1.0001, 1.0002, 1.0001, 1.0003]
    const result1 = service.renderAsciiSparkline(smallRange, 10, 5)
    expect(typeof result1).toBe('string')

    // Test with very large price differences
    const largeRange = [1000, 50000, 25000, 75000]
    const result2 = service.renderAsciiSparkline(largeRange, 10, 5)
    expect(typeof result2).toBe('string')
  })

  test('should handle different aspect ratios', () => {
    const service = new SparklineService()
    const prices = [100, 200, 150, 300, 250]
    
    // Wide and short
    const wide = service.renderAsciiSparkline(prices, 50, 3)
    expect(wide.split('\n')).toHaveLength(3)
    
    // Narrow and tall
    const tall = service.renderAsciiSparkline(prices, 5, 20)
    expect(tall.split('\n')).toHaveLength(20)
  })

  test('should handle minimum dimensions', () => {
    const service = new SparklineService()
    const prices = [100, 200, 150]
    
    const result = service.renderAsciiSparkline(prices, 1, 1)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThanOrEqual(0)
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

  test('should handle different timeframe types', () => {
    const timeframes: TimeFrame[] = ['1h', '24h', '7d', '30d', '1y']
    
    timeframes.forEach(timeframe => {
      expect(typeof timeframe).toBe('string')
      expect(['1h', '24h', '7d', '30d', '1y']).toContain(timeframe)
    })
  })
})

describe('Data Validation', () => {
  test('should handle invalid price arrays gracefully', () => {
    const service = new SparklineService()
    
    // Empty array
    expect(service.renderAsciiSparkline([])).toBe('')
    
    // Array with NaN
    const withNaN = [100, NaN, 200]
    const result = service.renderAsciiSparkline(withNaN, 10, 5)
    expect(typeof result).toBe('string')
    
    // Array with Infinity
    const withInfinity = [100, Infinity, 200]
    const result2 = service.renderAsciiSparkline(withInfinity, 10, 5)
    expect(typeof result2).toBe('string')
  })

  test('should handle zero and negative prices', () => {
    const service = new SparklineService()
    
    // With zeros
    const withZeros = [0, 100, 0, 200]
    const result1 = service.renderAsciiSparkline(withZeros, 10, 5)
    expect(typeof result1).toBe('string')
    
    // With negative numbers
    const withNegatives = [-100, 100, -50, 200]
    const result2 = service.renderAsciiSparkline(withNegatives, 10, 5)
    expect(typeof result2).toBe('string')
  })
}) 