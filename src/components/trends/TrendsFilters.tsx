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

export function TrendsFilters({ filters, onChange, onRefresh }: TrendsFiltersProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  // Local state for date inputs to prevent constant re-fetching
  const [localStartDate, setLocalStartDate] = useState(filters.startDate)
  const [localEndDate, setLocalEndDate] = useState(filters.endDate)

  // Update local state when filters change externally
  useEffect(() => {
    setLocalStartDate(filters.startDate)
    setLocalEndDate(filters.endDate)
  }, [filters.startDate, filters.endDate])

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

  // Handle date input changes (only update local state)
  const handleDateInputChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setLocalStartDate(value)
    } else {
      setLocalEndDate(value)
    }
  }

  // Handle date input blur/enter (commit the change)
  const handleDateCommit = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      handleFilterChange('startDate', value)
    } else {
      handleFilterChange('endDate', value)
    }
  }

  const clearFilters = () => {
    onChange({
      startDate: toUTCDateString(getDaysAgo(90)),
      endDate: getCurrentDate(),
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
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={localStartDate}
            onChange={(e) => handleDateInputChange('start', e.target.value)}
            onBlur={(e) => handleDateCommit('start', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleDateCommit('start', e.currentTarget.value)
              }
            }}
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
            value={localEndDate}
            onChange={(e) => handleDateInputChange('end', e.target.value)}
            onBlur={(e) => handleDateCommit('end', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleDateCommit('end', e.currentTarget.value)
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Account Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account (Optional)
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

