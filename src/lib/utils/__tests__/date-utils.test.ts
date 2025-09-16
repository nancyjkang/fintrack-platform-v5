/**
 * Date Utilities Test Suite - FinTrack v5
 *
 * Comprehensive tests for date handling utilities including:
 * - Core date operations
 * - Timezone edge cases
 * - Date consistency validation
 * - Error handling
 * - Performance validation
 */

import {
  getCurrentDate,
  getCurrentUTCDate,
  getCurrentUTCDateString,
  toUTCDateString,
  toUTCMidnight,
  formatDateForDisplay,
  formatDateString,
  formatDateStringByPeriod,
  isValidDateString,
  isSameDay,
  isToday,
  isPast,
  isFuture,
  testDateConsistency,
  validateDateConsistency,
  getTimezoneInfo,
  addDays,
  subtractDays,
  getDaysAgo,
  getDaysFromNow,
  generateDateRange,
  getOneDayBefore,
  getOneDayAfter,
  createUTCDate,
  createStartOfMonth,
  createEndOfMonth,
  getUserTimezone,
  parseAndConvertToUTC,
  addHours,
  subtractHours,
  toISOString,
  getCurrentTimeString
} from '../date-utils'

describe('Date Utils - Core Functions', () => {
  describe('getCurrentDate', () => {
    it('should return current date in YYYY-MM-DD format', () => {
      const result = getCurrentDate()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      // Should be today's date in local timezone
      const now = new Date()
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      expect(result).toBe(expected)
    })
  })

  describe('toUTCDateString', () => {
    it('should convert Date object to YYYY-MM-DD string', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = toUTCDateString(date)
      expect(result).toBe('2024-01-15')
    })

    it('should convert date string to YYYY-MM-DD string', () => {
      const result = toUTCDateString('2024-01-15')
      expect(result).toBe('2024-01-15')
    })

    it('should handle timezone differences consistently', () => {
      // Test with different timezone inputs
      const utcDate = new Date('2024-01-15T00:00:00Z')
      const localDate = new Date('2024-01-15T23:59:59-05:00') // EST

      expect(toUTCDateString(utcDate)).toBe('2024-01-15')
      expect(toUTCDateString(localDate)).toBe('2024-01-16') // Next day in UTC
    })
  })

  describe('toUTCMidnight', () => {
    it('should convert any date to UTC midnight', () => {
      const date = new Date('2024-01-15T15:30:45.123Z')
      const result = toUTCMidnight(date)

      expect(result.getUTCHours()).toBe(0)
      expect(result.getUTCMinutes()).toBe(0)
      expect(result.getUTCSeconds()).toBe(0)
      expect(result.getUTCMilliseconds()).toBe(0)
      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(0) // January
      expect(result.getUTCDate()).toBe(15)
    })

    it('should handle string input', () => {
      const result = toUTCMidnight('2024-01-15')
      expect(result.getUTCHours()).toBe(0)
      expect(result.getUTCMinutes()).toBe(0)
      expect(result.getUTCSeconds()).toBe(0)
    })
  })
})

describe('Date Utils - Validation', () => {
  describe('isValidDateString', () => {
    it('should validate correct date strings', () => {
      expect(isValidDateString('2024-01-15')).toBe(true)
      expect(isValidDateString('2024-12-31')).toBe(true)
      expect(isValidDateString('2024-02-29')).toBe(true) // Leap year
    })

    it('should reject invalid date strings', () => {
      expect(isValidDateString('invalid')).toBe(false)
      expect(isValidDateString('2024-13-01')).toBe(false) // Invalid month
      expect(isValidDateString('2024-02-30')).toBe(false) // Invalid day
      expect(isValidDateString('')).toBe(false)
      expect(isValidDateString('2023-02-29')).toBe(false) // Not a leap year
    })
  })

  describe('testDateConsistency', () => {
    it('should return true for consistent dates', () => {
      const original = '2024-01-15'
      const stored = new Date('2024-01-15T00:00:00Z')
      expect(testDateConsistency(original, stored)).toBe(true)
    })

    it('should return false for inconsistent dates', () => {
      const original = '2024-01-15'
      const stored = '2024-01-16'
      expect(testDateConsistency(original, stored)).toBe(false)
    })
  })

  describe('validateDateConsistency', () => {
    it('should provide detailed consistency validation', () => {
      const original = '2024-01-15'
      const processed = new Date('2024-01-15T00:00:00Z')

      const result = validateDateConsistency('test operation', original, processed)

      expect(result.isConsistent).toBe(true)
      expect(result.originalUTC).toBe('2024-01-15')
      expect(result.processedUTC).toBe('2024-01-15')
      expect(result.operation).toBe('test operation')
      expect(result.details).toContain('Date consistency maintained')
    })

    it('should detect inconsistencies', () => {
      const original = '2024-01-15'
      const processed = '2024-01-16'

      const result = validateDateConsistency('test operation', original, processed)

      expect(result.isConsistent).toBe(false)
      expect(result.details).toContain('Date inconsistency detected')
      expect(result.details).toContain('2024-01-15 != 2024-01-16')
    })
  })
})

describe('Date Utils - Formatting', () => {
  describe('formatDateForDisplay', () => {
    it('should format dates for user display', () => {
      expect(formatDateForDisplay('2024-01-15')).toBe('Jan 15, 2024')
      expect(formatDateForDisplay('2024-12-31')).toBe('Dec 31, 2024')
      expect(formatDateForDisplay(new Date('2024-06-01T00:00:00Z'))).toBe('Jun 1, 2024')
    })

    it('should handle invalid dates gracefully', () => {
      expect(formatDateForDisplay('invalid')).toBe('Invalid Date')
    })
  })

  describe('formatDateString', () => {
    it('should format dates as "Mon YYYY"', () => {
      expect(formatDateString('2024-01-15')).toBe('Jan 2024')
      expect(formatDateString('2024-12-31')).toBe('Dec 2024')
    })

    it('should handle invalid dates gracefully', () => {
      expect(formatDateString('invalid')).toBe('Invalid Date')
    })
  })

  describe('formatDateStringByPeriod', () => {
    it('should format quarterly periods correctly', () => {
      expect(formatDateStringByPeriod('2024-01-15', 'quarterly')).toBe('Q1 2024')
      expect(formatDateStringByPeriod('2024-04-15', 'quarterly')).toBe('Q2 2024')
      expect(formatDateStringByPeriod('2024-07-15', 'quarterly')).toBe('Q3 2024')
      expect(formatDateStringByPeriod('2024-10-15', 'quarterly')).toBe('Q4 2024')
    })

    it('should format non-quarterly periods as month/year', () => {
      expect(formatDateStringByPeriod('2024-01-15', 'monthly')).toBe('Jan 2024')
      expect(formatDateStringByPeriod('2024-06-15', 'weekly')).toBe('Jun 2024')
    })
  })
})

describe('Date Utils - Comparisons', () => {
  describe('isSameDay', () => {
    it('should correctly identify same days', () => {
      expect(isSameDay('2024-01-15', '2024-01-15')).toBe(true)
      expect(isSameDay('2024-01-15', new Date('2024-01-15T10:30:00Z'))).toBe(true)
    })

    it('should correctly identify different days', () => {
      expect(isSameDay('2024-01-15', '2024-01-16')).toBe(false)
      expect(isSameDay('2024-01-15', '2023-01-15')).toBe(false)
    })
  })

  describe('isPast and isFuture', () => {
    it('should correctly identify past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayString = toUTCDateString(yesterday)

      expect(isPast(yesterdayString)).toBe(true)
    })

    it('should correctly identify future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = toUTCDateString(tomorrow)

      expect(isFuture(tomorrowString)).toBe(true)
    })
  })
})

describe('Date Utils - Date Arithmetic', () => {
  describe('addDays and subtractDays', () => {
    it('should add days correctly', () => {
      const result = addDays('2024-01-15', 5)
      expect(toUTCDateString(result)).toBe('2024-01-20')
    })

    it('should subtract days correctly', () => {
      const result = subtractDays('2024-01-15', 5)
      expect(toUTCDateString(result)).toBe('2024-01-10')
    })

    it('should handle month boundaries', () => {
      const result = addDays('2024-01-31', 1)
      expect(toUTCDateString(result)).toBe('2024-02-01')
    })

    it('should handle year boundaries', () => {
      const result = addDays('2023-12-31', 1)
      expect(toUTCDateString(result)).toBe('2024-01-01')
    })
  })

  describe('getOneDayBefore and getOneDayAfter', () => {
    it('should get one day before', () => {
      const result = getOneDayBefore('2024-01-15')
      expect(toUTCDateString(result)).toBe('2024-01-14')
    })

    it('should get one day after', () => {
      const result = getOneDayAfter('2024-01-15')
      expect(toUTCDateString(result)).toBe('2024-01-16')
    })
  })

  describe('addHours and subtractHours', () => {
    it('should add hours correctly', () => {
      const baseDate = toUTCMidnight('2024-01-15')
      const result = addHours(baseDate, 5)
      expect(result.getUTCHours()).toBe(5)
    })

    it('should subtract hours correctly', () => {
      const baseDate = addHours('2024-01-15', 10)
      const result = subtractHours(baseDate, 3)
      expect(result.getUTCHours()).toBe(7)
    })
  })
})

describe('Date Utils - Range Generation', () => {
  describe('generateDateRange', () => {
    it('should generate date range correctly', () => {
      const start = '2024-01-15'
      const end = '2024-01-17'
      const range = generateDateRange(start, end)

      expect(range).toHaveLength(3)
      expect(toUTCDateString(range[0])).toBe('2024-01-15')
      expect(toUTCDateString(range[1])).toBe('2024-01-16')
      expect(toUTCDateString(range[2])).toBe('2024-01-17')
    })

    it('should handle single day range', () => {
      const date = '2024-01-15'
      const range = generateDateRange(date, date)

      expect(range).toHaveLength(1)
      expect(toUTCDateString(range[0])).toBe('2024-01-15')
    })

    it('should handle month boundaries', () => {
      const start = '2024-01-30'
      const end = '2024-02-02'
      const range = generateDateRange(start, end)

      expect(range).toHaveLength(4)
      expect(toUTCDateString(range[0])).toBe('2024-01-30')
      expect(toUTCDateString(range[1])).toBe('2024-01-31')
      expect(toUTCDateString(range[2])).toBe('2024-02-01')
      expect(toUTCDateString(range[3])).toBe('2024-02-02')
    })
  })
})

describe('Date Utils - UTC Date Creation', () => {
  describe('createUTCDate', () => {
    it('should create UTC dates correctly', () => {
      const date = createUTCDate(2024, 0, 15) // January 15, 2024
      expect(date.getUTCFullYear()).toBe(2024)
      expect(date.getUTCMonth()).toBe(0)
      expect(date.getUTCDate()).toBe(15)
      expect(date.getUTCHours()).toBe(0)
    })

    it('should handle time components', () => {
      const date = createUTCDate(2024, 0, 15, 10, 30, 45)
      expect(date.getUTCHours()).toBe(10)
      expect(date.getUTCMinutes()).toBe(30)
      expect(date.getUTCSeconds()).toBe(45)
    })
  })

  describe('createStartOfMonth and createEndOfMonth', () => {
    it('should create start of month correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const startOfMonth = createStartOfMonth(date)

      expect(toUTCDateString(startOfMonth)).toBe('2024-01-01')
      expect(startOfMonth.getUTCHours()).toBe(0)
    })

    it('should create end of month correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const endOfMonth = createEndOfMonth(date)

      expect(toUTCDateString(endOfMonth)).toBe('2024-01-31')
    })

    it('should handle February in leap year', () => {
      const date = new Date('2024-02-15T10:30:00Z') // 2024 is a leap year
      const endOfMonth = createEndOfMonth(date)

      expect(toUTCDateString(endOfMonth)).toBe('2024-02-29')
    })

    it('should handle February in non-leap year', () => {
      const date = new Date('2023-02-15T10:30:00Z') // 2023 is not a leap year
      const endOfMonth = createEndOfMonth(date)

      expect(toUTCDateString(endOfMonth)).toBe('2023-02-28')
    })
  })
})

describe('Date Utils - Timezone and Debugging', () => {
  describe('getTimezoneInfo', () => {
    it('should provide comprehensive timezone information', () => {
      const date = '2024-01-15'
      const info = getTimezoneInfo(date)

      expect(info).toHaveProperty('original')
      expect(info).toHaveProperty('utcString')
      expect(info).toHaveProperty('utcDate')
      expect(info).toHaveProperty('timezoneOffset')
      expect(info).toHaveProperty('isDST')

      expect(info.utcString).toBe('2024-01-15')
      expect(typeof info.timezoneOffset).toBe('number')
      expect(typeof info.isDST).toBe('boolean')
    })
  })

  describe('getUserTimezone', () => {
    it('should return a valid timezone string', () => {
      const timezone = getUserTimezone()
      expect(typeof timezone).toBe('string')
      expect(timezone.length).toBeGreaterThan(0)
    })
  })
})

describe('Date Utils - Error Handling', () => {
  it('should throw errors for invalid date strings in createDate', () => {
    expect(() => {
      parseAndConvertToUTC('invalid-date')
    }).toThrow('Invalid date string: invalid-date')
  })

  it('should handle edge cases gracefully', () => {
    // Test with extreme dates
    expect(isValidDateString('1900-01-01')).toBe(true)
    expect(isValidDateString('2100-12-31')).toBe(true)

    // Test with boundary conditions
    expect(isValidDateString('2024-02-29')).toBe(true) // Leap year
    expect(isValidDateString('2023-02-29')).toBe(false) // Not leap year
  })
})

describe('Date Utils - Performance', () => {
  it('should perform common operations quickly', () => {
    const iterations = 1000
    const startTime = performance.now()

    for (let i = 0; i < iterations; i++) {
      getCurrentDate()
      toUTCDateString(new Date())
      formatDateForDisplay('2024-01-15')
      isValidDateString('2024-01-15')
    }

    const endTime = performance.now()
    const totalTime = endTime - startTime

    // Should complete 1000 operations in less than 100ms
    expect(totalTime).toBeLessThan(100)
  })
})

describe('Date Utils - Real-world Scenarios', () => {
  it('should handle transaction date consistency scenario', () => {
    // Simulate user adding a transaction
    const userInputDate = '2024-01-15'

    // Simulate storing in database (convert to Date object)
    const storedDate = toUTCMidnight(userInputDate)

    // Simulate retrieving from database and displaying
    const retrievedDateString = toUTCDateString(storedDate)
    const displayDate = formatDateForDisplay(retrievedDateString)

    // Verify consistency
    expect(retrievedDateString).toBe(userInputDate)
    expect(displayDate).toBe('Jan 15, 2024')
    expect(testDateConsistency(userInputDate, storedDate)).toBe(true)
  })

  it('should handle form default date scenario', () => {
    // Simulate form initialization
    const defaultDate = getCurrentDate()

    // Should be in YYYY-MM-DD format for HTML date input
    expect(defaultDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    // Should be valid
    expect(isValidDateString(defaultDate)).toBe(true)

    // Should be today
    const now = new Date()
    const expectedToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(defaultDate).toBe(expectedToday)
  })

  it('should handle balance calculation date range scenario', () => {
    // Simulate balance calculation for a date range
    const startDate = '2024-01-01'
    const endDate = '2024-01-31'

    const dateRange = generateDateRange(startDate, endDate)

    // Should include all days in January 2024
    expect(dateRange).toHaveLength(31)
    expect(toUTCDateString(dateRange[0])).toBe('2024-01-01')
    expect(toUTCDateString(dateRange[30])).toBe('2024-01-31')

    // All dates should be valid and consistent
    dateRange.forEach(date => {
      const dateString = toUTCDateString(date)
      expect(isValidDateString(dateString)).toBe(true)
    })
  })
})

describe('Date Utils - Timezone Edge Cases', () => {
  it('should handle Daylight Saving Time transitions', () => {
    // Test dates around DST transitions (varies by timezone, but test the logic)
    const springForward = '2024-03-10' // Typical DST start in US
    const fallBack = '2024-11-03' // Typical DST end in US

    expect(isValidDateString(springForward)).toBe(true)
    expect(isValidDateString(fallBack)).toBe(true)

    // Date arithmetic should work correctly across DST
    const dayAfterSpring = addDays(springForward, 1)
    const dayAfterFall = addDays(fallBack, 1)

    expect(toUTCDateString(dayAfterSpring)).toBe('2024-03-11')
    expect(toUTCDateString(dayAfterFall)).toBe('2024-11-04')
  })

  it('should handle year boundaries correctly', () => {
    const newYearsEve = '2023-12-31'
    const newYearsDay = '2024-01-01'

    expect(getOneDayAfter(newYearsEve)).toEqual(toUTCMidnight(newYearsDay))
    expect(getOneDayBefore(newYearsDay)).toEqual(toUTCMidnight(newYearsEve))
  })

  it('should handle leap year boundaries', () => {
    const leapDay = '2024-02-29'
    const dayBefore = '2024-02-28'
    const dayAfter = '2024-03-01'

    expect(isValidDateString(leapDay)).toBe(true)
    expect(toUTCDateString(getOneDayBefore(leapDay))).toBe(dayBefore)
    expect(toUTCDateString(getOneDayAfter(leapDay))).toBe(dayAfter)
  })
})
