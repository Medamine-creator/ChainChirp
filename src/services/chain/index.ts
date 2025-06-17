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

// Export service types
export type { BlockData, MempoolInfo, FeeEstimate } from '@/types'

// TODO: Add other chain services as they are implemented
// - HashrateService
// - HalvingService
