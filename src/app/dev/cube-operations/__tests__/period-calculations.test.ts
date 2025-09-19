import { toUTCDateString, createUTCDate } from '@/lib/utils/date-utils';

// Mock getCurrentDate for testing
const mockGetCurrentDate = jest.fn();

// Extract the function for testing with injectable getCurrentDate
const getDateRangeFromPeriods = (type: string, count: number, mockToday?: Date) => {
  const today = mockToday || createUTCDate(2024, 8, 16); // Default fallback
  const endDate = mockGetCurrentDate(); // End is always today
  const startDateObj = createUTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  switch (type) {
    case 'WEEKLY':
      // Go back to start of the week N weeks ago
      const currentDayOfWeek = today.getUTCDay();
      const daysToStartOfWeek = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Monday = 0
      startDateObj.setUTCDate(today.getUTCDate() - daysToStartOfWeek - ((count - 1) * 7));
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    case 'BI_WEEKLY':
      // Go back to start of the bi-week N bi-weeks ago
      const currentDay = today.getUTCDay();
      const daysToStartOfBiWeek = currentDay === 0 ? 6 : currentDay - 1;
      startDateObj.setUTCDate(today.getUTCDate() - daysToStartOfBiWeek - ((count - 1) * 14));
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    case 'MONTHLY':
      // Go back to 1st of the month N months ago
      startDateObj.setUTCFullYear(today.getUTCFullYear(), today.getUTCMonth() - count + 1, 1);
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    case 'QUARTERLY':
      // Go back to start of quarter N quarters ago
      const currentQuarter = Math.floor(today.getUTCMonth() / 3);
      const targetQuarter = currentQuarter - count + 1;
      const targetYear = today.getUTCFullYear() + Math.floor(targetQuarter / 4);
      const targetMonth = ((targetQuarter % 4) + 4) % 4 * 3;
      startDateObj.setUTCFullYear(targetYear, targetMonth, 1);
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    case 'BI_ANNUALLY':
      // Go back to start of 6-month period N periods ago
      const currentHalf = Math.floor(today.getUTCMonth() / 6);
      const targetHalf = currentHalf - count + 1;
      const targetYearBi = today.getUTCFullYear() + Math.floor(targetHalf / 2);
      const targetMonthBi = ((targetHalf % 2) + 2) % 2 * 6;
      startDateObj.setUTCFullYear(targetYearBi, targetMonthBi, 1);
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    case 'ANNUALLY':
      // Go back to January 1st N years ago
      startDateObj.setUTCFullYear(today.getUTCFullYear() - count + 1, 0, 1);
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    default:
      // Default to monthly
      startDateObj.setUTCFullYear(today.getUTCFullYear(), today.getUTCMonth() - count + 1, 1);
      startDateObj.setUTCHours(0, 0, 0, 0);
  }

  const startDate = toUTCDateString(startDateObj);
  return { startDate, endDate };
};

describe('getDateRangeFromPeriods', () => {
  // Mock a specific date for consistent testing
  const mockToday = createUTCDate(2024, 8, 16); // Monday, Sept 16, 2024 (month is 0-indexed)

  beforeEach(() => {
    // Mock getCurrentDate to return our mock date string
    mockGetCurrentDate.mockReturnValue('2024-09-16');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MONTHLY periods', () => {
    it('should calculate 6 months correctly (Apr 1 - Sept 16)', () => {
      const result = getDateRangeFromPeriods('MONTHLY', 6, mockToday);

      expect(result.startDate).toBe('2024-04-01');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 3 months correctly (July 1 - Sept 16)', () => {
      const result = getDateRangeFromPeriods('MONTHLY', 3, mockToday);

      expect(result.startDate).toBe('2024-07-01');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 12 months correctly (Oct 1, 2023 - Sept 16, 2024)', () => {
      const result = getDateRangeFromPeriods('MONTHLY', 12, mockToday);

      expect(result.startDate).toBe('2023-10-01');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 1 month correctly (Sept 1 - Sept 16)', () => {
      const result = getDateRangeFromPeriods('MONTHLY', 1, mockToday);

      expect(result.startDate).toBe('2024-09-01');
      expect(result.endDate).toBe('2024-09-16');
    });
  });

  describe('QUARTERLY periods', () => {
    it('should calculate 2 quarters correctly (Apr 1 - Sept 16)', () => {
      // Q2 (Apr-Jun) + Q3 (Jul-Sep)
      const result = getDateRangeFromPeriods('QUARTERLY', 2, mockToday);

      expect(result.startDate).toBe('2024-04-01');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 1 quarter correctly (July 1 - Sept 16)', () => {
      // Current Q3 (Jul-Sep)
      const result = getDateRangeFromPeriods('QUARTERLY', 1, mockToday);

      expect(result.startDate).toBe('2024-07-01');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 4 quarters correctly (Oct 1, 2023 - Sept 16, 2024)', () => {
      // Q4 2023 + Q1,Q2,Q3 2024
      const result = getDateRangeFromPeriods('QUARTERLY', 4, mockToday);

      expect(result.startDate).toBe('2023-10-01');
      expect(result.endDate).toBe('2024-09-16');
    });
  });

  describe('BI_ANNUALLY periods', () => {
    it('should calculate 1 bi-annual period correctly (July 1 - Sept 16)', () => {
      // Current H2 (Jul-Dec)
      const result = getDateRangeFromPeriods('BI_ANNUALLY', 1, mockToday);

      expect(result.startDate).toBe('2024-07-01');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 2 bi-annual periods correctly (Jan 1 - Sept 16)', () => {
      // H1 (Jan-Jun) + H2 (Jul-Dec)
      const result = getDateRangeFromPeriods('BI_ANNUALLY', 2, mockToday);

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 3 bi-annual periods correctly (July 1, 2023 - Sept 16, 2024)', () => {
      // H2 2023 + H1 2024 + H2 2024
      const result = getDateRangeFromPeriods('BI_ANNUALLY', 3, mockToday);

      expect(result.startDate).toBe('2023-07-01');
      expect(result.endDate).toBe('2024-09-16');
    });
  });

  describe('ANNUALLY periods', () => {
    it('should calculate 1 year correctly (Jan 1, 2024 - Sept 16, 2024)', () => {
      const result = getDateRangeFromPeriods('ANNUALLY', 1, mockToday);

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 2 years correctly (Jan 1, 2023 - Sept 16, 2024)', () => {
      const result = getDateRangeFromPeriods('ANNUALLY', 2, mockToday);

      expect(result.startDate).toBe('2023-01-01');
      expect(result.endDate).toBe('2024-09-16');
    });
  });

  describe('WEEKLY periods', () => {
    it('should calculate 4 weeks correctly (start of week 4 weeks ago)', () => {
      // Sept 16 is a Monday, 4 complete weeks back should be Aug 26 (Monday)
      // Weeks: Sep 16-22, Sep 9-15, Sep 2-8, Aug 26-Sep 1
      const result = getDateRangeFromPeriods('WEEKLY', 4, mockToday);

      expect(result.startDate).toBe('2024-08-26');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 1 week correctly (start of current week)', () => {
      // Sept 16 is a Monday, so start of week is Sept 16
      const result = getDateRangeFromPeriods('WEEKLY', 1, mockToday);

      expect(result.startDate).toBe('2024-09-16');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 12 weeks correctly (start of week 12 weeks ago)', () => {
      // 12 complete weeks back from Sept 16 (Monday) should be July 1 (Monday)
      // 12 weeks * 7 days = 84 days back from Sept 16 = July 1
      const result = getDateRangeFromPeriods('WEEKLY', 12, mockToday);

      expect(result.startDate).toBe('2024-07-01');
      expect(result.endDate).toBe('2024-09-16');
    });
  });

  describe('BI_WEEKLY periods', () => {
    it('should calculate 3 bi-weekly periods correctly', () => {
      // 3 complete bi-weeks back from Sept 16 (Monday) should be Aug 19 (Monday)
      // Bi-weeks: Sep 16-29, Sep 2-15, Aug 19-Sep 1
      const result = getDateRangeFromPeriods('BI_WEEKLY', 3, mockToday);

      expect(result.startDate).toBe('2024-08-19');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should calculate 1 bi-weekly period correctly', () => {
      // Current bi-week starts Sept 16 (Monday)
      const result = getDateRangeFromPeriods('BI_WEEKLY', 1, mockToday);

      expect(result.startDate).toBe('2024-09-16');
      expect(result.endDate).toBe('2024-09-16');
    });
  });

  describe('Edge cases', () => {
    it('should handle default case (unknown period type) as MONTHLY', () => {
      const result = getDateRangeFromPeriods('UNKNOWN', 6, mockToday);

      expect(result.startDate).toBe('2024-04-01');
      expect(result.endDate).toBe('2024-09-16');
    });

    it('should handle zero periods', () => {
      const result = getDateRangeFromPeriods('MONTHLY', 0, mockToday);

      // 0 periods should start from current month
      expect(result.startDate).toBe('2024-10-01'); // Next month
      expect(result.endDate).toBe('2024-09-16');
    });
  });
});
