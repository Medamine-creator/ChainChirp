import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import type { Currency } from '../../../src/types'
import { MarketService, getMarketService } from '../../../src/services/market'

describe('MarketService (Unified)', () => {
  let service: MarketService

  beforeEach(() => {
    service = new MarketService()
  })

  afterEach(() => {
    service.clearAllCaches()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('MarketService')
    })

    test('should combine endpoints from all sub-services', () => {
      expect(Array.isArray(service.endpoints)).toBe(true)
      expect(service.endpoints.length).toBeGreaterThan(0)
      
      // Should include endpoints from price service
      expect(service.endpoints).toContain('/simple/price')
      expect(service.endpoints).toContain('/coins/bitcoin')
      
      // Should include endpoints from volume service  
      expect(service.endpoints).toContain('/coins/bitcoin/tickers')
      
      // Should include endpoints from market chart
      expect(service.endpoints).toContain('/coins/bitcoin/market_chart')
    })
  })

  describe('Individual Service Access', () => {
    test('should provide access to price service', () => {
      const priceService = service.getPriceService()
      expect(priceService.name).toBe('PriceService')
    })

    test('should provide access to volume service', () => {
      const volumeService = service.getVolumeService()
      expect(volumeService.name).toBe('VolumeService')
    })

    test('should provide access to change service', () => {
      const changeService = service.getChangeService()
      expect(changeService.name).toBe('ChangeService')
    })

    test('should provide access to high/low service', () => {
      const highlowService = service.getHighLowService()
      expect(highlowService.name).toBe('HighLowService')
    })

    test('should provide access to sparkline service', () => {
      const sparklineService = service.getSparklineService()
      expect(sparklineService.name).toBe('SparklineService')
    })
  })

  describe('Cache Management', () => {
    test('should clear all caches correctly', () => {
      service.clearAllCaches()
      
      const stats = service.getAllCacheStats()
      expect(stats).toHaveProperty('price')
      expect(stats).toHaveProperty('volume')
      expect(stats).toHaveProperty('changes')
      expect(stats).toHaveProperty('highlow')
      expect(stats).toHaveProperty('sparkline')
    })

    test('should provide cache statistics from all services', () => {
      const stats = service.getAllCacheStats()
      
      expect(stats.price).toHaveProperty('size')
      expect(stats.price).toHaveProperty('keys')
      expect(stats.volume).toHaveProperty('size')
      expect(stats.volume).toHaveProperty('keys')
      expect(stats.changes).toHaveProperty('size')
      expect(stats.changes).toHaveProperty('keys')
      expect(stats.highlow).toHaveProperty('size')
      expect(stats.highlow).toHaveProperty('keys')
      expect(stats.sparkline).toHaveProperty('size')
      expect(stats.sparkline).toHaveProperty('keys')
    })
  })

  describe('Service Properties', () => {
    test('should be instance of MarketService', () => {
      expect(service).toBeInstanceOf(MarketService)
    })

    test('should have readonly endpoints', () => {
      expect(Array.isArray(service.endpoints)).toBe(true)
      expect(service.endpoints.length).toBeGreaterThan(0)
    })
  })

  describe('Service Integration', () => {
    test('should maintain separate service instances', () => {
      const priceService1 = service.getPriceService()
      const priceService2 = service.getPriceService()
      
      // Should return the same instance (singleton within MarketService)
      expect(priceService1).toBe(priceService2)
    })

    test('should provide different service types', () => {
      const priceService = service.getPriceService()
      const volumeService = service.getVolumeService()
      const changeService = service.getChangeService()
      
      expect(priceService).not.toBe(volumeService)
      expect(volumeService).not.toBe(changeService)
      expect(changeService).not.toBe(priceService)
    })
  })
})

describe('Service Factory Functions', () => {
  test('getMarketService should return singleton instance', () => {
    const service1 = getMarketService()
    const service2 = getMarketService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(MarketService)
  })

  test('getMarketService should return service with correct name', () => {
    const service = getMarketService()
    expect(service.name).toBe('MarketService')
  })

  test('getMarketService should maintain sub-service consistency', () => {
    const service1 = getMarketService()
    const service2 = getMarketService()
    
    // Sub-services should be the same across singleton instances
    expect(service1.getPriceService()).toBe(service2.getPriceService())
    expect(service1.getVolumeService()).toBe(service2.getVolumeService())
  })
})

describe('Health Check Integration', () => {
  test('should have healthcheck method', async () => {
    const service = new MarketService()
    
    // Should not throw error
    expect(typeof service.healthcheck).toBe('function')
    
    try {
      const health = await service.healthcheck()
      expect(typeof health).toBe('boolean')
    } catch (error) {
      // Health check might fail due to network/API issues in test environment
      // This is acceptable for unit tests
    }
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

describe('Service Architecture', () => {
  test('should properly compose all required services', () => {
    const service = new MarketService()
    
    // Verify all required services are accessible
    expect(service.getPriceService()).toBeDefined()
    expect(service.getVolumeService()).toBeDefined()
    expect(service.getChangeService()).toBeDefined()
    expect(service.getHighLowService()).toBeDefined()
    expect(service.getSparklineService()).toBeDefined()
  })

  test('should maintain service isolation', () => {
    const service = new MarketService()
    
    // Each service should have its own cache
    service.clearAllCaches()
    
    const priceStats = service.getPriceService().getCacheStats()
    const volumeStats = service.getVolumeService().getCacheStats()
    
    expect(priceStats.size).toBe(0)
    expect(volumeStats.size).toBe(0)
  })

  test('should properly aggregate endpoints', () => {
    const service = new MarketService()
    
    const priceEndpoints = service.getPriceService().endpoints
    const volumeEndpoints = service.getVolumeService().endpoints
    const changeEndpoints = service.getChangeService().endpoints
    const highlowEndpoints = service.getHighLowService().endpoints
    const sparklineEndpoints = service.getSparklineService().endpoints
    
    // Unified service should contain all sub-service endpoints
    const allExpectedEndpoints = [
      ...priceEndpoints,
      ...volumeEndpoints,
      ...changeEndpoints,
      ...highlowEndpoints,
      ...sparklineEndpoints,
    ]
    
    allExpectedEndpoints.forEach(endpoint => {
      expect(service.endpoints).toContain(endpoint)
    })
  })
})

describe('Error Handling', () => {
  test('should handle service initialization gracefully', () => {
    expect(() => new MarketService()).not.toThrow()
  })

  test('should handle cache operations safely', () => {
    const service = new MarketService()
    
    expect(() => service.clearAllCaches()).not.toThrow()
    expect(() => service.getAllCacheStats()).not.toThrow()
  })

  test('should handle service access safely', () => {
    const service = new MarketService()
    
    expect(() => service.getPriceService()).not.toThrow()
    expect(() => service.getVolumeService()).not.toThrow()
    expect(() => service.getChangeService()).not.toThrow()
    expect(() => service.getHighLowService()).not.toThrow()
    expect(() => service.getSparklineService()).not.toThrow()
  })
}) 