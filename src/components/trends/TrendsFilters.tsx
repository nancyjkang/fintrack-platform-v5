'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client/api'
import { getCurrentDate, getDaysAgo, toUTCDateString, createUTCDate, getCurrentUTCDate } from '@/lib/utils/date-utils'

interface TrendsFiltersProps {
  filters: {
    periodType: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY'
    periodCount: number
    startDate: string
    endDate: string
    transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    accountId?: number | null
  }
  onChange: (filters: Record<string, unknown>) => void
  onRefresh: () => void
}

interface Account {
  id: number
  name: string
  type: string
  is_active: boolean
}

// Calculate date range based on period type and count (complete periods)
const getDateRangeFromPeriods = (type: string, count: number) => {
  const today = getCurrentUTCDate();
  const endDate = getCurrentDate(); // End is always today
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

export function TrendsFilters({ filters, onChange, onRefresh }: TrendsFiltersProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  // Update start/end dates when period type or count changes
  useEffect(() => {
    const { startDate, endDate } = getDateRangeFromPeriods(filters.periodType, filters.periodCount);
    // Only update if the calculated dates are different from current filters
    if (startDate !== filters.startDate || endDate !== filters.endDate) {
      console.log('🔄 TrendsFilters: Updating dates based on period selection', {
        periodType: filters.periodType,
        periodCount: filters.periodCount,
        calculatedStartDate: startDate,
        calculatedEndDate: endDate,
        currentStartDate: filters.startDate,
        currentEndDate: filters.endDate
      });
      onChange({ startDate, endDate });
    }
  }, [filters.periodType, filters.periodCount, onChange]) // Add onChange to dependencies

  // Ensure dates are correct on component mount
  useEffect(() => {
    const { startDate, endDate } = getDateRangeFromPeriods(filters.periodType, filters.periodCount);
    if (startDate !== filters.startDate || endDate !== filters.endDate) {
      console.log('🔄 TrendsFilters: Initial date sync on mount', {
        calculatedStartDate: startDate,
        calculatedEndDate: endDate,
        currentStartDate: filters.startDate,
        currentEndDate: filters.endDate
      });
      onChange({ startDate, endDate });
    }
  }, []) // Run once on mount

  // Fetch accounts for the dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoadingAccounts(true)
        const response = await api.getAccounts({ is_active: true })
        if (response.success && response.data) {
          setAccounts(response.data)
        }
      } catch (error) {
        console.error('Error fetching accounts:', error)
      } finally {
        setLoadingAccounts(false)
      }
    }

    fetchAccounts()
  }, [])

  const handleFilterChange = (key: string, value: string | number | boolean | Date | number[] | null) => {
    onChange({ [key]: value })
  }

  const clearFilters = () => {
    const { startDate, endDate } = getDateRangeFromPeriods('MONTHLY', 6); // Default to 6 months
    onChange({
      periodType: 'MONTHLY',
      periodCount: 6,
      startDate,
      endDate,
      transactionType: 'EXPENSE',
      accountId: null
    })
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <div className="flex space-x-2">
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear All
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Period Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Periods
          </label>
          <select
            value={filters.periodCount}
            onChange={(e) => handleFilterChange('periodCount', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={3}>3</option>
            <option value={6}>6</option>
            <option value={9}>9</option>
            <option value={15}>15</option>
          </select>
        </div>

        {/* Date Range Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calculated Date Range
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
            {(() => {
              const { startDate, endDate } = getDateRangeFromPeriods(filters.periodType, filters.periodCount);
              return `${startDate} to ${endDate}`;
            })()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {filters.periodCount} {filters.periodType.toLowerCase()} periods
          </div>
        </div>

        {/* Account Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account
          </label>
          <select
            value={filters.accountId || ''}
            onChange={(e) => handleFilterChange('accountId', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loadingAccounts}
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type})
              </option>
            ))}
          </select>
          {loadingAccounts && (
            <p className="text-xs text-gray-500 mt-1">Loading accounts...</p>
          )}
        </div>
      </div>

      {/* Simplified Filters - Categories, Accounts, and Recurring filters removed for simplicity */}

      {/* Active Filters Summary removed - no complex filters to display */}
    </div>
  )
}
