'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client/api'
import { getCurrentDate, getDaysAgo, toUTCDateString } from '@/lib/utils/date-utils'

interface TrendsFiltersProps {
  filters: {
    periodType: 'WEEKLY' | 'MONTHLY'
    startDate: string
    endDate: string
    transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    categoryIds?: number[]
    accountIds?: number[]
    isRecurring?: boolean
  }
  onChange: (filters: Record<string, unknown>) => void
  onRefresh: () => void
}

interface Account {
  id: number
  name: string
}

interface Category {
  id: number
  name: string
}

export function TrendsFilters({ filters, onChange, onRefresh }: TrendsFiltersProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [accountsRes, categoriesRes] = await Promise.all([
          api.getAccounts(),
          api.getCategories()
        ])

        if (accountsRes.success) {
          setAccounts(accountsRes.data)
        }
        if (categoriesRes.success) {
          // Map to match our interface
          const categories = Array.isArray(categoriesRes.data)
            ? categoriesRes.data
            : categoriesRes.data.categories || []

          setCategories(categories.map((cat: { id: number; name: string; type: string }) => ({
            id: cat.id,
            name: cat.name
          })))
        }
      } catch (error) {
        console.error('Error fetching filter data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFilterData()
  }, [])

  const handleFilterChange = (key: string, value: string | number | boolean | Date | number[] | null) => {
    onChange({ [key]: value })
  }

  const handleMultiSelectChange = (key: string, value: string, checked: boolean) => {
    const currentValues = filters[key as keyof typeof filters] as number[] || []
    const numValue = parseInt(value)

    if (checked) {
      onChange({ [key]: [...currentValues, numValue] })
    } else {
      onChange({ [key]: currentValues.filter(id => id !== numValue) })
    }
  }

  const clearFilters = () => {
    onChange({
      periodType: 'MONTHLY',
      startDate: toUTCDateString(getDaysAgo(90)),
      endDate: getCurrentDate(),
      transactionType: undefined,
      categoryIds: undefined,
      accountIds: undefined,
      isRecurring: undefined
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Period Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Period Type
          </label>
          <select
            value={filters.periodType}
            onChange={(e) => handleFilterChange('periodType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>

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

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Type
          </label>
          <select
            value={filters.transactionType || ''}
            onChange={(e) => handleFilterChange('transactionType', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-4">Advanced Filters</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="text-sm text-gray-500">No categories found</div>
              ) : (
                categories.map((category) => (
                  <label key={category.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={filters.categoryIds?.includes(category.id) || false}
                      onChange={(e) => handleMultiSelectChange('categoryIds', category.id.toString(), e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Accounts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accounts
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : accounts.length === 0 ? (
                <div className="text-sm text-gray-500">No accounts found</div>
              ) : (
                accounts.map((account) => (
                  <label key={account.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={filters.accountIds?.includes(account.id) || false}
                      onChange={(e) => handleMultiSelectChange('accountIds', account.id.toString(), e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{account.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Recurring Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Frequency
            </label>
            <select
              value={filters.isRecurring === undefined ? '' : filters.isRecurring.toString()}
              onChange={(e) => {
                const value = e.target.value
                handleFilterChange('isRecurring', value === '' ? undefined : value === 'true')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Transactions</option>
              <option value="true">Recurring Only</option>
              <option value="false">One-time Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.transactionType || filters.categoryIds?.length || filters.accountIds?.length || filters.isRecurring !== undefined) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>

            {filters.transactionType && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {filters.transactionType}
                <button
                  onClick={() => handleFilterChange('transactionType', undefined)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.categoryIds?.length && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {filters.categoryIds.length} categories
                <button
                  onClick={() => handleFilterChange('categoryIds', undefined)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.accountIds?.length && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {filters.accountIds.length} accounts
                <button
                  onClick={() => handleFilterChange('accountIds', undefined)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.isRecurring !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {filters.isRecurring ? 'Recurring' : 'One-time'}
                <button
                  onClick={() => handleFilterChange('isRecurring', undefined)}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
