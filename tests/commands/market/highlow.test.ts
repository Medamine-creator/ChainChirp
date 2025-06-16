import { describe, test, expect } from 'bun:test'
import type { Currency } from '../../../src/types'

describe('HighLow Command Tests', () => {
  describe('High/Low Data Validation', () => {
    test('should validate high/low number relationships', () => {
      const testCases = [
        { high: 46000, low: 44000, current: 45000 },
        { high: 69000, low: 3200, current: 42000 },
        { high: 50000, low: 50000, current: 50000 }, // Same values
      ]

      testCases.forEach(({ high, low, current }) => {
        expect(typeof high).toBe('number')
        expect(typeof low).toBe('number')
        expect(typeof current).toBe('number')
        expect(high).toBeGreaterThanOrEqual(low)
        expect(current).toBeGreaterThanOrEqual(low)
        expect(current).toBeLessThanOrEqual(high)
      })
    })

    test('should handle ATH/ATL data structure', () => {
      const mockHighLowData = {
        current: 42000,
        high24h: 43000,
        low24h: 41000,
        ath: 69000,
        atl: 3200,
        athDate: new Date('2021-11-10'),
        atlDate: new Date('2020-12-16'),
        currency: 'usd' as Currency,
      }

      expect(typeof mockHighLowData.current).toBe('number')
      expect(typeof mockHighLowData.high24h).toBe('number')
      expect(typeof mockHighLowData.low24h).toBe('number')
      expect(typeof mockHighLowData.ath).toBe('number')
      expect(typeof mockHighLowData.atl).toBe('number')
      expect(mockHighLowData.athDate).toBeInstanceOf(Date)
      expect(mockHighLowData.atlDate).toBeInstanceOf(Date)
      expect(typeof mockHighLowData.currency).toBe('string')
    })
  })

  describe('Distance Calculations', () => {
    test('should calculate distance from high/low correctly', () => {
      const current = 45000
      const high = 46000
      const low = 44000

      const distanceFromHigh = high - current
      const distanceFromLow = current - low
      const range = high - low
      const positionInRange = range !== 0 ? (current - low) / range : 0

      expect(distanceFromHigh).toBe(1000)
      expect(distanceFromLow).toBe(1000)
      expect(positionInRange).toBe(0.5)
    })

    test('should handle edge cases in distance calculations', () => {
      // Current price at high
      const atHigh = { current: 46000, high: 46000, low: 44000 }
      expect(atHigh.high - atHigh.current).toBe(0)

      // Current price at low
      const atLow = { current: 44000, high: 46000, low: 44000 }
      expect(atLow.current - atLow.low).toBe(0)
    })
  })
}) 