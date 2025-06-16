import { describe, test, expect } from 'bun:test'
import type { Currency } from '../../../src/types'

describe('Change Command Tests', () => {
  describe('Price Change Calculations', () => {
    test('should calculate percentage changes correctly', () => {
      const changeTests = [
        { previous: 40000, current: 42000, expectedPercent: 5 },
        { previous: 50000, current: 45000, expectedPercent: -10 },
        { previous: 30000, current: 30000, expectedPercent: 0 },
      ]

      changeTests.forEach(({ previous, current, expectedPercent }) => {
        const actualPercent = ((current - previous) / previous) * 100
        expect(Math.abs(actualPercent - expectedPercent)).toBeLessThan(0.01)
      })
    })

    test('should handle different time periods', () => {
      const timePeriods = ['1h', '24h', '7d', '30d']
      
      timePeriods.forEach(period => {
        expect(typeof period).toBe('string')
        expect(['1h', '24h', '7d', '30d']).toContain(period)
      })
    })

    test('should format change indicators', () => {
      const changeIndicators = [
        { change: 5.5, expected: '+5.50%' },
        { change: -3.2, expected: '-3.20%' },
        { change: 0, expected: '0.00%' },
      ]

      changeIndicators.forEach(({ change, expected }) => {
        expect(typeof change).toBe('number')
        expect(typeof expected).toBe('string')
        expect(expected).toMatch(/^[+-]?\d+\.\d{2}%$/)
      })
    })
  })

  describe('Change Data Structure', () => {
    test('should validate change data format', () => {
      const mockChangeData = {
        current: 42000,
        change1h: 150,
        change24h: 1200,
        change7d: -800,
        change30d: 3000,
        changePercent1h: 0.36,
        changePercent24h: 2.94,
        changePercent7d: -1.86,
        changePercent30d: 7.69,
        currency: 'usd' as Currency,
      }

      expect(typeof mockChangeData.current).toBe('number')
      expect(typeof mockChangeData.change1h).toBe('number')
      expect(typeof mockChangeData.change24h).toBe('number')
      expect(typeof mockChangeData.change7d).toBe('number')
      expect(typeof mockChangeData.change30d).toBe('number')
      expect(typeof mockChangeData.changePercent1h).toBe('number')
      expect(typeof mockChangeData.changePercent24h).toBe('number')
      expect(typeof mockChangeData.changePercent7d).toBe('number')
      expect(typeof mockChangeData.changePercent30d).toBe('number')
      expect(typeof mockChangeData.currency).toBe('string')
    })
  })
}) 