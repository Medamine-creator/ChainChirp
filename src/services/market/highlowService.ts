import { coingecko } from '@/services/apiClient'
import type {
  HighLowData,
  Currency,
  BaseService,
  CommandResult,
} from '@/types'

// =============================================================================
// High/Low Service Configuration
// =============================================================================

const HIGHLOW_CACHE_TTL = 60 * 1000 // 1 minute
const ENDPOINTS = {
  coinData   : '/coins/bitcoin',
  marketChart: '/coins/bitcoin/market_chart',
} as const

interface HighLowCache {
  data     : HighLowData
  timestamp: number
}

// =============================================================================
// High/Low Service Implementation
// =============================================================================

export class HighLowService implements BaseService {
  readonly name = 'HighLowService'
  readonly endpoints = [
    ENDPOINTS.coinData,
    ENDPOINTS.marketChart,
  ]

  private cache = new Map<string, HighLowCache>()

  // ===========================================================================
  // Core High/Low Methods
  // ===========================================================================

  async getHighLowData(currency: Currency = 'usd'): Promise<HighLowData> {
    const cacheKey = `highlow-${currency}`
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < HIGHLOW_CACHE_TTL) {
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
      const high24h = this.getNumberForCurrency(priceData.high_24h, currency)
      const low24h = this.getNumberForCurrency(priceData.low_24h, currency)
      const ath = this.getNumberForCurrency(priceData.ath, currency)
      const atl = this.getNumberForCurrency(priceData.atl, currency)

      const athDate = new Date(
        (priceData.ath_date as Record<string, string>)?.[currency] || Date.now(),
      )
      const atlDate = new Date(
        (priceData.atl_date as Record<string, string>)?.[currency] || Date.now(),
      )

      const highlowData: HighLowData = {
        current,
        high24h,
        low24h,
        ath,
        atl,
        athDate,
        atlDate,
        currency,
        high24hChangePercent: high24h ? ((current - high24h) / high24h) * 100 : 0,
        low24hChangePercent : low24h ? ((current - low24h) / low24h) * 100 : 0,
        athChangePercent    : ath ? ((current - ath) / ath) * 100 : 0,
        atlChangePercent    : atl ? ((current - atl) / atl) * 100 : 0,
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : highlowData,
        timestamp: Date.now(),
      })

      return highlowData
    } catch (error) {
      throw new Error(
        `Failed to fetch high/low data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async get24HourHighLow(currency: Currency = 'usd'): Promise<{
    high24h: number
    low24h : number
    current: number
  }> {
    const highlowData = await this.getHighLowData(currency)
    
    return {
      high24h: highlowData.high24h,
      low24h : highlowData.low24h,
      current: highlowData.current,
    }
  }

  async getAllTimeHighLow(currency: Currency = 'usd'): Promise<{
    ath    : number
    atl    : number
    athDate: Date
    atlDate: Date
  }> {
    const highlowData = await this.getHighLowData(currency)
    
    return {
      ath    : highlowData.ath,
      atl    : highlowData.atl,
      athDate: highlowData.athDate,
      atlDate: highlowData.atlDate,
    }
  }

  // ===========================================================================
  // Historical High/Low Analysis
  // ===========================================================================

  async getHistoricalHighLow(
    currency: Currency = 'usd',
    days: number = 7,
  ): Promise<{
    periodHigh: number
    periodLow : number
    highDate  : Date
    lowDate   : Date
  }> {
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

      let periodHigh = 0
      let periodLow = Number.MAX_VALUE
      let highDate = new Date()
      let lowDate = new Date()

      for (const [ timestamp, price ] of data.prices) {
        if (price > periodHigh) {
          periodHigh = price
          highDate = new Date(timestamp)
        }
        if (price < periodLow) {
          periodLow = price
          lowDate = new Date(timestamp)
        }
      }

      return {
        periodHigh,
        periodLow,
        highDate,
        lowDate,
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch historical high/low: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  calculateDistanceFromHighLow(current: number, high: number, low: number): {
    distanceFromHigh: number
    distanceFromLow : number
    percentFromHigh : number
    percentFromLow  : number
    positionInRange : number // 0-1, where 0 is at low, 1 is at high
  } {
    const distanceFromHigh = high - current
    const distanceFromLow = current - low
    const range = high - low

    const percentFromHigh = high !== 0 ? (distanceFromHigh / high) * 100 : 0
    const percentFromLow = low !== 0 ? (distanceFromLow / low) * 100 : 0
    const positionInRange = range !== 0 ? (current - low) / range : 0

    return {
      distanceFromHigh: Number(distanceFromHigh.toFixed(2)),
      distanceFromLow : Number(distanceFromLow.toFixed(2)),
      percentFromHigh : Number(percentFromHigh.toFixed(2)),
      percentFromLow  : Number(percentFromLow.toFixed(2)),
      positionInRange : Number(positionInRange.toFixed(4)),
    }
  }

  // ===========================================================================
  // Utility & Service Methods
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      await this.getHighLowData('usd')
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

  private getNumberForCurrency(data: unknown, currency: string): number {
    if (!data || typeof data !== 'object') return 0
    
    const currencyData = data as Record<string, number>
    return currencyData[currency] || currencyData.usd || 0
  }
}

// =============================================================================
// Service Instance & Convenience Functions
// =============================================================================

let highlowServiceInstance: HighLowService | null = null

export function getHighLowService(): HighLowService {
  if (!highlowServiceInstance) {
    highlowServiceInstance = new HighLowService()
  }
  return highlowServiceInstance
}

// Convenience functions for easy usage
export async function getBitcoinHighLow(currency: Currency = 'usd'): Promise<CommandResult<HighLowData>> {
  const startTime = Date.now()
  
  try {
    const service = getHighLowService()
    const highlowData = await service.getHighLowData(currency)
    
    return {
      success      : true,
      data         : highlowData,
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

