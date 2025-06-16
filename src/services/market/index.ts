// =============================================================================
// Market Services Index
// =============================================================================

import type { Currency, BaseService } from '@/types'

// Import all services and their functions
import {
  PriceService,
  getPriceService,
  getCurrentBitcoinPrice,
  getBitcoinMarketData,
} from './priceService'

import {
  VolumeService,
  getVolumeService,
  getBitcoinVolume,
} from './volumeService'

import {
  ChangeService,
  getChangeService,
  getBitcoinPriceChange,
} from './changeService'

import {
  HighLowService,
  getHighLowService,
  getBitcoinHighLow,
} from './highlowService'

import {
  SparklineService,
  getSparklineService,
  getBitcoinSparkline,
} from './sparklineService'

// =============================================================================
// Re-export all services and functions
// =============================================================================

export {
  // Price Service
  PriceService,
  getPriceService,
  getCurrentBitcoinPrice,
  getBitcoinMarketData,
  
  // Volume Service
  VolumeService,
  getVolumeService,
  getBitcoinVolume,
  
  // Change Service
  ChangeService,
  getChangeService,
  getBitcoinPriceChange,
  
  // High/Low Service
  HighLowService,
  getHighLowService,
  getBitcoinHighLow,
  
  // Sparkline Service
  SparklineService,
  getSparklineService,
  getBitcoinSparkline,
}

// =============================================================================
// Unified Market Service Class
// =============================================================================

export class MarketService implements BaseService {
  readonly name = 'MarketService'
  readonly endpoints: string[] = []

  private priceService = getPriceService()
  private volumeService = getVolumeService()
  private changeService = getChangeService()
  private highlowService = getHighLowService()
  private sparklineService = getSparklineService()

  constructor() {
    // Combine all endpoints from sub-services
    this.endpoints = [
      ...this.priceService.endpoints,
      ...this.volumeService.endpoints,
      ...this.changeService.endpoints,
      ...this.highlowService.endpoints,
      ...this.sparklineService.endpoints,
    ]
  }

  // ===========================================================================
  // Unified Market Methods
  // ===========================================================================

  async getCompleteMarketData(currency: Currency = 'usd') {
    const [ marketData, volumeData, changeData, highlowData, sparklineData ] = await Promise.all([
      this.priceService.getMarketData(currency),
      this.volumeService.getVolumeData(currency),
      this.changeService.getPriceChange(currency),
      this.highlowService.getHighLowData(currency),
      this.sparklineService.getSparklineData(currency, '7d'),
    ])

    return {
      price    : marketData,
      volume   : volumeData,
      changes  : changeData,
      highLow  : highlowData,
      sparkline: sparklineData,
      timestamp: new Date(),
    }
  }

  async getMarketOverview(currency: Currency = 'usd') {
    const [ currentPrice, volume24h, changeData, highlowData ] = await Promise.all([
      this.priceService.getCurrentPrice(currency),
      this.volumeService.get24HourVolume(currency),
      this.changeService.getPriceChange(currency),
      this.highlowService.getHighLowData(currency),
    ])

    return {
      currentPrice,
      volume24h,
      change24h       : changeData.change24h,
      changePercent24h: changeData.changePercent24h,
      high24h         : highlowData.high24h,
      low24h          : highlowData.low24h,
      ath             : highlowData.ath,
      atl             : highlowData.atl,
      currency,
    }
  }

  // ===========================================================================
  // Individual Service Access
  // ===========================================================================

  getPriceService() {
    return this.priceService
  }

  getVolumeService() {
    return this.volumeService
  }

  getChangeService() {
    return this.changeService
  }

  getHighLowService() {
    return this.highlowService
  }

  getSparklineService() {
    return this.sparklineService
  }

  // ===========================================================================
  // Health Check & Utilities
  // ===========================================================================

  async healthcheck(): Promise<boolean> {
    try {
      const [ priceHealth, volumeHealth, changeHealth, highlowHealth, sparklineHealth ] = await Promise.all([
        this.priceService.healthcheck(),
        this.volumeService.healthcheck(),
        this.changeService.healthcheck(),
        this.highlowService.healthcheck(),
        this.sparklineService.healthcheck(),
      ])

      return priceHealth && volumeHealth && changeHealth && highlowHealth && sparklineHealth
    } catch {
      return false
    }
  }

  clearAllCaches(): void {
    this.priceService.clearCache()
    this.volumeService.clearCache()
    this.changeService.clearCache()
    this.highlowService.clearCache()
    this.sparklineService.clearCache()
  }

  getAllCacheStats() {
    return {
      price    : this.priceService.getCacheStats(),
      volume   : this.volumeService.getCacheStats(),
      changes  : this.changeService.getCacheStats(),
      highlow  : this.highlowService.getCacheStats(),
      sparkline: this.sparklineService.getCacheStats(),
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let marketServiceInstance: MarketService | null = null

export function getMarketService(): MarketService {
  if (!marketServiceInstance) {
    marketServiceInstance = new MarketService()
  }
  return marketServiceInstance
}

// =============================================================================
// Convenience Functions
// =============================================================================

export async function getCompleteBitcoinData(currency: Currency = 'usd') {
  const service = getMarketService()
  return service.getCompleteMarketData(currency)
}

export async function getBitcoinOverview(currency: Currency = 'usd') {
  const service = getMarketService()
  return service.getMarketOverview(currency)
} 