import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import type { Currency } from '@/types'

// Import after mocking  
import { PriceService, getPriceService, getCurrentBitcoinPrice, getBitcoinMarketData } from '@/services/market/priceService'

// Mock the API client
const mockCoingecko = mock(() => Promise.resolve({}))

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
    mockCoingecko.mockClear()
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
        bitcoin: { usd: 45000 }
      }

      mockCoingecko.mockResolvedValueOnce(mockResponse)

      const price = await service.getCurrentPrice('usd')

      expect(price).toBe(45000)
      expect(mockCoingecko).toHaveBeenCalledWith('/simple/price', {
        ids              : 'bitcoin',
        vs_currencies    : 'usd',
        include_24hr_change: false,
      })
    })

    test('should fetch current Bitcoin price in different currencies', async () => {
      const currencies: Currency[] = ['eur', 'gbp', 'jpy']
      
      for (const currency of currencies) {
        const mockResponse = {
          bitcoin: { [currency]: 40000 }
        }

        mockCoingecko.mockResolvedValueOnce(mockResponse)

        const price = await service.getCurrentPrice(currency)
        expect(price).toBe(40000)
      }
    })

    test('should throw error for invalid price data', async () => {
      const mockResponse = {
        bitcoin: { usd: 'invalid' }
      }

      mockCoingecko.mockResolvedValueOnce(mockResponse)

      await expect(service.getCurrentPrice('usd')).rejects.toThrow('Invalid price data for currency: usd')
    })

    test('should throw error when API call fails', async () => {
      mockCoingecko.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.getCurrentPrice('usd')).rejects.toThrow('Failed to fetch current price: Network error')
    })
  })

  describe('getMarketData', () => {
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

    test('should fetch and transform market data correctly', async () => {
      mockCoingecko.mockResolvedValueOnce([mockMarketData])

      const result = await service.getMarketData('usd')

      expect(result).toEqual({
        price           : 45000,
        currency        : 'usd',
        change24h       : 1500,
        changePercent24h: 3.45,
        change7d        : 7.8,
        change30d       : -2.1,
        marketCap       : 850000000000,
        volume24h       : 25000000000,
        high24h         : 46000,
        low24h          : 44000,
        ath             : 69000,
        atl             : 3200,
        lastUpdated     : new Date('2024-01-15T10:30:00.000Z'),
      })
    })

    test('should cache market data correctly', async () => {
      mockCoingecko.mockResolvedValueOnce([mockMarketData])

      // First call
      const result1 = await service.getMarketData('usd')
      
      // Second call (should use cache)
      const result2 = await service.getMarketData('usd')

      expect(result1).toEqual(result2)
      expect(mockCoingecko).toHaveBeenCalledTimes(1)
    })

    test('should throw error for empty market data', async () => {
      mockCoingecko.mockResolvedValueOnce([])

      await expect(service.getMarketData('usd')).rejects.toThrow('No market data available')
    })

    test('should throw error for invalid market data response', async () => {
      mockCoingecko.mockResolvedValueOnce({})

      await expect(service.getMarketData('usd')).rejects.toThrow('Invalid market data response')
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

      mockCoingecko.mockResolvedValueOnce(mockResponse)

      const prices = await service.getHistoricalPrice('usd', 7)

      expect(prices).toEqual([44000, 45000, 46000])
      expect(mockCoingecko).toHaveBeenCalledWith('/coins/bitcoin/market_chart', {
        vs_currency: 'usd',
        days       : '7',
        interval   : 'daily',
      })
    })

    test('should use hourly interval for short timeframes', async () => {
      const mockResponse = {
        prices: [[1704067200000, 44000]]
      }

      mockCoingecko.mockResolvedValueOnce(mockResponse)

      await service.getHistoricalPrice('usd', 1)

      expect(mockCoingecko).toHaveBeenCalledWith('/coins/bitcoin/market_chart', {
        vs_currency: 'usd',
        days       : '1',
        interval   : 'hourly',
      })
    })

    test('should throw error for invalid historical data', async () => {
      mockCoingecko.mockResolvedValueOnce({ prices: null })

      await expect(service.getHistoricalPrice('usd', 7)).rejects.toThrow('Invalid historical price data')
    })
  })

  describe('getMultiCurrencyPrices', () => {
    test('should fetch multiple currency prices', async () => {
      const mockResponse = {
        bitcoin: {
          usd: 45000,
          eur: 40000,
          gbp: 35000,
        }
      }

      mockCoingecko.mockResolvedValueOnce(mockResponse)

      const prices = await service.getMultiCurrencyPrices(['usd', 'eur', 'gbp'])

      expect(prices).toEqual({
        usd: 45000,
        eur: 40000,
        gbp: 35000,
      })
    })

    test('should handle missing currency data gracefully', async () => {
      const mockResponse = {
        bitcoin: {
          usd: 45000,
          // eur missing
        }
      }

      mockCoingecko.mockResolvedValueOnce(mockResponse)

      const prices = await service.getMultiCurrencyPrices(['usd', 'eur'])

      expect(prices).toEqual({
        usd: 45000,
      })
    })
  })

  describe('calculatePriceChange', () => {
    test('should calculate price change correctly', () => {
      const result = service.calculatePriceChange(45000, 44000)

      expect(result).toEqual({
        absolute  : 1000,
        percentage: 2.27,
      })
    })

    test('should handle zero previous price', () => {
      const result = service.calculatePriceChange(45000, 0)

      expect(result).toEqual({
        absolute  : 45000,
        percentage: 0,
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

    test('should provide cache statistics', async () => {
      mockCoingecko.mockResolvedValueOnce([mockMarketData])
      
      await service.getMarketData('usd')
      const stats = service.getCacheStats()

      expect(stats.size).toBe(1)
      expect(stats.keys).toContain('market-usd')
    })
  })

  describe('Health Check', () => {
    test('should return true when service is healthy', async () => {
      mockCoingecko.mockResolvedValueOnce({ bitcoin: { usd: 45000 } })

      const isHealthy = await service.healthcheck()

      expect(isHealthy).toBe(true)
    })

    test('should return false when service is unhealthy', async () => {
      mockCoingecko.mockRejectedValueOnce(new Error('Service down'))

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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentBitcoinPrice', () => {
    test('should return successful result', async () => {
      mockCoingecko.mockResolvedValueOnce({ bitcoin: { usd: 45000 } })

      const result = await getCurrentBitcoinPrice('usd')

      expect(result.success).toBe(true)
      expect(result.data).toBe(45000)
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(typeof result.executionTime).toBe('number')
    })

    test('should return error result on failure', async () => {
      mockCoingecko.mockRejectedValueOnce(new Error('API Error'))

      const result = await getCurrentBitcoinPrice('usd')

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(typeof result.executionTime).toBe('number')
    })
  })

  describe('getBitcoinMarketData', () => {
    test('should return successful result', async () => {
      const mockData = [{
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
      }]

      mockCoingecko.mockResolvedValueOnce(mockData)

      const result = await getBitcoinMarketData('usd')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.price).toBe(45000)
    })

    test('should return error result on failure', async () => {
      mockCoingecko.mockRejectedValueOnce(new Error('API Error'))

      const result = await getBitcoinMarketData('usd')

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
    })
  })
}) 