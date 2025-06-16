import { coingecko } from '@/services/apiClient'
import type {
  SparklineData,
  Currency,
  TimeFrame,
  BaseService,
  CommandResult,
} from '@/types'

// =============================================================================
// Sparkline Service Configuration
// =============================================================================

const SPARKLINE_CACHE_TTL = 120 * 1000 // 2 minutes
const ENDPOINTS = {
  coinData   : '/coins/bitcoin',
  marketChart: '/coins/bitcoin/market_chart',
} as const

interface SparklineCache {
  data     : SparklineData
  timestamp: number
}

// =============================================================================
// Sparkline Service Implementation
// =============================================================================

export class SparklineService implements BaseService {
  readonly name = 'SparklineService'
  readonly endpoints = [
    ENDPOINTS.coinData,
    ENDPOINTS.marketChart,
  ]

  private cache = new Map<string, SparklineCache>()

  // ===========================================================================
  // Core Sparkline Methods
  // ===========================================================================

  async getSparklineData(
    currency: Currency = 'usd',
    timeframe: TimeFrame = '7d',
    width = 80,
    height = 20,
  ): Promise<SparklineData> {
    const cacheKey = `sparkline-${currency}-${timeframe}-${width}x${height}`
    const cached = this.cache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < SPARKLINE_CACHE_TTL) {
      return cached.data
    }

    try {
      let prices: number[] = []

      if (timeframe === '7d') {
        // Use sparkline from coin data endpoint for 7d
        const data = await coingecko<unknown>(ENDPOINTS.coinData, {
          localization  : false,
          tickers       : false,
          market_data   : true,
          community_data: false,
          developer_data: false,
          sparkline     : true,
        })

        const marketData = data as Record<string, unknown>
        const sparklineData = marketData.market_data as Record<string, unknown>
        const sparkline7d = sparklineData.sparkline_7d as { price: number[] }

        if (sparkline7d?.price && Array.isArray(sparkline7d.price)) {
          prices = sparkline7d.price
        }
      } else {
        // Use market chart endpoint for other timeframes
        const days = this.timeframeToDays(timeframe)
        const data = await coingecko<{ prices: [number, number][] }>(
          ENDPOINTS.marketChart,
          {
            vs_currency: currency,
            days       : days.toString(),
            interval   : days <= 1 ? 'hourly' : 'daily',
          },
        )

                 if (data.prices && Array.isArray(data.prices)) {
           prices = data.prices.map(([ , price ]) => price)
         }
      }

      if (prices.length === 0) {
        throw new Error('No price data available for sparkline')
      }

             const sparklineData: SparklineData = {
         prices,
         timeframe: timeframe === '1y' ? '30d' : timeframe, // Map 1y to 30d for SparklineData
         currency,
         width,
         height,
       }

      // Cache the result
      this.cache.set(cacheKey, {
        data     : sparklineData,
        timestamp: Date.now(),
      })

      return sparklineData
    } catch (error) {
      throw new Error(
        `Failed to fetch sparkline data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async generateAsciiSparkline(
    currency: Currency = 'usd',
    timeframe: TimeFrame = '7d',
    width = 80,
    height = 8,
  ): Promise<string> {
    const sparklineData = await this.getSparklineData(currency, timeframe, width, height)
    return this.renderAsciiSparkline(sparklineData.prices, width, height)
  }

  // ===========================================================================
  // Sparkline Analysis Methods
  // ===========================================================================

  async getSparklineStats(
    currency: Currency = 'usd',
    timeframe: TimeFrame = '7d',
  ): Promise<{
    min       : number
    max       : number
    avg       : number
    trend     : 'up' | 'down' | 'flat'
    volatility: number
    dataPoints: number
  }> {
    const sparklineData = await this.getSparklineData(currency, timeframe)
    const { prices } = sparklineData

    if (prices.length === 0) {
      throw new Error('No price data available for analysis')
    }

    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length

    // Determine trend
    const firstPrice = prices[0] || 0
    const lastPrice = prices[prices.length - 1] || 0
    const changePercent = firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0

    let trend: 'up' | 'down' | 'flat' = 'flat'
    if (changePercent > 1) trend = 'up'
    else if (changePercent < -1) trend = 'down'

    // Calculate volatility (standard deviation)
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length
    const volatility = Math.sqrt(variance)

    return {
      min       : Number(min.toFixed(2)),
      max       : Number(max.toFixed(2)),
      avg       : Number(avg.toFixed(2)),
      trend,
      volatility: Number(volatility.toFixed(2)),
      dataPoints: prices.length,
    }
  }

  // ===========================================================================
  // Sparkline Rendering Methods
  // ===========================================================================

  renderAsciiSparkline(prices: number[], width = 80, height = 8): string {
    if (prices.length === 0) return ''

    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min

    if (range === 0) {
      // All prices are the same
      const midLine = Math.floor(height / 2)
      return Array(height)
        .fill(0)
        .map((_, i) => (i === midLine ? '─'.repeat(width) : ' '.repeat(width)))
        .join('\n')
    }

    // Normalize prices to fit within height
    const normalizedPrices = prices.map(price => 
      Math.floor(((price - min) / range) * (height - 1))
    )

    // Create grid
    const grid: string[][] = Array(height)
      .fill(0)
      .map(() => Array(width).fill(' '))

    // Sample data points to fit width
    const step = prices.length / width
    for (let i = 0; i < width; i++) {
      const priceIndex = Math.floor(i * step)
      if (priceIndex < normalizedPrices.length) {
        const normalizedPrice = normalizedPrices[priceIndex]
        if (normalizedPrice !== undefined) {
          const y = height - 1 - normalizedPrice // Invert Y axis
          if (y >= 0 && y < height && grid[y]) {
            grid[y][i] = this.getSparklineChar(prices, priceIndex)
          }
        }
      }
    }

    return grid.map(row => row.join('')).join('\n')
  }

  // ===========================================================================
  // Utility & Service Methods
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      await this.getSparklineData('usd', '7d')
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

  private timeframeToDays(timeframe: TimeFrame): number {
    switch (timeframe) {
      case '1h':
        return 1 / 24
      case '24h':
        return 1
      case '7d':
        return 7
      case '30d':
        return 30
      case '1y':
        return 365
      default:
        return 7
    }
  }

  private getSparklineChar(prices: number[], index: number): string {
    const current = prices[index]
    const previous = prices[index - 1]

    if (current === undefined || !previous || current === previous) return '●'
    if (current > previous) return '▲'
    return '▼'
  }
}

// =============================================================================
// Service Instance & Convenience Functions
// =============================================================================

let sparklineServiceInstance: SparklineService | null = null

export function getSparklineService(): SparklineService {
  if (!sparklineServiceInstance) {
    sparklineServiceInstance = new SparklineService()
  }
  return sparklineServiceInstance
}

// Convenience functions for easy usage
export async function getBitcoinSparkline(
  currency: Currency = 'usd',
  timeframe: TimeFrame = '7d',
): Promise<CommandResult<SparklineData>> {
  const startTime = Date.now()
  
  try {
    const service = getSparklineService()
    const sparklineData = await service.getSparklineData(currency, timeframe)
    
    return {
      success      : true,
      data         : sparklineData,
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

export async function getBitcoinAsciiSparkline(
  currency: Currency = 'usd',
  timeframe: TimeFrame = '7d',
  width = 80,
  height = 8,
): Promise<CommandResult<string>> {
  const startTime = Date.now()
  
  try {
    const service = getSparklineService()
    const ascii = await service.generateAsciiSparkline(currency, timeframe, width, height)
    
    return {
      success      : true,
      data         : ascii,
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