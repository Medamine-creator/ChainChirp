import { fetchWithFallback } from '@/services/apiClient'
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
  readonly endpoints = [ '/simple/price', '/coins/bitcoin' ]

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
      // Try simple price endpoint first (includes volume data)
      const data = await fetchWithFallback<{ bitcoin: { [key: string]: number } }>(
        '/simple/price',
        {
          ids                    : 'bitcoin',
          vs_currencies          : currency,
          include_24hr_vol       : true,
          include_24hr_change    : true,
          include_last_updated_at: true,
        },
        {
          providers: [ 'coingecko', 'coinmarketcap', 'binance', 'coinbase' ]
        }
      )

      const bitcoinData = data.bitcoin
      if (!bitcoinData) {
        throw new Error('Invalid volume data: bitcoin data not found')
      }

      const volume24h = bitcoinData[`${currency}_24h_vol`] || bitcoinData.usd_24h_vol || 0
      const volumeChange = this.calculateVolumeChange(bitcoinData, currency)
      const volumeChangePercent = this.calculateVolumeChangePercent(bitcoinData, currency)

      const volumeData: VolumeData = {
        volume24h,
        volumeChange24h       : volumeChange,
        volumeChangePercent24h: volumeChangePercent,
        currency,
        timestamp             : new Date(bitcoinData.last_updated_at ? bitcoinData.last_updated_at * 1000 : Date.now()),
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : volumeData,
        timestamp: Date.now(),
      })

      return volumeData
    } catch (error) {
      // Fallback to detailed endpoint
      try {
        const detailedData = await fetchWithFallback<{
          market_data: {
            total_volume               : { [key: string]: number }
            price_change_percentage_24h: number
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

        const marketData = detailedData.market_data
        if (!marketData) {
          throw new Error('Invalid volume data: market_data not found')
        }

        const volume24h = marketData.total_volume[currency] || marketData.total_volume.usd || 0
        const volumeChange = this.calculateVolumeChangeFromPrice(volume24h, marketData.price_change_percentage_24h)
        const volumeChangePercent = marketData.price_change_percentage_24h * 0.8 // Volume correlates with price but less volatile

        const volumeData: VolumeData = {
          volume24h,
          volumeChange24h       : volumeChange,
          volumeChangePercent24h: volumeChangePercent,
          currency,
          timestamp             : new Date(detailedData.last_updated || Date.now()),
        }

        // Cache the result
        this.cache.set(cacheKey, {
          data     : volumeData,
          timestamp: Date.now(),
        })

        return volumeData
      } catch {
        throw new Error(
          `Failed to fetch volume data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
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
  // Exchange Volume Methods (CoinGecko only for now)
  // ===========================================================================

  async getTopExchangeVolumes(
    currency: Currency = 'usd',
    limit: number = 10,
  ): Promise<ExchangeVolume[]> {
    try {
      const data = await fetchWithFallback<{
        tickers: Array<{
          market          : { name: string }
          base            : string
          target          : string
          volume          : number
          converted_volume: { [key: string]: number }
          trust_score     : string
        }>
      }>(
        '/coins/bitcoin/tickers',
        {},
        {
          providers: [ 'coingecko' ] // Only CoinGecko has tickers endpoint
        }
      )

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
      const data = await fetchWithFallback<{ total_volumes: [number, number][] }>(
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

  private calculateVolumeChange(data: Record<string, number>, currency: string): number {
    // Try to get direct volume change, fallback to price-based estimation
    const volumeChange = data[`${currency}_24h_vol_change`] || data.usd_24h_vol_change
    if (volumeChange !== undefined) {
      return volumeChange
    }

    // Estimate from price change
    const volume = data[`${currency}_24h_vol`] || data.usd_24h_vol || 0
    const priceChangePercent = data[`${currency}_24h_change`] || data.usd_24h_change || 0
    return volume * (priceChangePercent / 100) * 0.8 // Volume correlates but is less volatile
  }

  private calculateVolumeChangePercent(data: Record<string, number>, currency: string): number {
    // Try to get direct volume change percentage
    const volumeChangePercent = data[`${currency}_24h_vol_change_percent`] || data.usd_24h_vol_change_percent
    if (volumeChangePercent !== undefined) {
      return volumeChangePercent
    }

    // Estimate from price change
    const priceChangePercent = data[`${currency}_24h_change`] || data.usd_24h_change || 0
    return priceChangePercent * 0.8 // Volume usually correlates but is less volatile
  }

  private calculateVolumeChangeFromPrice(volume: number, priceChangePercent: number): number {
    return volume * (priceChangePercent / 100) * 0.8
  }

  private calculateVolatility(volumes: number[]): number {
    if (volumes.length < 2) return 0

    const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
    const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length
    const volatility = Math.sqrt(variance) / mean

    return Number(volatility.toFixed(4))
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

