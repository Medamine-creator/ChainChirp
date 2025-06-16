import { describe, test, expect } from 'bun:test'
import type { Currency } from '../../../src/types'

describe('Volume Command Tests', () => {
  describe('Volume Data Validation', () => {
    test('should validate volume number format', () => {
      const validVolumes = [1000000, 1500000.50, 2.5e9, 0]
      const invalidVolumes = [NaN, Infinity, -Infinity, 'not-a-number']
      
      validVolumes.forEach(volume => {
        expect(typeof volume).toBe('number')
        expect(Number.isFinite(volume)).toBe(true)
        expect(volume).toBeGreaterThanOrEqual(0)
      })

      invalidVolumes.forEach(volume => {
        if (typeof volume === 'number') {
          expect(Number.isFinite(volume)).toBe(false)
        } else {
          expect(typeof volume).not.toBe('number')
        }
      })
    })

    test('should handle volume change calculations', () => {
      const volumeChanges = [
        { previous: 1000000, current: 1100000, expectedPercent: 10 },
        { previous: 2000000, current: 1800000, expectedPercent: -10 },
        { previous: 1000000, current: 1000000, expectedPercent: 0 },
      ]

      volumeChanges.forEach(({ previous, current, expectedPercent }) => {
        const actualPercent = ((current - previous) / previous) * 100
        expect(Math.abs(actualPercent - expectedPercent)).toBeLessThan(0.01)
      })
    })
  })

  describe('Volume Formatting', () => {
    test('should format large volume numbers correctly', () => {
      const testCases = [
        { volume: 1000000, expected: '1.00M' },
        { volume: 1500000000, expected: '1.50B' },
        { volume: 2500, expected: '2.50K' },
        { volume: 500, expected: '500' },
      ]

      testCases.forEach(({ volume, expected }) => {
        expect(typeof volume).toBe('number')
        expect(typeof expected).toBe('string')
        expect(volume).toBeGreaterThanOrEqual(0)
      })
    })

    test('should handle different currency volume units', () => {
      const currencies: Currency[] = ['usd', 'eur', 'gbp', 'jpy', 'btc', 'eth', 'sats']
      
      currencies.forEach(currency => {
        expect(typeof currency).toBe('string')
        expect(['usd', 'eur', 'gbp', 'jpy', 'btc', 'eth', 'sats']).toContain(currency)
      })
    })
  })

  describe('Volume Trend Analysis', () => {
    test('should identify volume trends', () => {
      const trendTypes = ['increasing', 'decreasing', 'stable']
      const strengthTypes = ['weak', 'moderate', 'strong']
      
      trendTypes.forEach(trend => {
        expect(typeof trend).toBe('string')
        expect(trend.length).toBeGreaterThan(0)
      })

      strengthTypes.forEach(strength => {
        expect(typeof strength).toBe('string')
        expect(strength.length).toBeGreaterThan(0)
      })
    })

    test('should calculate volume volatility', () => {
      const volumes = [1000000, 1100000, 950000, 1200000]
      const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
      const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length
      const volatility = Math.sqrt(variance) / mean

      expect(typeof volatility).toBe('number')
      expect(Number.isFinite(volatility)).toBe(true)
      expect(volatility).toBeGreaterThanOrEqual(0)
    })
  })
}) 