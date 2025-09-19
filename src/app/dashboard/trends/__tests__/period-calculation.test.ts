// Using Jest (not Vitest)
import { parseAndConvertToUTC, toUTCDateString, createEndOfMonth, addDays, createUTCDate } from '@/lib/utils/date-utils'

// Import the same functions used in the actual trends page
const addMonths = (date: Date, months: number): Date => {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + months
  const day = date.getUTCDate()
  return createUTCDate(year, month, day)
}

const getEndOfWeek = (date: Date): Date => {
  const day = date.getUTCDay()
  const daysToAdd = (7 - day) % 7 || 7 // Days to Sunday (end of week)
  const endDate = addDays(date, daysToAdd)
  // Set to end of day
  const year = endDate.getUTCFullYear()
  const month = endDate.getUTCMonth()
  const dayOfMonth = endDate.getUTCDate()
  const result = createUTCDate(year, month, dayOfMonth)
  result.setUTCHours(23, 59, 59, 999)
  return result
}

/**
 * Unit tests for period calculation logic used in merchant tooltip
 * This tests the same logic as in fetchMerchantData function
 */
describe('Period Calculation for Merchant Tooltip', () => {

  const testPeriodCalculation = (periodType: string, periodStart: Date): Date => {
    let periodEnd: Date

    switch (periodType) {
      case 'WEEKLY':
        // Use YOUR UTC-aware getEndOfWeek function
        periodEnd = getEndOfWeek(periodStart)
        break
      case 'BI_WEEKLY':
        // For bi-weekly, add 13 days (2 weeks - 1 day) using YOUR addDays
        periodEnd = addDays(periodStart, 13)
        break
      case 'MONTHLY':
        // Use YOUR UTC-aware createEndOfMonth function
        periodEnd = createEndOfMonth(periodStart)
        break
      case 'QUARTERLY':
        // Add 3 months and get end of that month using YOUR functions
        periodEnd = createEndOfMonth(addMonths(periodStart, 2))
        break
      case 'BI_ANNUALLY':
        // Add 6 months and get end of that month using YOUR functions
        periodEnd = createEndOfMonth(addMonths(periodStart, 5))
        break
      case 'ANNUALLY':
        // Add 12 months and get end of that month using YOUR functions
        periodEnd = createEndOfMonth(addMonths(periodStart, 11))
        break
      default:
        // Default to monthly using YOUR function
        periodEnd = createEndOfMonth(periodStart)
    }

    return periodEnd
  }

  describe('MONTHLY period calculation', () => {
    it('should calculate correct end date for August 2025', () => {
      const periodStart = parseAndConvertToUTC('2025-08-01')
      const periodEnd = testPeriodCalculation('MONTHLY', periodStart)

      console.log('Test - periodStart:', periodStart.toISOString())
      console.log('Test - periodEnd:', periodEnd.toISOString())
      console.log('Test - periodEnd as string:', toUTCDateString(periodEnd))

      // August 2025 should end on August 31, 2025
      expect(periodEnd.getUTCFullYear()).toBe(2025)
      expect(periodEnd.getUTCMonth()).toBe(7) // August is month 7 (0-indexed)
      expect(periodEnd.getUTCDate()).toBe(31) // Last day of August

      // Test the string conversion
      expect(toUTCDateString(periodEnd)).toBe('2025-08-31')
    })

    it('should calculate correct end date for February 2024 (leap year)', () => {
      const periodStart = parseAndConvertToUTC('2024-02-01')
      const periodEnd = testPeriodCalculation('MONTHLY', periodStart)

      // February 2024 should end on February 29, 2024 (leap year)
      expect(periodEnd.getUTCFullYear()).toBe(2024)
      expect(periodEnd.getUTCMonth()).toBe(1) // February is month 1 (0-indexed)
      expect(periodEnd.getUTCDate()).toBe(29) // Last day of February in leap year

      expect(toUTCDateString(periodEnd)).toBe('2024-02-29')
    })

    it('should calculate correct end date for February 2025 (non-leap year)', () => {
      const periodStart = parseAndConvertToUTC('2025-02-01')
      const periodEnd = testPeriodCalculation('MONTHLY', periodStart)

      // February 2025 should end on February 28, 2025 (non-leap year)
      expect(periodEnd.getUTCFullYear()).toBe(2025)
      expect(periodEnd.getUTCMonth()).toBe(1) // February is month 1 (0-indexed)
      expect(periodEnd.getUTCDate()).toBe(28) // Last day of February in non-leap year

      expect(toUTCDateString(periodEnd)).toBe('2025-02-28')
    })

    it('should handle mid-month start dates correctly', () => {
      const periodStart = parseAndConvertToUTC('2025-08-15') // Mid-month
      const periodEnd = testPeriodCalculation('MONTHLY', periodStart)

      // Should still end on August 31, 2025
      expect(toUTCDateString(periodEnd)).toBe('2025-08-31')
    })
  })

  describe('Other period types', () => {
    it('should calculate WEEKLY periods correctly', () => {
      const periodStart = parseAndConvertToUTC('2025-08-01') // Friday
      const periodEnd = testPeriodCalculation('WEEKLY', periodStart)

      // Should end on the following Sunday
      expect(periodEnd.getUTCDay()).toBe(0) // Sunday
      expect(toUTCDateString(periodEnd)).toBe('2025-08-03')
    })

    it('should calculate QUARTERLY periods correctly', () => {
      const periodStart = parseAndConvertToUTC('2025-08-01')
      const periodEnd = testPeriodCalculation('QUARTERLY', periodStart)

      // Q3 starting in August should end on October 31
      expect(toUTCDateString(periodEnd)).toBe('2025-10-31')
    })

    it('should use MONTHLY as default when periodType is undefined', () => {
      const periodStart = parseAndConvertToUTC('2025-08-01')
      const periodEnd = testPeriodCalculation('UNKNOWN_TYPE', periodStart)

      // Should default to monthly calculation
      expect(toUTCDateString(periodEnd)).toBe('2025-08-31')
    })
  })

  describe('Edge cases', () => {
    it('should handle year boundaries correctly', () => {
      const periodStart = parseAndConvertToUTC('2024-12-01')
      const periodEnd = testPeriodCalculation('MONTHLY', periodStart)

      // December should end on December 31
      expect(toUTCDateString(periodEnd)).toBe('2024-12-31')
    })

    it('should handle the exact scenario from the bug report', () => {
      // This is the exact scenario causing the bug
      const period = '2025-08-01'
      const periodStart = parseAndConvertToUTC(period)
      const periodEnd = testPeriodCalculation('MONTHLY', periodStart)

      const startString = toUTCDateString(periodStart)
      const endString = toUTCDateString(periodEnd)

      console.log('Bug scenario test:')
      console.log('  Input period:', period)
      console.log('  Parsed periodStart:', periodStart.toISOString())
      console.log('  Calculated periodEnd:', periodEnd.toISOString())
      console.log('  Start string:', startString)
      console.log('  End string:', endString)

      // These should NOT be equal
      expect(startString).toBe('2025-08-01')
      expect(endString).toBe('2025-08-31')
      expect(startString).not.toBe(endString) // This should pass if logic is correct
    })
  })
})
