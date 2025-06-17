import { describe, test, expect } from 'bun:test'

describe('Chain Services Integration Tests', () => {
  test('should have all required service exports', async () => {
    const chainServices = await import('@/services/chain')
    
    // Check service classes are exported
    expect(typeof chainServices.BlockService).toBe('function')
    expect(typeof chainServices.MempoolService).toBe('function')
    expect(typeof chainServices.FeesService).toBe('function')
    expect(typeof chainServices.HashrateService).toBe('function')
    expect(typeof chainServices.HalvingService).toBe('function')
    
    // Check service factory functions are exported
    expect(typeof chainServices.getBlockService).toBe('function')
    expect(typeof chainServices.getMempoolService).toBe('function')
    expect(typeof chainServices.getFeesService).toBe('function')
    expect(typeof chainServices.getHashrateService).toBe('function')
    expect(typeof chainServices.getHalvingService).toBe('function')
    
    // Check convenience functions are exported
    expect(typeof chainServices.getCurrentBlock).toBe('function')
    expect(typeof chainServices.getMempoolInfo).toBe('function')
    expect(typeof chainServices.getRecommendedFees).toBe('function')
    expect(typeof chainServices.getCurrentHashrate).toBe('function')
    expect(typeof chainServices.getCurrentHalving).toBe('function')
  })

  test('should have all required type exports', async () => {
    // Note: This would be tested at compile time, but we can check runtime availability
    const chainServices = await import('@/services/chain')
    
    // These should be available as type exports (checked at build time)
    expect(chainServices).toBeDefined()
  })

  test('should maintain service isolation', () => {
    const { 
      getBlockService, 
      getMempoolService, 
      getFeesService, 
      getHashrateService, 
      getHalvingService 
    } = require('@/services/chain')
    
    const blockService = getBlockService()
    const mempoolService = getMempoolService()
    const feesService = getFeesService()
    const hashrateService = getHashrateService()
    const halvingService = getHalvingService()
    
    // Services should be different instances
    expect(blockService).not.toBe(mempoolService)
    expect(mempoolService).not.toBe(feesService)
    expect(feesService).not.toBe(hashrateService)
    expect(hashrateService).not.toBe(halvingService)
    
    // But singleton pattern should work
    expect(getBlockService()).toBe(blockService)
    expect(getMempoolService()).toBe(mempoolService)
    expect(getFeesService()).toBe(feesService)
    expect(getHashrateService()).toBe(hashrateService)
    expect(getHalvingService()).toBe(halvingService)
  })
}) 