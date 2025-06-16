import { fetchWithFallback } from '@/services/apiClient'
import type {
  PriceChangeData,
  Currency,
  BaseService,
  CommandResult,
} from '@/types'

// =============================================================================
// Change Service Configuration
// =============================================================================

const CHANGE_CACHE_TTL = 30 * 1000 // 30 seconds

interface ChangeCache {
  data     : PriceChangeData
  timestamp: number
}

// =============================================================================
// Change Service Implementation
// =============================================================================

export class ChangeService implements BaseService {
  readonly name = 'ChangeService'
  readonly endpoints = [ '/coins/bitcoin', '/coins/bitcoin/market_chart' ]

  private cache = new Map<string, ChangeCache>()

  // ===========================================================================
  // Core Change Methods
  // ===========================================================================

  async getPriceChange(currency: Currency = 'usd'): Promise<PriceChangeData> {
    const cacheKey = `change-${currency}`
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CHANGE_CACHE_TTL) {
      return cached.data
    }

    try {
      const data = await fetchWithFallback<{
        market_data: {
          current_price              : { [key: string]: number }
          price_change_24h           : number
          price_change_percentage_24h: number
          price_change_percentage_7d : number
          price_change_percentage_30d: number
        }
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
        throw new Error('Invalid market data response')
      }

      const current = marketData.current_price[currency] || marketData.current_price.usd || 0

      const changeData: PriceChangeData = {
        current         : current,
        change1h        : 0, // Will be calculated if available
        change24h       : marketData.price_change_24h || 0,
        change7d        : this.calculateChange7d(current, marketData.price_change_percentage_7d || 0),
        change30d       : this.calculateChange30d(current, marketData.price_change_percentage_30d || 0),
        changePercent1h : 0, // Will be calculated if available
        changePercent24h: marketData.price_change_percentage_24h || 0,
        changePercent7d : marketData.price_change_percentage_7d || 0,
        changePercent30d: marketData.price_change_percentage_30d || 0,
        currency,
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : changeData,
        timestamp: Date.now(),
      })

      return changeData
    } catch (error) {
      throw new Error(
        `Failed to fetch price changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getPercentageChanges(currency: Currency = 'usd'): Promise<{
    percent1h : number
    percent24h: number
    percent7d : number
    percent30d: number
  }> {
    const changeData = await this.getPriceChange(currency)
    
    return {
      percent1h : changeData.changePercent1h || 0,
      percent24h: changeData.changePercent24h || 0,
      percent7d : changeData.changePercent7d || 0,
      percent30d: changeData.changePercent30d || 0,
    }
  }

  async getAbsoluteChanges(currency: Currency = 'usd'): Promise<{
    change1h : number
    change24h: number
    change7d : number
    change30d: number
  }> {
    const changeData = await this.getPriceChange(currency)
    
    return {
      change1h : changeData.change1h || 0,
      change24h: changeData.change24h || 0,
      change7d : changeData.change7d || 0,
      change30d: changeData.change30d || 0,
    }
  }

  // ===========================================================================
  // Historical Change Analysis
  // ===========================================================================

  async getHistoricalChanges(
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

      const prices = data.prices.map(([ , price ]) => price)
      const changes: number[] = []

      for (let i = 1; i < prices.length; i++) {
        const previousPrice = prices[i - 1] || 0
        const currentPrice = prices[i] || 0
        const change = previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0
        changes.push(Number(change.toFixed(2)))
      }

      return changes
    } catch (error) {
      throw new Error(
        `Failed to fetch historical changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  calculateChangeFromPrices(current: number, previous: number): {
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

  // ===========================================================================
  // Utility & Service Methods
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      await this.getPriceChange('usd')
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

  private calculateChange7d(current: number, percentChange7d: number): number {
    return percentChange7d ? (current * percentChange7d) / (100 + percentChange7d) : 0
  }

  private calculateChange30d(current: number, percentChange30d: number): number {
    return percentChange30d ? (current * percentChange30d) / (100 + percentChange30d) : 0
  }
}

// =============================================================================
// Service Instance & Convenience Functions
// =============================================================================

let changeServiceInstance: ChangeService | null = null

export function getChangeService(): ChangeService {
  if (!changeServiceInstance) {
    changeServiceInstance = new ChangeService()
  }
  return changeServiceInstance
}

// Convenience functions for easy usage
export async function getBitcoinPriceChange(currency: Currency = 'usd'): Promise<CommandResult<PriceChangeData>> {
  const startTime = Date.now()
  
  try {
    const service = getChangeService()
    const changeData = await service.getPriceChange(currency)
    
    return {
      success      : true,
      data         : changeData,
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

