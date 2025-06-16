import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { OutputFormat } from '../types/index.js'
import type {
  ApiResponse,
  ApiError,
  LogLevel,
  ChainChirpConfig,
} from '../types/index.js'

// =============================================================================
// Internal Types for Strict Typing
// =============================================================================

interface AxiosErrorResponse {
  data: unknown;
  status: number;
  headers: Record<string, string>;
}

interface AxiosErrorConfig {
  url?: string;
  method?: string;
  __retryCount?: number;
  [key: string]: unknown;
}

interface AxiosError {
  message?: string;
  code?: string;
  config?: AxiosErrorConfig;
  response?: AxiosErrorResponse;
  [key: string]: unknown;
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
// Configuration Constants
// =============================================================================

export const DEFAULT_CONFIG: ChainChirpConfig = {
  defaultCurrency     : 'usd',
  defaultOutputFormat : OutputFormat.DEFAULT,
  apiTimeout          : 10000,
  debugMode           : false,
  watchDefaults       : {
    enabled     : false,
    interval    : 30,
    clearScreen : true,
  },
  apiEndpoints : {
    coingecko  : 'https://api.coingecko.com/api/v3',
    mempool    : 'https://mempool.space/api',
    blockchain : 'https://blockchain.info',
    lightning  : 'https://1ml.com/api',
    fearGreed  : 'https://api.alternative.me',
  },
  rateLimit : {
    requestsPerMinute : 60,
    burstLimit        : 10,
  },
}

// =============================================================================
// Rate Limiting
// =============================================================================

class RateLimiter {
  private requests: number[] = []
  private readonly windowMs: number
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
// API Client Implementation
// =============================================================================

export class ApiClient {
  private client: AxiosInstance
  private rateLimiter: RateLimiter
  private readonly config: ChainChirpConfig

  constructor(config: Partial<ChainChirpConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.rateLimiter = new RateLimiter(this.config.rateLimit.requestsPerMinute)
    this.client = this.createAxiosInstance()
    this.setupInterceptors()
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      timeout : this.config.apiTimeout,
      headers : {
        'User-Agent'   : 'ChainChirp-CLI/1.0.0',
        Accept         : 'application/json',
        'Content-Type' : 'application/json',
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
        data    : err.response.data,
        status  : err.response.status,
        headers : err.response.headers,
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
      data      : response.data,
      status    : response.status,
      headers   : response.headers as Record<string, string>,
      timestamp : new Date(),
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

export function getApiClient(config?: Partial<ChainChirpConfig>): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient(config)
  }
  return apiClientInstance
}

export function resetApiClient(): void {
  apiClientInstance = null
}

// =============================================================================
// Convenience Functions
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
