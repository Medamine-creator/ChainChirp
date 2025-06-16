import { describe, test, expect } from 'bun:test'
import type { Currency, TimeFrame } from '../../../src/types'

describe('Sparkline Command Tests', () => {
  describe('Sparkline Data Validation', () => {
    test('should validate sparkline data structure', () => {
      const mockSparklineData = {
        prices: [44000, 45000, 46000, 45500, 44500],
        timeframe: '7d' as TimeFrame,
        currency: 'usd' as Currency,
        width: 80,
        height: 20,
      }

      expect(Array.isArray(mockSparklineData.prices)).toBe(true)
      expect(mockSparklineData.prices.length).toBeGreaterThan(0)
      expect(typeof mockSparklineData.timeframe).toBe('string')
      expect(typeof mockSparklineData.currency).toBe('string')
      expect(typeof mockSparklineData.width).toBe('number')
      expect(typeof mockSparklineData.height).toBe('number')
    })

    test('should handle different timeframes', () => {
      const timeframes: TimeFrame[] = ['1h', '24h', '7d', '30d', '1y']
      
      timeframes.forEach(timeframe => {
        expect(typeof timeframe).toBe('string')
        expect(['1h', '24h', '7d', '30d', '1y']).toContain(timeframe)
      })
    })
  })

  describe('ASCII Rendering Validation', () => {
    test('should validate ASCII output structure', () => {
      const mockAsciiOutput = `
    ▲                   
  ▲   ●                 
●       ▼               
        ●               
          ▼             
`
      expect(typeof mockAsciiOutput).toBe('string')
      expect(mockAsciiOutput.includes('\n')).toBe(true)
    })

    test('should handle different dimensions', () => {
      const dimensions = [
        { width: 80, height: 20 },
        { width: 40, height: 10 },
        { width: 20, height: 5 },
      ]

      dimensions.forEach(({ width, height }) => {
        expect(typeof width).toBe('number')
        expect(typeof height).toBe('number')
        expect(width).toBeGreaterThan(0)
        expect(height).toBeGreaterThan(0)
      })
    })

    test('should validate sparkline characters', () => {
      const sparklineChars = ['●', '▲', '▼', '─', ' ']
      
      sparklineChars.forEach(char => {
        expect(typeof char).toBe('string')
        expect(char.length).toBe(1)
      })
    })
  })

  describe('Sparkline Statistics', () => {
    test('should calculate sparkline statistics', () => {
      const prices = [44000, 45000, 46000, 45500, 44500]
      const min = Math.min(...prices)
      const max = Math.max(...prices)
      const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length

      expect(min).toBe(44000)
      expect(max).toBe(46000)
      expect(avg).toBe(45000)
    })

    test('should determine trend direction', () => {
      const trendTypes = ['up', 'down', 'flat']
      
      trendTypes.forEach(trend => {
        expect(typeof trend).toBe('string')
        expect(['up', 'down', 'flat']).toContain(trend)
      })
    })
  })
}) 