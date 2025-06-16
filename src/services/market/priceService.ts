import { fetchWithFallback } from '@/services/apiClient'
import type {
  MarketData,
  Currency,
  BaseService,
  CommandResult,
} from '@/types'

// Simple price data interface
interface PriceData {
  price    : number
  currency : Currency
  timestamp: Date
}

// =============================================================================
// Price Service Configuration
// =============================================================================

const PRICE_CACHE_TTL = 30 * 1000 // 30 seconds

interface PriceCache {
  data     : PriceData
  timestamp: number
}

// =============================================================================
// Price Service Implementation
// =============================================================================

export class PriceService implements BaseService {
  readonly name = 'PriceService'
  readonly endpoints = [ '/simple/price', '/coins/bitcoin' ]

  private cache = new Map<string, PriceCache>()

  // ===========================================================================
  // Core Price Methods
  // ===========================================================================

  async getCurrentPrice(currency: Currency = 'usd'): Promise<PriceData> {
    const cacheKey = `price-${currency}`
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
      return cached.data
    }

    try {
      // Try simple price endpoint first (faster)
      const data = await fetchWithFallback<{ bitcoin: { [key: string]: number } }>(
        '/simple/price',
        {
          ids                    : 'bitcoin',
          vs_currencies          : currency,
          include_market_cap     : true,
          include_24hr_vol       : true,
          include_24hr_change    : true,
          include_last_updated_at: true,
        },
        {
          providers: [ 'coingecko', 'binance', 'coinbase', 'kraken' ]
        }
      )

      const bitcoinData = data.bitcoin
      if (!bitcoinData) {
        throw new Error('Invalid price data: bitcoin data not found')
      }

      const priceData: PriceData = {
        price    : bitcoinData[currency] || bitcoinData.usd,
        currency,
        timestamp: new Date(bitcoinData.last_updated_at ? bitcoinData.last_updated_at * 1000 : Date.now()),
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : priceData,
        timestamp: Date.now(),
      })

      return priceData
    } catch (error) {
      // Fallback to detailed endpoint if simple price fails
      try {
        const detailedData = await this.getDetailedPrice(currency)
        return {
          price    : detailedData.price,
          currency : detailedData.currency,
          timestamp: detailedData.timestamp,
        }
      } catch (fallbackError) {
        throw new Error(
          `Failed to fetch current price: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }
  }

  async getDetailedPrice(currency: Currency = 'usd'): Promise<PriceData & {
    marketCap         : number
    volume24h         : number
    change24h         : number
    changePercent24h  : number
    high24h?          : number
    low24h?           : number
    ath?              : number
    athDate?          : Date
    atl?              : number
    atlDate?          : Date
    athChangePercent? : number
    atlChangePercent? : number
    circulatingSupply?: number
    totalSupply?      : number
    maxSupply?        : number
  }> {
    const cacheKey = `detailed-${currency}`
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
      return cached.data as PriceData & {
        marketCap         : number
        volume24h         : number
        change24h         : number
        changePercent24h  : number
        high24h?          : number
        low24h?           : number
        ath?              : number
        athDate?          : Date
        atl?              : number
        atlDate?          : Date
        athChangePercent? : number
        atlChangePercent? : number
        circulatingSupply?: number
        totalSupply?      : number
        maxSupply?        : number
      }
    }

    try {
      const data = await fetchWithFallback<{
        market_data: {
          current_price              : { [key: string]: number }
          market_cap                 : { [key: string]: number }
          total_volume               : { [key: string]: number }
          price_change_24h           : number
          price_change_percentage_24h: number
          high_24h                   : { [key: string]: number }
          low_24h                    : { [key: string]: number }
          ath                        : { [key: string]: number }
          ath_date                   : { [key: string]: string }
          atl                        : { [key: string]: number }
          atl_date                   : { [key: string]: string }
          ath_change_percentage      : { [key: string]: number }
          atl_change_percentage      : { [key: string]: number }
          circulating_supply         : number
          total_supply               : number
          max_supply                 : number
        }
        last_updated: string
      }>(
        '/coins/bitcoin',
        {
          localization  : false,
          tickers       : false,
          market_data   : true,
          community_data: false,
          developer_data: false,
          sparkline     : false,
        },
        {
          providers: [ 'coingecko', 'coinmarketcap' ]
        }
      )

      const marketData = data.market_data
      if (!marketData) {
        throw new Error('Invalid detailed price data: market_data not found')
      }

      const priceData: PriceData & {
        marketCap         : number
        volume24h         : number
        change24h         : number
        changePercent24h  : number
        high24h?          : number
        low24h?           : number
        ath?              : number
        athDate?          : Date
        atl?              : number
        atlDate?          : Date
        athChangePercent? : number
        atlChangePercent? : number
        circulatingSupply?: number
        totalSupply?      : number
        maxSupply?        : number
      } = {
        price            : marketData.current_price[currency] || marketData.current_price.usd,
        currency,
        timestamp        : new Date(data.last_updated || Date.now()),
        marketCap        : marketData.market_cap[currency] || marketData.market_cap.usd,
        volume24h        : marketData.total_volume[currency] || marketData.total_volume.usd,
        change24h        : marketData.price_change_24h,
        changePercent24h : marketData.price_change_percentage_24h,
        high24h          : marketData.high_24h[currency] || marketData.high_24h.usd,
        low24h           : marketData.low_24h[currency] || marketData.low_24h.usd,
        ath              : marketData.ath[currency] || marketData.ath.usd,
        athDate          : new Date(marketData.ath_date[currency] || marketData.ath_date.usd),
        atl              : marketData.atl[currency] || marketData.atl.usd,
        atlDate          : new Date(marketData.atl_date[currency] || marketData.atl_date.usd),
        athChangePercent : marketData.ath_change_percentage[currency] || marketData.ath_change_percentage.usd,
        atlChangePercent : marketData.atl_change_percentage[currency] || marketData.atl_change_percentage.usd,
        circulatingSupply: marketData.circulating_supply,
        totalSupply      : marketData.total_supply,
        maxSupply        : marketData.max_supply,
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : priceData,
        timestamp: Date.now(),
      })

      return priceData
    } catch (error) {
      throw new Error(
        `Failed to fetch detailed price data: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const data = await fetchWithFallback<{ prices: [number, number][] }>(
        '/coins/bitcoin/market_chart',
        {
          vs_currency: currency,
          days       : days.toString(),
          interval   : days <= 1 ? 'hourly' : 'daily',
        },
        {
          providers: [ 'coingecko', 'binance' ]
        }
      )

      if (!data.prices || !Array.isArray(data.prices)) {
        throw new Error('Invalid historical price data')
      }

      return data.prices.map(([ , price ]) => price)
    } catch (error) {
      throw new Error(
        `Failed to fetch historical price: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
export async function getBitcoinPrice(currency: Currency = 'usd'): Promise<CommandResult<PriceData>> {
  const startTime = Date.now()

  try {
    const service = getPriceService()
    const priceData = await service.getCurrentPrice(currency)

    return {
      success      : true,
      data         : priceData,
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

export async function getBitcoinDetailedPrice(currency: Currency = 'usd'): Promise<CommandResult<PriceData>> {
  const startTime = Date.now()

  try {
    const service = getPriceService()
    const priceData = await service.getDetailedPrice(currency)

    return {
      success      : true,
      data         : priceData,
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