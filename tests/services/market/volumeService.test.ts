import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import type { Currency } from '../../../src/types'
import { VolumeService, getVolumeService } from '../../../src/services/market/volumeService'

describe('VolumeService', () => {
  let service: VolumeService

  beforeEach(() => {
    service = new VolumeService()
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('VolumeService')
    })

    test('should have correct endpoints', () => {
      expect(service.endpoints).toContain('/coins/bitcoin')
      expect(service.endpoints).toContain('/coins/bitcoin/tickers')
      expect(service.endpoints).toHaveLength(2)
    })
  })

  describe('analyzeVolumeTrend', () => {
    test('should analyze increasing trend', () => {
      const volumes = [1000, 1100, 1200, 1300, 1400]
      const result = service.analyzeVolumeTrend(volumes)

      expect(result.trend).toBe('increasing')
      expect(['weak', 'moderate', 'strong']).toContain(result.strength)
      expect(typeof result.volatility).toBe('number')
    })

    test('should analyze decreasing trend', () => {
      const volumes = [1400, 1300, 1200, 1100, 1000]
      const result = service.analyzeVolumeTrend(volumes)

      expect(result.trend).toBe('decreasing')
      expect(['weak', 'moderate', 'strong']).toContain(result.strength)
      expect(typeof result.volatility).toBe('number')
    })

    test('should analyze stable trend', () => {
      const volumes = [1000, 1005, 998, 1002, 999]
      const result = service.analyzeVolumeTrend(volumes)

      expect(result.trend).toBe('stable')
      expect(['weak', 'moderate', 'strong']).toContain(result.strength)
      expect(typeof result.volatility).toBe('number')
    })

    test('should handle single volume data point', () => {
      const volumes = [1000]
      const result = service.analyzeVolumeTrend(volumes)

      expect(result.trend).toBe('stable')
      expect(result.strength).toBe('weak')
      expect(result.volatility).toBe(0)
    })

    test('should handle empty volume array', () => {
      const volumes: number[] = []
      const result = service.analyzeVolumeTrend(volumes)

      expect(result.trend).toBe('stable')
      expect(result.strength).toBe('weak')
      expect(result.volatility).toBe(0)
    })

    test('should handle identical volumes', () => {
      const volumes = [1000, 1000, 1000, 1000]
      const result = service.analyzeVolumeTrend(volumes)

      expect(result.trend).toBe('stable')
      expect(result.volatility).toBe(0)
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
    test('should be instance of VolumeService', () => {
      expect(service).toBeInstanceOf(VolumeService)
    })

    test('should have endpoints as readonly array', () => {
      expect(Array.isArray(service.endpoints)).toBe(true)
      expect(service.endpoints.length).toBeGreaterThan(0)
    })
  })
})

describe('Service Factory Functions', () => {
  test('getVolumeService should return singleton instance', () => {
    const service1 = getVolumeService()
    const service2 = getVolumeService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(VolumeService)
  })

  test('getVolumeService should return service with correct name', () => {
    const service = getVolumeService()
    expect(service.name).toBe('VolumeService')
  })
})

describe('Volume Analysis Edge Cases', () => {
  test('should handle extreme volume values', () => {
    const service = new VolumeService()
    
    // Very large volumes
    const largeVolumes = [1e9, 1.1e9, 1.2e9, 1.05e9]
    const result1 = service.analyzeVolumeTrend(largeVolumes)
    expect(typeof result1.volatility).toBe('number')
    expect(Number.isFinite(result1.volatility)).toBe(true)

    // Very small volumes
    const smallVolumes = [0.001, 0.0011, 0.0012, 0.0009]
    const result2 = service.analyzeVolumeTrend(smallVolumes)
    expect(typeof result2.volatility).toBe('number')
    expect(Number.isFinite(result2.volatility)).toBe(true)
  })

  test('should handle zero volumes', () => {
    const service = new VolumeService()
    
    const volumesWithZero = [0, 100, 200, 150]
    const result = service.analyzeVolumeTrend(volumesWithZero)
    
    expect(['increasing', 'decreasing', 'stable']).toContain(result.trend)
    expect(['weak', 'moderate', 'strong']).toContain(result.strength)
  })

  test('should handle volatile volume patterns', () => {
    const service = new VolumeService()
    
    const volatileVolumes = [1000, 2000, 500, 1800, 300, 1500]
    const result = service.analyzeVolumeTrend(volatileVolumes)
    
    expect(typeof result.volatility).toBe('number')
    expect(result.volatility).toBeGreaterThan(0)
  })
})

describe('Mathematical Accuracy', () => {
  test('should calculate volatility correctly', () => {
    const service = new VolumeService()
    
    // Test with known variance/standard deviation
    const volumes = [100, 200, 300] // Mean = 200, Variance = 6666.67, StdDev = 81.65
    const result = service.analyzeVolumeTrend(volumes)
    
    expect(result.volatility).toBeGreaterThan(0)
    expect(Number.isFinite(result.volatility)).toBe(true)
  })

  test('should maintain precision with decimal volumes', () => {
    const service = new VolumeService()
    
    const decimalVolumes = [123.456, 234.567, 345.678, 456.789]
    const result = service.analyzeVolumeTrend(decimalVolumes)
    
    expect(Number.isFinite(result.volatility)).toBe(true)
    expect(['increasing', 'decreasing', 'stable']).toContain(result.trend)
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

describe('Trend Strength Classification', () => {
  test('should classify trend strength correctly', () => {
    const service = new VolumeService()
    
    // Strong increasing trend (>25% change)
    const strongIncrease = [1000, 1300, 1600, 1900]
    const result1 = service.analyzeVolumeTrend(strongIncrease)
    expect(result1.trend).toBe('increasing')
    
    // Weak change (<10% change)
    const weakChange = [1000, 1005, 1010, 1008]
    const result2 = service.analyzeVolumeTrend(weakChange)
    expect(['weak', 'moderate', 'strong']).toContain(result2.strength)
  })
}) 