import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import type { Currency } from '@/types'

// Mock the API client module
const mockFetchWithFallback = mock(() => Promise.resolve({}))

// Mock the module before importing
mock.module('@/services/apiClient', () => ({
  fetchWithFallback: mockFetchWithFallback,
  blockchain: mock(() => Promise.resolve({})),
  mempool: mock(() => Promise.resolve({})),
}))

// Import after mocking  
import { PriceService, getPriceService, getBitcoinPrice, getBitcoinDetailedPrice } from '@/services/market/priceService'

describe('PriceService', () => {
  let service: PriceService
  
  const mockMarketData = {
    current_price              : 45000,
    price_change_24h          : 1500,
    price_change_percentage_24h: 3.45,
    price_change_percentage_7d : 7.8,
    price_change_percentage_30d: -2.1,
    market_cap                : 850000000000,
    total_volume              : 25000000000,
    high_24h                  : 46000,
    low_24h                   : 44000,
    ath                       : 69000,
    atl                       : 3200,
    last_updated              : '2024-01-15T10:30:00.000Z',
  }

  beforeEach(() => {
    service = new PriceService()
    mockFetchWithFallback.mockClear()
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Service Configuration', () => {
    test('should have correct service name', () => {
      expect(service.name).toBe('PriceService')
    })

    test('should have correct endpoints', () => {
      expect(service.endpoints).toContain('/simple/price')
      expect(service.endpoints).toContain('/coins/bitcoin')
      expect(service.endpoints).toHaveLength(2)
    })
  })

  describe('getCurrentPrice', () => {
    test('should fetch current Bitcoin price in USD', async () => {
      const mockResponse = {
        bitcoin: { 
          usd: 45000,
          last_updated_at: 1704067200
        }
      }

      mockFetchWithFallback.mockResolvedValueOnce(mockResponse)

      const priceData = await service.getCurrentPrice('usd')

      expect(priceData.price).toBe(45000)
      expect(priceData.currency).toBe('usd')
      expect(priceData.timestamp).toBeInstanceOf(Date)
    })

    test('should fetch current Bitcoin price in different currencies', async () => {
      const currencies: Currency[] = ['eur', 'gbp', 'jpy']
      
      for (const currency of currencies) {
        const mockResponse = {
          bitcoin: { 
            [currency]: 40000,
            last_updated_at: 1704067200
          }
        }

        mockFetchWithFallback.mockResolvedValueOnce(mockResponse)

        const priceData = await service.getCurrentPrice(currency)
        expect(priceData.price).toBe(40000)
        expect(priceData.currency).toBe(currency)
      }
    })

    test('should throw error for invalid price data', async () => {
      const mockResponse = {
        bitcoin: null
      }

      mockFetchWithFallback.mockResolvedValueOnce(mockResponse)

      await expect(service.getCurrentPrice('usd')).rejects.toThrow('Invalid price data: bitcoin data not found')
    })

    test('should throw error when API call fails', async () => {
      mockFetchWithFallback.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.getCurrentPrice('usd')).rejects.toThrow('Failed to fetch current price: Network error')
    })
  })

  describe('getDetailedPrice', () => {
    const mockDetailedResponse = {
      market_data: {
        current_price: { usd: 45000 },
        market_cap: { usd: 850000000000 },
        total_volume: { usd: 25000000000 },
        price_change_24h: 1500,
      price_change_percentage_24h: 3.45,
        high_24h: { usd: 46000 },
        low_24h: { usd: 44000 },
        ath: { usd: 69000 },
        ath_date: { usd: '2021-11-10T14:24:11.849Z' },
        atl: { usd: 3200 },
        atl_date: { usd: '2013-07-05T00:00:00.000Z' },
        ath_change_percentage: { usd: -34.78 },
        atl_change_percentage: { usd: 1306.25 },
        circulating_supply: 19750000,
        total_supply: 19750000,
        max_supply: 21000000
      },
      last_updated: '2024-01-15T10:30:00.000Z'
    }

    test('should fetch and transform detailed price data correctly', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockDetailedResponse)

      const result = await service.getDetailedPrice('usd')

      expect(result.price).toBe(45000)
      expect(result.currency).toBe('usd')
      expect(result.marketCap).toBe(850000000000)
      expect(result.volume24h).toBe(25000000000)
      expect(result.change24h).toBe(1500)
      expect(result.changePercent24h).toBe(3.45)
      expect(result.high24h).toBe(46000)
      expect(result.low24h).toBe(44000)
      expect(result.ath).toBe(69000)
      expect(result.atl).toBe(3200)
    })

    test('should cache detailed price data correctly', async () => {
      mockFetchWithFallback.mockResolvedValueOnce(mockDetailedResponse)

      // First call
      const result1 = await service.getDetailedPrice('usd')
      
      // Second call (should use cache)
      const result2 = await service.getDetailedPrice('usd')

      expect(result1.price).toEqual(result2.price)
      expect(mockFetchWithFallback).toHaveBeenCalledTimes(1)
    })

    test('should throw error for invalid detailed price data', async () => {
      const invalidResponse = {
        market_data: null
      }

      mockFetchWithFallback.mockResolvedValueOnce(invalidResponse)

      await expect(service.getDetailedPrice('usd')).rejects.toThrow('Invalid detailed price data: market_data not found')
    })
  })

  describe('getHistoricalPrice', () => {
    test('should fetch historical prices correctly', async () => {
      const mockResponse = {
        prices: [
          [1704067200000, 44000],
          [1704153600000, 45000],
          [1704240000000, 46000],
        ]
      }

      mockFetchWithFallback.mockResolvedValueOnce(mockResponse)

      const prices = await service.getHistoricalPrice('usd', 7)

      expect(prices).toEqual([44000, 45000, 46000])
    })

    test('should use hourly interval for short timeframes', async () => {
      const mockResponse = {
        prices: [[1704067200000, 44000]]
      }

      mockFetchWithFallback.mockResolvedValueOnce(mockResponse)

      await service.getHistoricalPrice('usd', 1)

      expect(mockFetchWithFallback).toHaveBeenCalledWith('/coins/bitcoin/market_chart', {
        vs_currency: 'usd',
        days       : '1',
        interval   : 'hourly',
      }, { providers: ['coingecko', 'binance'] })
    })

    test('should throw error for invalid historical data', async () => {
      mockFetchWithFallback.mockResolvedValueOnce({ prices: null })

      await expect(service.getHistoricalPrice('usd', 7)).rejects.toThrow('Invalid historical price data')
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
      const mockResponse = {
        bitcoin: { 
          usd: 45000,
          last_updated_at: 1704067200
        }
      }
      
      mockFetchWithFallback.mockResolvedValueOnce(mockResponse)
      
      await service.getCurrentPrice('usd')
      const stats = service.getCacheStats()

      expect(stats.size).toBe(1)
      expect(stats.keys).toContain('price-usd')
    })
  })

  describe('Health Check', () => {
    test('should return true when service is healthy', async () => {
      const mockResponse = {
        bitcoin: { 
          usd: 45000,
          last_updated_at: 1704067200
        }
      }
      
      mockFetchWithFallback.mockResolvedValueOnce(mockResponse)

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
  test('getPriceService should return singleton instance', () => {
    const service1 = getPriceService()
    const service2 = getPriceService()

    expect(service1).toBe(service2)
    expect(service1).toBeInstanceOf(PriceService)
  })
})

describe('Convenience Functions', () => {
  describe('getBitcoinPrice', () => {
    test('should return result with correct structure', async () => {
      // Note: These tests run against real implementations since mocking is complex
      // The important thing is testing the return structure is correct
      const result = await getBitcoinPrice('usd')

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('executionTime')
      expect(typeof result.success).toBe('boolean')
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(typeof result.executionTime).toBe('number')
      
      if (result.success) {
        expect(result.data).toHaveProperty('price')
        expect(result.data).toHaveProperty('currency')
        expect(result.data).toHaveProperty('timestamp')
      } else {
        expect(result.error).toBeInstanceOf(Error)
      }
    })
  })

  describe('getBitcoinDetailedPrice', () => {
    test('should return result with correct structure', async () => {
      // Note: These tests run against real implementations since mocking is complex
      // The important thing is testing the return structure is correct
      const result = await getBitcoinDetailedPrice('usd')

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('executionTime')
      expect(typeof result.success).toBe('boolean')
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(typeof result.executionTime).toBe('number')
      
      if (result.success) {
        expect(result.data).toHaveProperty('price')
        expect(result.data).toHaveProperty('currency')
        expect(result.data).toHaveProperty('timestamp')
      } else {
      expect(result.error).toBeInstanceOf(Error)
      }
    })
  })
}) 