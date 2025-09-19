'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client/api'
import { getCurrentDate, getDaysAgo, toUTCDateString } from '@/lib/utils/date-utils'

interface TrendsFiltersProps {
  filters: {
    periodType: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY'
    startDate: string
    endDate: string
    transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  }
  onChange: (filters: Record<string, unknown>) => void
  onRefresh: () => void
}

export function TrendsFilters({ filters, onChange, onRefresh }: TrendsFiltersProps) {
  // Removed complex filter data fetching - keeping it simple

  const handleFilterChange = (key: string, value: string | number | boolean | Date | number[] | null) => {
    onChange({ [key]: value })
  }

  const clearFilters = () => {
    onChange({
      startDate: toUTCDateString(getDaysAgo(90)),
      endDate: getCurrentDate(),
      transactionType: 'EXPENSE'
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Simplified Filters - Categories, Accounts, and Recurring filters removed for simplicity */}

      {/* Active Filters Summary removed - no complex filters to display */}
    </div>
  )
}
