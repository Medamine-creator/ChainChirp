import { coingecko } from '@/services/apiClient'
import type {
  CoinGeckoSimplePrice,
  CoinGeckoMarketData,
  MarketData,
  PriceChangeData,
  Currency,
  BaseService,
  CommandResult,
} from '@/types'

// =============================================================================
// Price Service Configuration
// =============================================================================

const PRICE_CACHE_TTL = 30 * 1000 // 30 seconds
const ENDPOINTS = {
  simplePrice: '/simple/price',
  marketData : '/coins/bitcoin',
} as const

interface PriceCache {
  data     : MarketData
  timestamp: number
}

// =============================================================================
// Price Service Implementation
// =============================================================================

export class PriceService implements BaseService {
  readonly name = 'PriceService'
  readonly endpoints = [
    ENDPOINTS.simplePrice,
    ENDPOINTS.marketData,
  ]

  private cache = new Map<string, PriceCache>()
  private previousPrices = new Map<Currency, number>()

  // ===========================================================================
  // Core Price Methods
  // ===========================================================================

  async getCurrentPrice(currency: Currency = 'usd'): Promise<number> {
    try {
      const data = await coingecko<CoinGeckoSimplePrice>(ENDPOINTS.simplePrice, {
        ids                : 'bitcoin',
        vs_currencies      : currency,
        include_24hr_change: false,
      })

      const price = data.bitcoin[currency]
      if (typeof price !== 'number') {
        throw new Error(`Invalid price data for currency: ${currency}`)
      }

      // Store previous price for change calculations
      this.previousPrices.set(currency, price)

      return price
    } catch (error) {
      throw new Error(
        `Failed to fetch current price: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getMarketData(currency: Currency = 'usd'): Promise<MarketData> {
    const cacheKey = `market-${currency}`
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
      return cached.data
    }

    try {
      const data = await coingecko<CoinGeckoMarketData[]>(ENDPOINTS.marketData, {
        localization  : false,
        tickers       : false,
        market_data   : true,
        community_data: false,
        developer_data: false,
        sparkline     : true,
      })

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid market data response')
      }

      const marketInfo = data[0]
      if (!marketInfo) {
        throw new Error('No market data available')
      }
      
      const marketData = this.transformMarketData(marketInfo, currency)

      // Cache the result
      this.cache.set(cacheKey, {
        data     : marketData,
        timestamp: Date.now(),
      })

      return marketData
    } catch (error) {
      throw new Error(
        `Failed to fetch market data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getPriceChange(currency: Currency = 'usd'): Promise<PriceChangeData> {
    try {
      const data = await coingecko<CoinGeckoSimplePrice>(ENDPOINTS.simplePrice, {
        ids                : 'bitcoin',
        vs_currencies      : currency,
        include_24hr_change: true,
        include_7d_change  : true,
        include_30d_change : true,
        include_1h_change  : true,
      })

      const current = data.bitcoin[currency]
      if (typeof current !== 'number') {
        throw new Error(`Invalid price data for currency: ${currency}`)
      }

      // Get additional change data from extended response
      const extendedData = data.bitcoin as Record<string, number>
      
      return {
        current         : current,
        change1h        : extendedData[`${currency}_1h_change`] || 0,
        change24h       : extendedData[`${currency}_24h_change`] || 0,
        change7d        : extendedData[`${currency}_7d_change`] || 0,
        change30d       : extendedData[`${currency}_30d_change`] || 0,
        changePercent1h : extendedData[`${currency}_1h_vol_change`] || 0,
        changePercent24h: extendedData[`${currency}_24h_vol_change`] || 0,
        changePercent7d : extendedData[`${currency}_7d_vol_change`] || 0,
        changePercent30d: extendedData[`${currency}_30d_vol_change`] || 0,
        currency,
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch price changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // ===========================================================================
  // Historical Price Methods
  // ===========================================================================

  async getHistoricalPrice(
    currency: Currency = 'usd',
    days: number = 7,
  ): Promise<number[]> {
    try {
      const data = await coingecko<{ prices: [number, number][] }>(
        '/coins/bitcoin/market_chart',
        {
          vs_currency: currency,
          days       : days.toString(),
          interval   : days <= 1 ? 'hourly' : 'daily',
        },
      )

      if (!data.prices || !Array.isArray(data.prices)) {
        throw new Error('Invalid historical price data')
      }

      return data.prices.map(([ , price ]) => price)
    } catch (error) {
      throw new Error(
        `Failed to fetch historical prices: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // ===========================================================================
  // Price Comparison Methods
  // ===========================================================================

  calculatePriceChange(current: number, previous: number): {
    absolute  : number
    percentage: number
  } {
    const absolute = current - previous
    const percentage = previous !== 0 ? (absolute / previous) * 100 : 0

    return {
      absolute  : Number(absolute.toFixed(2)),
      percentage: Number(percentage.toFixed(2)),
    }
  }

  getPreviousPrice(currency: Currency): number | undefined {
    return this.previousPrices.get(currency)
  }

  // ===========================================================================
  // Multi-Currency Methods
  // ===========================================================================

  async getMultiCurrencyPrices(currencies: Currency[]): Promise<Record<Currency, number>> {
    try {
      const data = await coingecko<CoinGeckoSimplePrice>(ENDPOINTS.simplePrice, {
        ids          : 'bitcoin',
        vs_currencies: currencies.join(','),
      })

      const prices: Record<string, number> = {}
      for (const currency of currencies) {
        const price = data.bitcoin[currency]
        if (typeof price === 'number') {
          prices[currency] = price
          this.previousPrices.set(currency, price)
        }
      }

      return prices as Record<Currency, number>
    } catch (error) {
      throw new Error(
        `Failed to fetch multi-currency prices: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // ===========================================================================
  // Utility & Service Methods
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      await this.getCurrentPrice('usd')
      return true
    } catch {
      return false
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): {
    size: number
    keys: string[]
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  private transformMarketData(
    raw: CoinGeckoMarketData,
    currency: Currency,
  ): MarketData {
    return {
      price           : raw.current_price,
      currency,
      change24h       : raw.price_change_24h,
      changePercent24h: raw.price_change_percentage_24h,
      change7d        : raw.price_change_percentage_7d,
      change30d       : raw.price_change_percentage_30d,
      marketCap       : raw.market_cap,
      volume24h       : raw.total_volume,
      high24h         : raw.high_24h,
      low24h          : raw.low_24h,
      ath             : raw.ath,
      atl             : raw.atl,
      lastUpdated     : new Date(raw.last_updated),
    }
  }
}

// =============================================================================
// Service Instance & Convenience Functions
// =============================================================================

let priceServiceInstance: PriceService | null = null

export function getPriceService(): PriceService {
  if (!priceServiceInstance) {
    priceServiceInstance = new PriceService()
  }
  return priceServiceInstance
}

// Convenience functions for easy usage
export async function getCurrentBitcoinPrice(currency: Currency = 'usd'): Promise<CommandResult<number>> {
  const startTime = Date.now()
  
  try {
    const service = getPriceService()
    const price = await service.getCurrentPrice(currency)
    
    return {
      success      : true,
      data         : price,
      timestamp    : new Date(),
      executionTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success      : false,
      error        : error as Error,
      timestamp    : new Date(),
      executionTime: Date.now() - startTime,
    }
  }
}

export async function getBitcoinMarketData(currency: Currency = 'usd'): Promise<CommandResult<MarketData>> {
  const startTime = Date.now()
  
  try {
    const service = getPriceService()
    const marketData = await service.getMarketData(currency)
    
    return {
      success      : true,
      data         : marketData,
      timestamp    : new Date(),
      executionTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success      : false,
      error        : error as Error,
      timestamp    : new Date(),
      executionTime: Date.now() - startTime,
    }
  }
} 