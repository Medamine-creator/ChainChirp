import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { OutputFormat } from '@/types/enums'
import type {
  ApiResponse,
  ApiError,
  LogLevel,
  ChainChirpConfig,
} from '@/types'

// =============================================================================
// Internal Types for Strict Typing
// =============================================================================

interface AxiosErrorResponse {
  data   : unknown
  status : number
  headers: Record<string, string>
}

interface AxiosErrorConfig {
  url?         : string
  method?      : string
  __retryCount?: number
  [key: string]: unknown
}

interface AxiosError {
  message?     : string
  code?        : string
  config?      : AxiosErrorConfig
  response?    : AxiosErrorResponse
  [key: string]: unknown
}

type RequestData =
  | Record<string, unknown>
  | FormData
  | string
  | ArrayBuffer
  | null
  | undefined;

type QueryParams = Record<
  string,
  string | number | boolean | string[] | number[] | boolean[] | null | undefined
>;

// =============================================================================
// Multi-API Provider Types
// =============================================================================

interface ApiProvider {
  name              : string
  baseUrl           : string
  rateLimitPerMinute: number
  requiresAuth      : boolean
  priority          : number
  healthEndpoint?   : string
  headers?          : Record<string, string>
}

interface FallbackOptions {
  maxRetries    : number
  providers     : string[]
  skipProviders?: string[]
}

// =============================================================================
// Configuration Constants
// =============================================================================

export const API_PROVIDERS: Record<string, ApiProvider> = {
  coingecko: {
    name              : 'CoinGecko',
    baseUrl           : 'https://api.coingecko.com/api/v3',
    rateLimitPerMinute: 30, // Free tier limit
    requiresAuth      : false,
    priority          : 1,
    healthEndpoint    : '/ping'
  },
  coinmarketcap: {
    name              : 'CoinMarketCap',
    baseUrl           : 'https://pro-api.coinmarketcap.com/v1',
    rateLimitPerMinute: 333, // Free tier: 10k/month
    requiresAuth      : false,
    priority          : 2,
    healthEndpoint    : '/cryptocurrency/listings/latest',
    headers           : {
      'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY || 'DEMO_KEY'
    }
  },
  coinapi: {
    name              : 'CoinAPI',
    baseUrl           : 'https://rest.coinapi.io/v1',
    rateLimitPerMinute: 100, // Free tier: 100 req/day
    requiresAuth      : false,
    priority          : 3,
    healthEndpoint    : '/exchangerate/BTC/USD',
    headers           : {
      'X-CoinAPI-Key': process.env.COINAPI_KEY || 'DEMO_KEY'
    }
  },
  binance: {
    name              : 'Binance',
    baseUrl           : 'https://api.binance.com/api/v3',
    rateLimitPerMinute: 1200, // High limit for public endpoints
    requiresAuth      : false,
    priority          : 4,
    healthEndpoint    : '/ping'
  },
  coinbase: {
    name              : 'Coinbase',
    baseUrl           : 'https://api.coinbase.com/v2',
    rateLimitPerMinute: 10000, // Very high for public data
    requiresAuth      : false,
    priority          : 5,
    healthEndpoint    : '/exchange-rates'
  },
  kraken: {
    name              : 'Kraken',
    baseUrl           : 'https://api.kraken.com/0/public',
    rateLimitPerMinute: 60,
    requiresAuth      : false,
    priority          : 6,
    healthEndpoint    : '/SystemStatus'
  }
}

export const DEFAULT_CONFIG: ChainChirpConfig = {
  defaultCurrency    : 'usd',
  defaultOutputFormat: OutputFormat.DEFAULT,
  apiTimeout         : 10000,
  debugMode          : false,
  watchDefaults      : {
    enabled    : false,
    interval   : 30,
    clearScreen: true,
  },
  apiEndpoints: {
    coingecko : 'https://api.coingecko.com/api/v3',
    mempool   : 'https://mempool.space/api',
    blockchain: 'https://blockchain.info',
    lightning : 'https://1ml.com/api',
    fearGreed : 'https://api.alternative.me',
  },
  rateLimit: {
    requestsPerMinute: 60,
    burstLimit       : 10,
  },
}

// =============================================================================
// Rate Limiting
// =============================================================================

class RateLimiter {
  private requests            : number[] = []
  private readonly windowMs   : number
  private readonly maxRequests: number

  constructor(requestsPerMinute: number) {
    this.maxRequests = requestsPerMinute
    this.windowMs = 60 * 1000 // 1 minute in milliseconds
  }

  async checkLimit(): Promise<void> {
    const now = Date.now()

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.windowMs - (now - oldestRequest)

      this.log('warn', `Rate limit reached, waiting ${waitTime}ms`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      return this.checkLimit()
    }

    this.requests.push(now)
  }

  private log(level: LogLevel, message: string): void {
    if (process.env.DEBUG === '1') {
      console.log(`[${level.toUpperCase()}] RateLimiter: ${message}`)
    }
  }
}

// =============================================================================
// Multi-API Fallback System
// =============================================================================

export class MultiFallbackClient {
  private clients = new Map<string, AxiosInstance>()
  private rateLimiters = new Map<string, RateLimiter>()
  private readonly config: ChainChirpConfig
  private providerHealth = new Map<string, boolean>()

  constructor(config: Partial<ChainChirpConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeProviders()
  }

  private initializeProviders(): void {
    Object.entries(API_PROVIDERS).forEach(([ key, provider ]) => {
      const client = axios.create({
        baseURL: provider.baseUrl,
        timeout: this.config.apiTimeout,
        headers: {
          'User-Agent'  : 'ChainChirp-CLI/1.0.0',
          Accept        : 'application/json',
          'Content-Type': 'application/json',
          ...provider.headers,
        },
      })

      this.clients.set(key, client)
      this.rateLimiters.set(key, new RateLimiter(provider.rateLimitPerMinute))
      this.providerHealth.set(key, true) // Assume healthy initially
    })
  }

  async fetchWithFallback<T>(
    endpoint: string,
    params?: QueryParams,
    options: Partial<FallbackOptions> = {}
  ): Promise<T> {
    const fallbackOptions: FallbackOptions = {
      maxRetries: 3,
      providers : [ 'coingecko', 'coinmarketcap', 'coinapi', 'binance', 'coinbase', 'kraken' ],
      ...options
    }

    const availableProviders = fallbackOptions.providers
      .filter(provider => !fallbackOptions.skipProviders?.includes(provider))
      .filter(provider => this.clients.has(provider))
      .sort((a, b) => API_PROVIDERS[a]?.priority - API_PROVIDERS[b]?.priority)

    let lastError: Error | null = null

    for (const providerKey of availableProviders) {
      try {
        this.log('debug', `Trying provider: ${API_PROVIDERS[providerKey]?.name}`)
        
        const rateLimiter = this.rateLimiters.get(providerKey)
        if (rateLimiter) {
          await rateLimiter.checkLimit()
        }

        const result = await this.makeRequest<T>(providerKey, endpoint, params)
        
        // Mark provider as healthy if request succeeds
        this.providerHealth.set(providerKey, true)
        
        this.log('info', `✓ Success with ${API_PROVIDERS[providerKey]?.name}`)
        return result
        
      } catch (error) {
        lastError = error as Error
        const provider = API_PROVIDERS[providerKey]
        
        this.log('warn', `✗ ${provider?.name} failed: ${lastError.message}`)
        
        // Mark provider as potentially unhealthy for certain errors
        if (this.isProviderError(error)) {
          this.providerHealth.set(providerKey, false)
        }
        
        // Continue to next provider
        continue
      }
    }

    // All providers failed
    throw new Error(
      `All API providers failed. Last error: ${lastError?.message || 'Unknown error'}`
    )
  }

  private async makeRequest<T>(
    providerKey: string,
    endpoint: string,
    params?: QueryParams
  ): Promise<T> {
    const client = this.clients.get(providerKey)
    const provider = API_PROVIDERS[providerKey]
    
    if (!client || !provider) {
      throw new Error(`Provider ${providerKey} not found`)
    }

    // Transform endpoint and params for different providers
    const { transformedEndpoint, transformedParams } = this.transformRequest(
      providerKey,
      endpoint,
      params
    )

    const response = await client.get<T>(transformedEndpoint, {
      params: transformedParams
    })

    // Transform response to common format
    return this.transformResponse<T>(providerKey, response.data, endpoint)
  }

  private transformRequest(
    providerKey: string,
    endpoint: string,
    params?: QueryParams
  ): { transformedEndpoint: string; transformedParams?: QueryParams } {
    switch (providerKey) {
      case 'coingecko':
        return { transformedEndpoint: endpoint, transformedParams: params }
        
      case 'coinmarketcap':
        return this.transformCoinMarketCapRequest(endpoint, params)
        
      case 'coinapi':
        return this.transformCoinAPIRequest(endpoint, params)
        
      case 'binance':
        return this.transformBinanceRequest(endpoint, params)
        
      case 'coinbase':
        return this.transformCoinbaseRequest(endpoint, params)
        
      case 'kraken':
        return this.transformKrakenRequest(endpoint, params)
        
      default:
        return { transformedEndpoint: endpoint, transformedParams: params }
    }
  }

  private transformCoinMarketCapRequest(
    endpoint: string,
    params?: QueryParams
  ): { transformedEndpoint: string; transformedParams?: QueryParams } {
    // Transform CoinGecko endpoints to CoinMarketCap equivalents
    if (endpoint === '/coins/bitcoin') {
      return {
        transformedEndpoint: '/cryptocurrency/quotes/latest',
        transformedParams  : { symbol: 'BTC', ...params }
      }
    }
    
    if (endpoint === '/simple/price') {
      return {
        transformedEndpoint: '/cryptocurrency/quotes/latest',
        transformedParams  : { symbol: 'BTC', ...params }
      }
    }

    return { transformedEndpoint: endpoint, transformedParams: params }
  }

  private transformCoinAPIRequest(
    endpoint: string,
    params?: QueryParams
  ): { transformedEndpoint: string; transformedParams?: QueryParams } {
    if (endpoint === '/coins/bitcoin') {
      return {
        transformedEndpoint: '/assets/BTC',
        transformedParams  : params
      }
    }
    
    if (endpoint === '/simple/price') {
      return {
        transformedEndpoint: '/exchangerate/BTC/USD',
        transformedParams  : params
      }
    }

    return { transformedEndpoint: endpoint, transformedParams: params }
  }

  private transformBinanceRequest(
    endpoint: string,
    params?: QueryParams
  ): { transformedEndpoint: string; transformedParams?: QueryParams } {
    if (endpoint === '/coins/bitcoin' || endpoint === '/simple/price') {
      return {
        transformedEndpoint: '/ticker/price',
        transformedParams  : { symbol: 'BTCUSDT', ...params }
      }
    }

    if (endpoint === '/coins/bitcoin/market_chart') {
      return {
        transformedEndpoint: '/klines',
        transformedParams  : { 
          symbol  : 'BTCUSDT', 
          interval: '1d',
          limit   : params?.days || 7,
          ...params 
        }
      }
    }

    return { transformedEndpoint: endpoint, transformedParams: params }
  }

  private transformCoinbaseRequest(
    endpoint: string,
    params?: QueryParams
  ): { transformedEndpoint: string; transformedParams?: QueryParams } {
    if (endpoint === '/coins/bitcoin' || endpoint === '/simple/price') {
      return {
        transformedEndpoint: '/exchange-rates',
        transformedParams  : { currency: 'BTC', ...params }
      }
    }

    return { transformedEndpoint: endpoint, transformedParams: params }
  }

  private transformKrakenRequest(
    endpoint: string,
    params?: QueryParams
  ): { transformedEndpoint: string; transformedParams?: QueryParams } {
    if (endpoint === '/coins/bitcoin' || endpoint === '/simple/price') {
      return {
        transformedEndpoint: '/Ticker',
        transformedParams  : { pair: 'XBTUSD', ...params }
      }
    }

    return { transformedEndpoint: endpoint, transformedParams: params }
  }

  private transformResponse<T>(
    providerKey: string,
    data: unknown,
    originalEndpoint: string
  ): T {
    switch (providerKey) {
      case 'coingecko':
        return data as T
        
      case 'coinmarketcap':
        return this.transformCoinMarketCapResponse(data, originalEndpoint) as T
        
      case 'coinapi':
        return this.transformCoinAPIResponse(data, originalEndpoint) as T
        
      case 'binance':
        return this.transformBinanceResponse(data, originalEndpoint) as T
        
      case 'coinbase':
        return this.transformCoinbaseResponse(data, originalEndpoint) as T
        
      case 'kraken':
        return this.transformKrakenResponse(data, originalEndpoint) as T
        
      default:
        return data as T
    }
  }

  private transformCoinMarketCapResponse(data: unknown, endpoint: string): unknown {
    if (endpoint === '/coins/bitcoin' || endpoint === '/simple/price') {
      const cmcData = data as { data: { BTC: { quote: { USD: { price: number; market_cap: number; volume_24h: number; percent_change_24h: number } } } } }
      const btcData = cmcData.data?.BTC?.quote?.USD
      
      if (btcData) {
        return {
          bitcoin: {
            usd           : btcData.price,
            usd_market_cap: btcData.market_cap,
            usd_24h_vol   : btcData.volume_24h,
            usd_24h_change: btcData.percent_change_24h
          }
        }
      }
    }
    
    return data
  }

  private transformCoinAPIResponse(data: unknown, endpoint: string): unknown {
    if (endpoint === '/simple/price') {
      const coinApiData = data as { rate: number }
      return {
        bitcoin: {
          usd: coinApiData.rate
        }
      }
    }
    
    return data
  }

  private transformBinanceResponse(data: unknown, endpoint: string): unknown {
    if (endpoint === '/coins/bitcoin' || endpoint === '/simple/price') {
      const binanceData = data as { price: string }
      return {
        bitcoin: {
          usd: parseFloat(binanceData.price)
        }
      }
    }
    
    return data
  }

  private transformCoinbaseResponse(data: unknown, endpoint: string): unknown {
    if (endpoint === '/coins/bitcoin' || endpoint === '/simple/price') {
      const coinbaseData = data as { data: { rates: { USD: string } } }
      const usdRate = coinbaseData.data?.rates?.USD
      
      if (usdRate) {
        return {
          bitcoin: {
            usd: parseFloat(usdRate)
          }
        }
      }
    }
    
    return data
  }

  private transformKrakenResponse(data: unknown, endpoint: string): unknown {
    if (endpoint === '/coins/bitcoin' || endpoint === '/simple/price') {
      const krakenData = data as { result: { XXBTZUSD: { c: [string] } } }
      const price = krakenData.result?.XXBTZUSD?.c?.[0]
      
      if (price) {
        return {
          bitcoin: {
            usd: parseFloat(price)
          }
        }
      }
    }
    
    return data
  }

  private isProviderError(error: unknown): boolean {
    const err = error as AxiosError
    const status = err.response?.status
    
    // Don't mark provider as unhealthy for rate limiting or auth issues
    return !![ 401, 403, 404, 500, 502, 503, 504 ].includes(status || 0)
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    
    for (const [ key, provider ] of Object.entries(API_PROVIDERS)) {
      try {
        const client = this.clients.get(key)
        if (client && provider.healthEndpoint) {
          await client.get(provider.healthEndpoint, { timeout: 5000 })
          results[key] = true
          this.providerHealth.set(key, true)
        } else {
          results[key] = this.providerHealth.get(key) || false
        }
      } catch (error) {
        results[key] = false
        this.providerHealth.set(key, false)
        this.log('warn', `Health check failed for ${provider.name}: ${error}`)
      }
    }
    
    return results
  }

  getProviderHealth(): Record<string, boolean> {
    const health: Record<string, boolean> = {}
    this.providerHealth.forEach((isHealthy, provider) => {
      health[provider] = isHealthy
    })
    return health
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (this.config.debugMode || process.env.DEBUG === '1') {
      const timestamp = new Date().toISOString()
      console.log(
        `[${timestamp}] [${level.toUpperCase()}] MultiFallback: ${message}`,
      )
      if (data !== undefined) {
        console.log(JSON.stringify(data, null, 2))
      }
    }
  }
}

// =============================================================================
// API Client Implementation (Legacy Support)
// =============================================================================

export class ApiClient {
  private client         : AxiosInstance
  private rateLimiter    : RateLimiter
  private readonly config: ChainChirpConfig

  constructor(config: Partial<ChainChirpConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.rateLimiter = new RateLimiter(this.config.rateLimit.requestsPerMinute)
    this.client = this.createAxiosInstance()
    this.setupInterceptors()
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      timeout: this.config.apiTimeout,
      headers: {
        'User-Agent'  : 'ChainChirp-CLI/1.0.0',
        Accept        : 'application/json',
        'Content-Type': 'application/json',
      },
    })
  }

  private setupInterceptors(): void {
    // Request interceptor for rate limiting and logging
    this.client.interceptors.request.use(
      async (config) => {
        await this.rateLimiter.checkLimit()

        this.log(
          'debug',
          `Request: ${config.method?.toUpperCase()} ${config.url}`,
        )

        if (config.params) {
          this.log('debug', `Params: ${JSON.stringify(config.params)}`)
        }

        return config
      },
      (error) => {
        this.log('error', `Request error: ${error.message}`)
        return Promise.reject(this.createApiError(error))
      },
    )

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        this.log(
          'debug',
          `Response: ${response.status} ${response.config.url}`,
        )
        return response
      },
      async (error) => {
        const apiError = this.createApiError(error)
        this.log('error', `Response error: ${apiError.message}`)

        // Retry logic for specific error codes
        if (this.shouldRetry(error) && !error.config.__retryCount) {
          return this.retryRequest(error)
        }

        return Promise.reject(apiError)
      },
    )
  }

  private createApiError(error: unknown): ApiError {
    const err = error as AxiosError
    const apiError = new Error(err.message || 'Unknown API error') as ApiError
    apiError.name = 'ApiError'
    apiError.url = err.config?.url
    apiError.status = err.response?.status
    apiError.code = err.code

    if (err.response) {
      apiError.response = {
        data   : err.response.data,
        status : err.response.status,
        headers: err.response.headers,
      }
    }

    return apiError
  }

  private shouldRetry(error: unknown): boolean {
    const err = error as AxiosError
    const retryableStatusCodes = [ 429, 500, 502, 503, 504 ]
    const retryableErrorCodes = [ 'ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT' ]

    return (
      (err.response?.status !== undefined &&
        retryableStatusCodes.includes(err.response.status)) ||
      (err.code !== undefined && retryableErrorCodes.includes(err.code))
    )
  }

  private async retryRequest(error: unknown): Promise<AxiosResponse> {
    const err = error as AxiosError
    const config = err.config

    if (!config) {
      return Promise.reject(error)
    }

    const retryCount = config.__retryCount || 0
    const maxRetries = 3
    const baseDelay = 1000

    if (retryCount >= maxRetries) {
      return Promise.reject(error)
    }

    config.__retryCount = retryCount + 1
    const delay = baseDelay * Math.pow(2, retryCount) // Exponential backoff

    this.log(
      'info',
      `Retrying request (${retryCount + 1}/${maxRetries}) after ${delay}ms`,
    )

    await new Promise((resolve) => setTimeout(resolve, delay))
    return this.client.request(config as AxiosRequestConfig)
  }

  // =============================================================================
  // Public API Methods
  // =============================================================================

  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.get<T>(url, config)
    return this.formatResponse<T>(response)
  }

  async post<T>(
    url: string,
    data?: RequestData,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<T>(url, data, config)
    return this.formatResponse<T>(response)
  }

  async put<T>(
    url: string,
    data?: RequestData,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<T>(url, data, config)
    return this.formatResponse<T>(response)
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.delete<T>(url, config)
    return this.formatResponse<T>(response)
  }

  private formatResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
    return {
      data     : response.data,
      status   : response.status,
      headers  : response.headers as Record<string, string>,
      timestamp: new Date(),
    }
  }

  // =============================================================================
  // Endpoint-Specific Methods
  // =============================================================================

  async getCoinGecko<T>(
    endpoint: string,
    params?: QueryParams,
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.apiEndpoints.coingecko}${endpoint}`
    return this.get<T>(url, { params })
  }

  async getMempool<T>(
    endpoint: string,
    params?: QueryParams,
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.apiEndpoints.mempool}${endpoint}`
    return this.get<T>(url, { params })
  }

  async getBlockchain<T>(
    endpoint: string,
    params?: QueryParams,
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.apiEndpoints.blockchain}${endpoint}`
    return this.get<T>(url, { params })
  }

  async getLightning<T>(
    endpoint: string,
    params?: QueryParams,
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.apiEndpoints.lightning}${endpoint}`
    return this.get<T>(url, { params })
  }

  async getFearGreed<T>(
    endpoint: string,
    params?: QueryParams,
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.apiEndpoints.fearGreed}${endpoint}`
    return this.get<T>(url, { params })
  }

  // =============================================================================
  // Health Check & Utilities
  // =============================================================================

  async healthCheck(): Promise<Record<string, boolean>> {
    const endpoints = Object.entries(this.config.apiEndpoints)
    const results: Record<string, boolean> = {}

    for (const [ name, baseUrl ] of endpoints) {
      try {
        await this.client.get(baseUrl, { timeout: 5000 })
        results[name] = true
      } catch (error) {
        results[name] = false
        this.log('warn', `Health check failed for ${name}: ${error}`)
      }
    }

    return results
  }

  getConfig(): ChainChirpConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<ChainChirpConfig>): void {
    Object.assign(this.config, newConfig)
    this.rateLimiter = new RateLimiter(this.config.rateLimit.requestsPerMinute)
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (this.config.debugMode || process.env.DEBUG === '1') {
      const timestamp = new Date().toISOString()
      console.log(
        `[${timestamp}] [${level.toUpperCase()}] ApiClient: ${message}`,
      )
      if (data !== undefined) {
        console.log(JSON.stringify(data, null, 2))
      }
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let apiClientInstance: ApiClient | null = null
let multiFallbackInstance: MultiFallbackClient | null = null

export function getApiClient(config?: Partial<ChainChirpConfig>): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient(config)
  }
  return apiClientInstance
}

export function getMultiFallbackClient(config?: Partial<ChainChirpConfig>): MultiFallbackClient {
  if (!multiFallbackInstance) {
    multiFallbackInstance = new MultiFallbackClient(config)
  }
  return multiFallbackInstance
}

export function resetApiClient(): void {
  apiClientInstance = null
  multiFallbackInstance = null
}

// =============================================================================
// Convenience Functions with Fallback Support
// =============================================================================

export async function api<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const client = getApiClient()
  const response = await client.get<T>(url, config)
  return response.data
}

export async function coingecko<T>(
  endpoint: string,
  params?: QueryParams,
): Promise<T> {
  const client = getApiClient()
  const response = await client.getCoinGecko<T>(endpoint, params)
  return response.data
}

// New fallback-enabled functions
export async function fetchWithFallback<T>(
  endpoint: string,
  params?: QueryParams,
  options?: Partial<FallbackOptions>
): Promise<T> {
  const client = getMultiFallbackClient()
  return client.fetchWithFallback<T>(endpoint, params, options)
}

export async function mempool<T>(
  endpoint: string,
  params?: QueryParams,
): Promise<T> {
  const client = getApiClient()
  const response = await client.getMempool<T>(endpoint, params)
  return response.data
}

export async function blockchain<T>(
  endpoint: string,
  params?: QueryParams,
): Promise<T> {
  const client = getApiClient()
  const response = await client.getBlockchain<T>(endpoint, params)
  return response.data
}

export async function lightning<T>(
  endpoint: string,
  params?: QueryParams,
): Promise<T> {
  const client = getApiClient()
  const response = await client.getLightning<T>(endpoint, params)
  return response.data
}

export async function fearGreed<T>(
  endpoint: string,
  params?: QueryParams,
): Promise<T> {
  const client = getApiClient()
  const response = await client.getFearGreed<T>(endpoint, params)
  return response.data
}
