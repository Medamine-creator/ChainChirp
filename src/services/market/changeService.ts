import { coingecko } from '@/services/apiClient'
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
const ENDPOINTS = {
  simplePrice: '/simple/price',
  marketChart: '/coins/bitcoin/market_chart',
  coinData   : '/coins/bitcoin',
} as const

interface ChangeCache {
  data     : PriceChangeData
  timestamp: number
}

// =============================================================================
// Change Service Implementation
// =============================================================================

export class ChangeService implements BaseService {
  readonly name = 'ChangeService'
  readonly endpoints = [
    ENDPOINTS.simplePrice,
    ENDPOINTS.marketChart,
    ENDPOINTS.coinData,
  ]

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
      const data = await coingecko<unknown>(ENDPOINTS.coinData, {
        localization  : false,
        tickers       : false,
        market_data   : true,
        community_data: false,
        developer_data: false,
        sparkline     : false,
      })

      const marketData = data as Record<string, unknown>
      const priceData = marketData.market_data as Record<string, unknown>

      const current = this.getNumberForCurrency(priceData.current_price, currency)
      
      const changeData: PriceChangeData = {
        current         : current,
        change1h        : (priceData.price_change_1h as number) || 0,
        change24h       : (priceData.price_change_24h as number) || 0,
        change7d        : this.calculateChange7d(priceData),
        change30d       : this.calculateChange30d(priceData),
        changePercent1h : (priceData.price_change_percentage_1h as number) || 0,
        changePercent24h: (priceData.price_change_percentage_24h as number) || 0,
        changePercent7d : (priceData.price_change_percentage_7d as number) || 0,
        changePercent30d: (priceData.price_change_percentage_30d as number) || 0,
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
      const data = await coingecko<{ prices: [number, number][] }>(
        ENDPOINTS.marketChart,
        {
          vs_currency: currency,
          days       : days.toString(),
          interval   : days <= 1 ? 'hourly' : 'daily',
        },
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

  private calculateChange7d(priceData: Record<string, unknown>): number {
    return (priceData.price_change_7d as number) || 0
  }

  private calculateChange30d(priceData: Record<string, unknown>): number {
    return (priceData.price_change_30d as number) || 0
  }

  private getNumberForCurrency(data: unknown, currency: string): number {
    if (!data || typeof data !== 'object') return 0
    
    const currencyData = data as Record<string, number>
    return currencyData[currency] || currencyData.usd || 0
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

