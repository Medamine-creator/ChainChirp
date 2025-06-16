import { coingecko } from '@/services/apiClient'
import type {
  VolumeData,
  Currency,
  BaseService,
  CommandResult,
} from '@/types'

// =============================================================================
// Volume Service Configuration
// =============================================================================

const VOLUME_CACHE_TTL = 60 * 1000 // 1 minute
const ENDPOINTS = {
  marketData: '/coins/bitcoin',
  exchanges : '/coins/bitcoin/tickers',
} as const

interface VolumeCache {
  data     : VolumeData
  timestamp: number
}

interface ExchangeVolume {
  exchange: string
  volume  : number
  pair    : string
  trust   : boolean
}

// =============================================================================
// Volume Service Implementation
// =============================================================================

export class VolumeService implements BaseService {
  readonly name = 'VolumeService'
  readonly endpoints = [ ENDPOINTS.marketData, ENDPOINTS.exchanges ]

  private cache = new Map<string, VolumeCache>()

  // ===========================================================================
  // Core Volume Methods
  // ===========================================================================

  async getVolumeData(currency: Currency = 'usd'): Promise<VolumeData> {
    const cacheKey = `volume-${currency}`
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < VOLUME_CACHE_TTL) {
      return cached.data
    }

    try {
      const data = await coingecko<unknown>(ENDPOINTS.marketData, {
        localization  : false,
        tickers       : false,
        market_data   : true,
        community_data: false,
        developer_data: false,
        sparkline     : false,
      })

      const marketData = data as Record<string, unknown>

      const volumeData: VolumeData = {
        volume24h             : this.getVolumeForCurrency(marketData.total_volume, currency),
        volumeChange24h       : this.calculateVolumeChange(marketData),
        volumeChangePercent24h: this.calculateVolumeChangePercent(marketData),
        currency,
        timestamp             : new Date((marketData.last_updated as string) || Date.now()),
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : volumeData,
        timestamp: Date.now(),
      })

      return volumeData
    } catch (error) {
      throw new Error(
        `Failed to fetch volume data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async get24HourVolume(currency: Currency = 'usd'): Promise<number> {
    try {
      const volumeData = await this.getVolumeData(currency)
      return volumeData.volume24h
    } catch (error) {
      throw new Error(
        `Failed to fetch 24h volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getVolumeChange(currency: Currency = 'usd'): Promise<{
    absolute  : number
    percentage: number
  }> {
    try {
      const volumeData = await this.getVolumeData(currency)
      return {
        absolute  : volumeData.volumeChange24h,
        percentage: volumeData.volumeChangePercent24h,
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch volume change: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // ===========================================================================
  // Exchange Volume Methods
  // ===========================================================================

  async getTopExchangeVolumes(
    currency: Currency = 'usd',
    limit: number = 10,
  ): Promise<ExchangeVolume[]> {
    try {
      const data = await coingecko<{
        tickers: Array<{
          market          : { name: string }
          base            : string
          target          : string
          volume          : number
          converted_volume: { [key: string]: number }
          trust_score     : string
        }>
      }>(ENDPOINTS.exchanges)

      const volumes: ExchangeVolume[] = data.tickers
        .filter((ticker) => ticker.base === 'BTC')
        .map((ticker) => ({
          exchange: ticker.market.name,
          volume  : ticker.converted_volume[currency] || ticker.volume,
          pair    : `${ticker.base}/${ticker.target}`,
          trust   : ticker.trust_score === 'high',
        }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, limit)

      return volumes
    } catch (error) {
      throw new Error(
        `Failed to fetch exchange volumes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getTotalMarketVolume(currency: Currency = 'usd'): Promise<{
    total      : number
    exchanges  : number
    trustedOnly: number
  }> {
    try {
      const exchanges = await this.getTopExchangeVolumes(currency, 50)
      const total = exchanges.reduce((sum, ex) => sum + ex.volume, 0)
      const trustedOnly = exchanges
        .filter((ex) => ex.trust)
        .reduce((sum, ex) => sum + ex.volume, 0)

      return {
        total,
        exchanges: exchanges.length,
        trustedOnly,
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch total market volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // ===========================================================================
  // Historical Volume Methods
  // ===========================================================================

  async getHistoricalVolume(
    currency: Currency = 'usd',
    days: number = 7,
  ): Promise<number[]> {
    try {
      const data = await coingecko<{ total_volumes: [number, number][] }>(
        '/coins/bitcoin/market_chart',
        {
          vs_currency: currency,
          days       : days.toString(),
          interval   : days <= 1 ? 'hourly' : 'daily',
        },
      )

      if (!data.total_volumes || !Array.isArray(data.total_volumes)) {
        throw new Error('Invalid historical volume data')
      }

      return data.total_volumes.map(([ , volume ]) => volume)
    } catch (error) {
      throw new Error(
        `Failed to fetch historical volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getVolumeMovingAverage(
    currency: Currency = 'usd',
    days: number = 7,
    period: number = 3,
  ): Promise<number[]> {
    try {
      const volumes = await this.getHistoricalVolume(currency, days)
      const movingAverages: number[] = []

      for (let i = period - 1; i < volumes.length; i++) {
        const sum = volumes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
        movingAverages.push(sum / period)
      }

      return movingAverages
    } catch (error) {
      throw new Error(
        `Failed to calculate volume moving average: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // ===========================================================================
  // Volume Analysis Methods
  // ===========================================================================

  analyzeVolumeTrend(volumes: number[]): {
    trend     : 'increasing' | 'decreasing' | 'stable'
    strength  : 'weak' | 'moderate' | 'strong'
    volatility: number
  } {
    if (volumes.length < 2) {
      return { trend: 'stable', strength: 'weak', volatility: 0 }
    }

    const changes = volumes.slice(1).map((vol, i) => vol - (volumes[i] || 0))
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
    const volatility = this.calculateVolatility(volumes)

    let trend: 'increasing' | 'decreasing' | 'stable'
    let strength: 'weak' | 'moderate' | 'strong'

    const firstVolume = volumes[0] || 1

    // Determine trend
    if (Math.abs(avgChange) < firstVolume * 0.05) {
      trend = 'stable'
    } else if (avgChange > 0) {
      trend = 'increasing'
    } else {
      trend = 'decreasing'
    }

    // Determine strength
    const changePercent = Math.abs(avgChange) / firstVolume
    if (changePercent < 0.1) {
      strength = 'weak'
    } else if (changePercent < 0.25) {
      strength = 'moderate'
    } else {
      strength = 'strong'
    }

    return { trend, strength, volatility }
  }

  // ===========================================================================
  // Utility & Service Methods
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      await this.get24HourVolume('usd')
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

  private calculateVolumeChange(data: Record<string, unknown>): number {
    // CoinGecko doesn't provide direct volume change, estimate from price change
    const totalVolumeUsd = this.getVolumeForCurrency(data.total_volume, 'usd')
    const priceChangePercent = (data.price_change_percentage_24h as number) || 0
    const volumeChange = totalVolumeUsd * (priceChangePercent / 100)
    return Number(volumeChange.toFixed(0))
  }

  private calculateVolumeChangePercent(data: Record<string, unknown>): number {
    // Estimate volume change percentage
    const priceChangePercent = (data.price_change_percentage_24h as number) || 0
    const changePercent = priceChangePercent * 0.8 // Volume usually correlates but is less volatile
    return Number(changePercent.toFixed(2))
  }

  private calculateVolatility(volumes: number[]): number {
    if (volumes.length < 2) return 0

    const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
    const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length
    const volatility = Math.sqrt(variance) / mean

    return Number(volatility.toFixed(4))
  }

  private getVolumeForCurrency(data: unknown, currency: string): number {
    if (!data || typeof data !== 'object') return 0
    
    const volumeData = data as Record<string, number>
    return volumeData[currency] || volumeData.usd || 0
  }
}

// =============================================================================
// Service Instance & Convenience Functions
// =============================================================================

let volumeServiceInstance: VolumeService | null = null

export function getVolumeService(): VolumeService {
  if (!volumeServiceInstance) {
    volumeServiceInstance = new VolumeService()
  }
  return volumeServiceInstance
}

// Convenience functions for easy usage
export async function getBitcoinVolume(currency: Currency = 'usd'): Promise<CommandResult<VolumeData>> {
  const startTime = Date.now()

  try {
    const service = getVolumeService()
    const volumeData = await service.getVolumeData(currency)

    return {
      success      : true,
      data         : volumeData,
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

