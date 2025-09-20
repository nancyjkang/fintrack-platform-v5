'use client';

import { Calendar } from 'lucide-react';
import { getCurrentUTCDate, subtractDays, toUTCDateString, addDays, createUTCDate } from '@/lib/utils/date-utils';
import type { BalanceHistoryFilters as FilterType } from '@/types/balance-history';

interface BalanceHistoryFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: Partial<FilterType>) => void;
  loading?: boolean;
  timePeriod?: string;
  onTimePeriodChange?: (timePeriod: string) => void;
}

const DATE_RANGE_OPTIONS = [
  { value: '', label: 'All time' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'this-week', label: 'This week' },
  { value: 'last-week', label: 'Last week' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'this-quarter', label: 'This quarter' },
  { value: 'last-quarter', label: 'Last quarter' },
  { value: 'this-half', label: 'This half' },
  { value: 'last-half', label: 'Last half' },
  { value: 'this-year', label: 'This year' },
  { value: 'last-year', label: 'Last year' }
];

export function BalanceHistoryFilters({
  filters,
  onFiltersChange,
  loading = false,
  timePeriod = '',
  onTimePeriodChange
}: BalanceHistoryFiltersProps) {

  const getDateRange = (value: string) => {
    const today = getCurrentUTCDate();
    let startDate = '';
    let endDate = toUTCDateString(today);

    switch (value) {
      case 'last-30-days': {
        const thirtyDaysAgo = subtractDays(today, 30);
        startDate = toUTCDateString(thirtyDaysAgo);
        break;
      }
      case 'this-week': {
        const startOfWeek = subtractDays(today, today.getUTCDay());
        startDate = toUTCDateString(startOfWeek);
        break;
      }
      case 'last-week': {
        const startOfLastWeek = subtractDays(today, today.getUTCDay() + 7);
        const endOfLastWeek = addDays(startOfLastWeek, 6);
        startDate = toUTCDateString(startOfLastWeek);
        endDate = toUTCDateString(endOfLastWeek);
        break;
      }
      case 'this-month': {
        const startOfMonth = createUTCDate(today.getUTCFullYear(), today.getUTCMonth(), 1);
        startDate = toUTCDateString(startOfMonth);
        break;
      }
      case 'last-month': {
        const startOfLastMonth = createUTCDate(today.getUTCFullYear(), today.getUTCMonth() - 1, 1);
        const endOfLastMonth = createUTCDate(today.getUTCFullYear(), today.getUTCMonth(), 0);
        startDate = toUTCDateString(startOfLastMonth);
        endDate = toUTCDateString(endOfLastMonth);
        break;
      }
      case 'this-quarter': {
        const quarter = Math.floor(today.getUTCMonth() / 3);
        const startOfQuarter = createUTCDate(today.getUTCFullYear(), quarter * 3, 1);
        startDate = toUTCDateString(startOfQuarter);
        break;
      }
      case 'last-quarter': {
        const quarter = Math.floor(today.getUTCMonth() / 3);
        const startOfLastQuarter = createUTCDate(today.getUTCFullYear(), (quarter - 1) * 3, 1);
        const endOfLastQuarter = createUTCDate(today.getUTCFullYear(), quarter * 3, 0);
        startDate = toUTCDateString(startOfLastQuarter);
        endDate = toUTCDateString(endOfLastQuarter);
        break;
      }
      case 'this-half': {
        const half = Math.floor(today.getUTCMonth() / 6);
        const startOfHalf = createUTCDate(today.getUTCFullYear(), half * 6, 1);
        startDate = toUTCDateString(startOfHalf);
        break;
      }
      case 'last-half': {
        const half = Math.floor(today.getUTCMonth() / 6);
        const startOfLastHalf = createUTCDate(today.getUTCFullYear(), (half - 1) * 6, 1);
        const endOfLastHalf = createUTCDate(today.getUTCFullYear(), half * 6, 0);
        startDate = toUTCDateString(startOfLastHalf);
        endDate = toUTCDateString(endOfLastHalf);
        break;
      }
      case 'this-year': {
        const startOfYear = createUTCDate(today.getUTCFullYear(), 0, 1);
        startDate = toUTCDateString(startOfYear);
        break;
      }
      case 'last-year': {
        const startOfLastYear = createUTCDate(today.getUTCFullYear() - 1, 0, 1);
        const endOfLastYear = createUTCDate(today.getUTCFullYear() - 1, 11, 31);
        startDate = toUTCDateString(startOfLastYear);
        endDate = toUTCDateString(endOfLastYear);
        break;
      }
      default:
        startDate = '';
        endDate = '';
    }

    return { startDate, endDate };
  };

  const handleTimePeriodChange = (value: string) => {
    // Update the time period state first
    if (onTimePeriodChange) {
      onTimePeriodChange(value);
    }

    // Update the date filters with a flag to indicate this came from time period
    if (value) {
      const { startDate, endDate } = getDateRange(value);
      onFiltersChange({ startDate, endDate, fromTimePeriod: true } as Partial<FilterType> & { fromTimePeriod: boolean });
    } else {
      // For "All time", clear the date filters to fetch all data
      onFiltersChange({ startDate: '', endDate: '', fromTimePeriod: true } as Partial<FilterType> & { fromTimePeriod: boolean });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Time Period Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline h-4 w-4 mr-1" />
          Time Period
        </label>
        <select
          value={timePeriod}
          onChange={(e) => handleTimePeriodChange(e.target.value)}
          disabled={loading}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${!timePeriod ? 'text-gray-500' : 'text-gray-900'}`}
        >
          {DATE_RANGE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline h-4 w-4 mr-1" />
          Start Date
        </label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => onFiltersChange({ startDate: e.target.value })}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* End Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline h-4 w-4 mr-1" />
          End Date
        </label>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => onFiltersChange({ endDate: e.target.value })}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
