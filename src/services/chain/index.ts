// =============================================================================
// Chain Services Index
// =============================================================================

// Export Block Service
export {
  BlockService,
  getBlockService,
  getCurrentBlock,
  getRecentBlocks,
  getBlockByHash,
} from './blockService'

// Export Mempool Service
export {
  MempoolService,
  getMempoolService,
  getMempoolInfo,
  getCongestionLevel,
} from './mempoolService'

// Export Fees Service
export {
  FeesService,
  getFeesService,
  getRecommendedFees,
  getFeeHistory,
} from './feesService'

// Export Hashrate Service
export {
  HashrateService,
  getHashrateService,
  getCurrentHashrate,
} from './hashrateService'

// Export Halving Service
export {
  HalvingService,
  getHalvingService,
  getCurrentHalving,
} from './halvingService'

// Export service types
export type { BlockData, MempoolInfo, FeeEstimate, HashrateData, HalvingData } from '@/types'
