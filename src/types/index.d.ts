// CoinGecko API Response Types
export interface CoinGeckoSimplePrice {
  bitcoin: {
    [currency: string]: number;
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

// Internal Application Types
export interface PriceData {
  current: number;
  previous?: number;
  currency: string;
  timestamp: number;
}

export interface BlockData {
  height: number;
  timestamp: number;
  hash?: string;
  age?: string; // human readable time ago
}

// API Client Types
export interface ApiError {
  message: string;
  status?: number;
  url?: string;
}

// CLI Command Result Types
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

// Configuration Types
export interface ChainChirpConfig {
  defaultCurrency: string;
  apiTimeout: number;
  debugMode: boolean;
}
