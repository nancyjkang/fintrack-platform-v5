/**
 * Timezone and Date Utility Functions - FinTrack v5
 *
 * This module provides consistent date handling across the application.
 * All dates are stored and processed in UTC to avoid timezone issues.
 *
 * Key features:
 * - Eliminated duplicate UTC component extraction code
 * - Consolidated date string conversion patterns
 * - Reduced repeated toUTCMidnight calls
 * - Maintained all existing functionality
 * - Ported from v4.1 with v5 compatibility
 */

/**
 * Private helper function to create Date objects
 * This is used internally to avoid direct new Date() calls
 */
function createDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

/**
 * Private helper function to create Date objects from timestamps
 */
function createDateFromTimestamp(timestamp: number): Date {
  return new Date(timestamp);
}

/**
 * Private helper function to create Date objects from UTC components
 */
function createDateFromUTC(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0, millisecond: number = 0): Date {
  return new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));
}

/**
 * Create a date from UTC components (public function)
 * This is the safe way to create dates instead of using new Date()
 */
export function createUTCDate(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0, millisecond: number = 0): Date {
  return createDateFromUTC(year, month, day, hour, minute, second, millisecond);
}

/**
 * Create start of month date in UTC
 */
export function createStartOfMonth(date: Date): Date {
  const { year, month } = extractUTCDateComponents(date);
  return createDateFromUTC(year, month, 1, 0, 0, 0, 0);
}

/**
 * Create end of month date in UTC
 */
export function createEndOfMonth(date: Date): Date {
  const { year, month } = extractUTCDateComponents(date);
  return createDateFromUTC(year, month + 1, 0, 0, 0, 0, 0);
}

/**
 * Private helper function to create Date objects by copying existing ones
 */
function copyDate(baseDate: Date): Date {
  return new Date(baseDate.getTime());
}

/**
 * Private helper function to create Date objects with time offset
 */
function createDateWithOffset(baseDate: Date, offsetMs: number): Date {
  return new Date(baseDate.getTime() + offsetMs);
}

/**
 * PRIVATE: Extract UTC components from a date
 * This eliminates the duplicate code pattern of:
 * const year = dateObj.getUTCFullYear();
 * const month = dateObj.getUTCMonth();
 * const day = dateObj.getUTCDate();
 */
function extractUTCDateComponents(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate()
  };
}

/**
 * PRIVATE: Normalize input to Date object
 * This eliminates the duplicate pattern of:
 * const baseDate = typeof date === 'string' ? createDate(date) : date;
 */
function normalizeToDate(input: Date | string): Date {
  return typeof input === 'string' ? createDate(input) : input;
}

/**
 * PRIVATE: Normalize input to UTC midnight Date
 * This eliminates the duplicate pattern of:
 * const baseDate = typeof date === 'string' ? toUTCMidnight(date) : date;
 */
function normalizeToUTCMidnight(input: Date | string): Date {
  return typeof input === 'string' ? toUTCMidnight(input) : input;
}

/**
 * Convert any date to UTC midnight
 * This ensures consistent date handling across the application
 */
export function toUTCMidnight(date: Date | string): Date {
  const baseDate = normalizeToDate(date);
  const { year, month, day } = extractUTCDateComponents(baseDate);
  return createDateFromUTC(year, month, day, 0, 0, 0, 0);
}

/**
 * Convert a date to a UTC date string (YYYY-MM-DD format)
 * This is useful for database queries and date comparisons
 */
export function toUTCDateString(date: Date | string): string {
  const inputDate = typeof date === 'string' ? toUTCMidnight(date) : date;
  const { year, month, day } = extractUTCDateComponents(inputDate);
  const monthStr = String(month + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Get current date in UTC
 * This is the main function to use instead of new Date()
 */
export function getCurrentUTCDate(): Date {
  const timestamp = Date.now();
  const date = createDateFromTimestamp(timestamp);
  return toUTCMidnight(date);
}

/**
 * Get the current date string in UTC (YYYY-MM-DD format)
 */
export function getCurrentUTCDateString(): string {
  return toUTCDateString(getCurrentUTCDate());
}

/**
 * Get current local date as YYYY-MM-DD string
 * This uses the user's local timezone, which is more intuitive for date inputs
 *
 * V5 UPDATE: This is the preferred function for form defaults and user inputs
 * as it matches what users expect when they see "today's date"
 */
export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Alias for getCurrentDate() for backward compatibility
 */
export const getCurrentLocalDateString = getCurrentDate;

/**
 * Validate that a date string is in a valid format
 */
export function isValidDateString(dateString: string): boolean {
  try {
    // First check basic format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return false;
    }

    // Parse the components
    const [year, month, day] = dateString.split('-').map(Number);

    // Create a date and check if it matches the input
    // This catches cases like 2024-02-30 which JS converts to 2024-03-01
    const date = new Date(year, month - 1, day); // month is 0-indexed in JS

    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
  } catch {
    return false;
  }
}

/**
 * Parse a date string and convert it to UTC
 * Useful for handling user input or external data
 */
export function parseAndConvertToUTC(dateString: string): Date {
  const date = createDate(dateString);
  return toUTCMidnight(date);
}

/**
 * Parse YYYY-MM-DD date string to Date object for database queries
 * @param dateString - Date in YYYY-MM-DD format
 * @param endOfDay - If true, set to end of day (23:59:59.999)
 * @returns Date object in UTC
 */
export function parseDateStringForDB(dateString: string, endOfDay: boolean = false): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return createUTCDate(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
}

/**
 * Format a date for user display
 * This function safely handles date strings and Date objects
 * and formats them for user consumption
 */
export function formatDateForDisplay(date: Date | string): string {
  try {
    const dateObj = normalizeToDate(date);
    const { year, month, day } = extractUTCDateComponents(dateObj);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${monthNames[month]} ${day}, ${year}`;
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format a date string to "Mar 2024" format (month and year only)
 * This function safely handles date strings and Date objects
 * and formats them for chart labels and period displays
 */
export function formatDateString(date: Date | string): string {
  try {
    const dateObj = normalizeToDate(date);
    return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format date string based on breakdown period
 * For quarterly periods, shows Q1, Q2, Q3, Q4 format
 * For other periods, shows month and year
 */
export function formatDateStringByPeriod(date: Date | string, breakdownPeriod: string): string {
  try {
    const dateObj = normalizeToDate(date);

    if (breakdownPeriod === 'quarterly') {
      const month = dateObj.getUTCMonth();
      const quarter = Math.floor(month / 3) + 1;
      const year = dateObj.getUTCFullYear();
      return `Q${quarter} ${year}`;
    }

    // Default to month + year format for other periods
    return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Generate an array of dates between start and end dates (inclusive)
 * Each date is set to UTC midnight for consistency
 */
export function generateDateRange(startDate: Date | string, endDate: Date | string): Date[] {
  const start = toUTCMidnight(startDate);
  const end = toUTCMidnight(endDate);

  const dates: Date[] = [];
  const currentDate = copyDate(start); // Use copyDate to avoid mutating the original

  while (currentDate <= end) {
    dates.push(copyDate(currentDate)); // Copy each date to avoid reference issues
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Get the date that is one day before the given date
 */
export function getOneDayBefore(date: Date | string): Date {
  const inputDate = toUTCMidnight(date);
  const oneDayBefore = copyDate(inputDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  return oneDayBefore;
}

/**
 * Get the date that is one day after the given date
 */
export function getOneDayAfter(date: Date | string): Date {
  const inputDate = toUTCMidnight(date);
  const oneDayAfter = copyDate(inputDate);
  oneDayAfter.setDate(oneDayAfter.getDate() + 1);
  return oneDayAfter;
}

/**
 * Get the user's timezone from the browser or system
 */
export function getUserTimezone(): string {
  if (typeof Intl !== 'undefined') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return 'UTC';
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const utc1 = toUTCDateString(date1);
  const utc2 = toUTCDateString(date2);
  return utc1 === utc2;
}

/**
 * Check if a date is today (in UTC)
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(date, getCurrentUTCDate());
}

/**
 * Check if a date is in the past (before today in UTC)
 */
export function isPast(date: Date | string): boolean {
  const utcDate = toUTCDateString(date);
  const today = getCurrentUTCDateString();
  return utcDate < today;
}

/**
 * Check if a date is in the future (after today in UTC)
 */
export function isFuture(date: Date | string): boolean {
  const utcDate = toUTCDateString(date);
  const today = getCurrentUTCDateString();
  return utcDate > today;
}

/**
 * Test date consistency between storage and retrieval
 */
export function testDateConsistency(originalDate: Date | string, storedDate: Date | string): boolean {
  const originalUTC = toUTCDateString(originalDate);
  const storedUTC = toUTCDateString(storedDate);
  return originalUTC === storedUTC;
}

/**
 * Validate that a date operation maintains consistency
 */
export function validateDateConsistency(
  operation: string,
  originalDate: Date | string,
  processedDate: Date | string
): {
  isConsistent: boolean;
  originalUTC: string;
  processedUTC: string;
  operation: string;
  details: string;
} {
  const originalUTC = toUTCDateString(originalDate);
  const processedUTC = toUTCDateString(processedDate);
  const isConsistent = originalUTC === processedUTC;

  return {
    isConsistent,
    originalUTC,
    processedUTC,
    operation,
    details: isConsistent
      ? `Date consistency maintained for ${operation}`
      : `Date inconsistency detected for ${operation}: ${originalUTC} != ${processedUTC}`
  };
}

/**
 * Get detailed timezone information for debugging
 */
export function getTimezoneInfo(date: Date | string): {
  original: string;
  utcString: string;
  utcDate: Date;
  timezoneOffset: number;
  isDST: boolean;
} {
  const inputDate = normalizeToUTCMidnight(date);
  const utcString = toUTCDateString(inputDate);
  const utcDate = copyDate(inputDate);

  return {
    original: inputDate.toString(),
    utcString,
    utcDate,
    timezoneOffset: inputDate.getTimezoneOffset(),
    isDST: isDST(inputDate)
  };
}

/**
 * Check if a date is in Daylight Saving Time
 */
function isDST(date: Date): boolean {
  const jan = toUTCMidnight(`${date.getFullYear()}-01-01`);
  const jul = toUTCMidnight(`${date.getFullYear()}-07-01`);
  return Math.min(jan.getTimezoneOffset(), jul.getTimezoneOffset()) === date.getTimezoneOffset();
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const baseDate = normalizeToUTCMidnight(date);
  const newDate = createDateWithOffset(baseDate, days * 24 * 60 * 60 * 1000);
  return toUTCMidnight(newDate);
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: Date | string, days: number): Date {
  return addDays(date, -days);
}

/**
 * Get a date that is a specific number of days before today
 */
export function getDaysAgo(days: number): Date {
  return subtractDays(getCurrentUTCDate(), days);
}

/**
 * Get a date that is a specific number of days after today
 */
export function getDaysFromNow(days: number): Date {
  return addDays(getCurrentUTCDate(), days);
}

/**
 * Add hours to a date
 */
export function addHours(date: Date | string, hours: number): Date {
  const baseDate = normalizeToUTCMidnight(date);
  const result = copyDate(baseDate);
  result.setUTCHours(result.getUTCHours() + hours);
  return result;
}

/**
 * Subtract hours from a date
 */
export function subtractHours(date: Date | string, hours: number): Date {
  const baseDate = normalizeToUTCMidnight(date);
  const result = copyDate(baseDate);
  result.setUTCHours(result.getUTCHours() - hours);
  return result;
}

/**
 * Convert a date to ISO string format
 */
export function toISOString(date: Date | string): string {
  const inputDate = normalizeToUTCMidnight(date);
  return inputDate.toISOString();
}

/**
 * Get current time string for display purposes
 * This is the safe way to get time strings instead of using new Date().toLocaleTimeString()
 */
export function getCurrentTimeString(): string {
  const timestamp = Date.now();
  const date = createDateFromTimestamp(timestamp);
  return date.toLocaleTimeString();
}

/**
 * Backward compatibility aliases
 */
export const getDateKey = toUTCDateString;
