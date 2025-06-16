// =============================================================================
// API Response Types
// =============================================================================

// CoinGecko API Response Types
export interface CoinGeckoSimplePrice {
  bitcoin: {
    [currency: string]: number;
  };
}

export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d: {
    price: number[];
  };
}

// Blockchain.info API Response Types
export interface BlockchainInfoLatestBlock {
  hash: string;
  time: number;
  block_index: number;
  height: number;
  txIndexes: number[];
}

// Mempool.space API Response Types
export interface MempoolSpaceBlock {
  id: string;
  height: number;
  version: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  merkle_root: string;
  previousblockhash: string;
  mediantime: number;
  nonce: number;
  bits: number;
  difficulty: number;
}

export interface MempoolSpaceFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export interface MempoolSpaceMempool {
  count: number;
  vsize: number;
  total_fee: number;
  fee_histogram: number[][];
}

export interface MempoolSpaceHashrate {
  currentHashrate: number;
  currentDifficulty: number;
  adjustmentProgress: number;
  remainingBlocks: number;
  timeAvg: number;
}

// Lightning Network Response Types
export interface LightningNetworkStats {
  channel_count: number;
  node_count: number;
  total_capacity: number;
  avg_capacity: number;
  avg_fee_rate: number;
  avg_base_fee_msat: number;
}

// Fear & Greed Index Response Types
export interface FearGreedIndexResponse {
  name: string;
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
  }>;
  metadata: {
    error: null | string;
  };
}

// =============================================================================
// Internal Application Types
// =============================================================================

// Market Data Types
export interface MarketData {
  price: number;
  currency: string;
  change24h: number;
  changePercent24h: number;
  change7d?: number;
  change30d?: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  ath: number;
  atl: number;
  lastUpdated: Date;
}

export interface VolumeData {
  volume24h: number;
  volumeChange24h: number;
  volumeChangePercent24h: number;
  currency: string;
  timestamp: Date;
}

export interface PriceChangeData {
  current: number;
  change1h?: number;
  change24h: number;
  change7d?: number;
  change30d?: number;
  changePercent1h?: number;
  changePercent24h: number;
  changePercent7d?: number;
  changePercent30d?: number;
  currency: string;
}

export interface HighLowData {
  high24h: number;
  low24h: number;
  ath: number;
  athDate: Date;
  atl: number;
  atlDate: Date;
  currency: string;
}

export interface SparklineData {
  prices: number[];
  timeframe: '1h' | '24h' | '7d' | '30d';
  currency: string;
  width?: number;
  height?: number;
}

// Chain Data Types
export interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  txCount: number;
  size: number;
  weight: number;
  difficulty: number;
  age: string;
}

export interface MempoolInfo {
  count: number;
  vsize: number;
  totalFees: number;
  feeHistogram: number[][];
  congestionLevel: 'low' | 'medium' | 'high';
}

export interface FeeEstimate {
  fastest: number;
  halfHour: number;
  hour: number;
  economy: number;
  minimum: number;
  unit: 'sat/vB';
  timestamp: Date;
}

export interface HashrateData {
  current: number;
  unit: 'TH/s' | 'EH/s';
  difficulty: number;
  adjustmentProgress: number;
  estimatedTimeToAdjustment: number;
  nextAdjustmentDate: Date;
}

export interface HalvingData {
  currentBlockHeight: number;
  halvingBlockHeight: number;
  blocksRemaining: number;
  estimatedDate: Date;
  daysRemaining: number;
  currentReward: number;
  nextReward: number;
}

// Lightning Data Types
export interface LightningNetworkData {
  nodeCount: number;
  channelCount: number;
  totalCapacity: number;
  avgCapacity: number;
  avgFeeRate: number;
  capacityUnit: 'BTC' | 'sats';
}

// Sentiment Data Types
export interface FearGreedIndex {
  value: number;
  classification:
    | 'Extreme Fear'
    | 'Fear'
    | 'Neutral'
    | 'Greed'
    | 'Extreme Greed';
  timestamp: Date;
  timeUntilUpdate: string;
}

// =============================================================================
// Configuration & Command Types
// =============================================================================

// Command Categories
export enum CommandCategory {
  MARKET = 'market',
  CHAIN = 'chain',
  LIGHTNING = 'lightning',
  SENTIMENT = 'sentiment',
}

// Output Formats
export enum OutputFormat {
  DEFAULT = 'default',
  JSON = 'json',
  TABLE = 'table',
  CSV = 'csv',
}

// Watch Configuration
export interface WatchConfig {
  enabled: boolean;
  interval: number; // in seconds
  maxIterations?: number;
  clearScreen: boolean;
}

// Command Configuration
export interface CommandConfig {
  category: CommandCategory;
  command: string;
  outputFormat: OutputFormat;
  watch: WatchConfig;
  currency: string;
  debug: boolean;
}

// Application Configuration
export interface ChainChirpConfig {
  defaultCurrency: string;
  defaultOutputFormat: OutputFormat;
  apiTimeout: number;
  debugMode: boolean;
  watchDefaults: WatchConfig;
  apiEndpoints: {
    coingecko: string;
    mempool: string;
    blockchain: string;
    lightning: string;
    fearGreed: string;
  };
  rateLimit: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}

// =============================================================================
// API & Error Types
// =============================================================================

// API Client Types
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  userAgent: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  timestamp: Date;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  url?: string;
  response?: {
    data: unknown;
    status: number;
    headers: Record<string, string>;
  };
}

// Command Result Types
export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError | Error;
  timestamp: Date;
  executionTime: number;
}

// Service Interface
export interface BaseService {
  readonly name: string;
  readonly endpoints: string[];
  healthcheck(): Promise<boolean>;
}

// =============================================================================
// Utility Types
// =============================================================================

export type Currency = 'usd' | 'eur' | 'gbp' | 'jpy' | 'btc' | 'eth' | 'sats';

export type TimeFrame = '1h' | '24h' | '7d' | '30d' | '1y';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  category?: string;
  data?: unknown;
}
