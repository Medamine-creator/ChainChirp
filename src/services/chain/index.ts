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

// Export service types
export type { BlockData, MempoolInfo } from '@/types'

// TODO: Add other chain services as they are implemented
// - FeesService  
// - HashrateService
// - HalvingService
