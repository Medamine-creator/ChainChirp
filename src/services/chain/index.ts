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

// Export service types
export type { BlockData } from '@/types'

// TODO: Add other chain services as they are implemented
// - MempoolService
// - FeesService  
// - HashrateService
// - HalvingService
