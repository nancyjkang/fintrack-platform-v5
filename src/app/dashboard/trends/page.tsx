'use client'

import React, { useState, useEffect } from 'react'
import { api } from '@/lib/client/api'
import { TrendsChart } from '@/components/trends/TrendsChart'
import { TrendsFilters } from '@/components/trends/TrendsFilters'
import { TrendsSummary } from '@/components/trends/TrendsSummary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getCurrentDate, getDaysAgo, toUTCDateString, formatDateForDisplay, parseAndConvertToUTC } from '@/lib/utils/date-utils'

interface TrendData {
  period_start: string
  period_type: string
  transaction_type: string
  category_name: string
  account_name: string
  is_recurring: boolean
  total_amount: number
  transaction_count: number
}

interface TrendsFilters {
  periodType: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY'
  startDate: string
  endDate: string
  transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER'
}


export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TrendsFilters>({
    periodType: 'MONTHLY',
    startDate: toUTCDateString(getDaysAgo(90)), // 90 days ago
    endDate: getCurrentDate(), // Today
    transactionType: 'EXPENSE' // Default to Expense
  })

  const fetchTrends = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams: Record<string, string> = {
        periodType: filters.periodType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        transactionType: filters.transactionType
      }

      // Removed category, account, and recurring filters for simplicity

      console.log('🔍 Fetching trends with params:', queryParams)
      const response = await api.getCubeTrends(queryParams)
      console.log('📡 API Response:', response)

      if (response.success) {
        console.log('✅ Success - Setting trends data:', response.data?.length, 'items')
        setTrends(response.data)
      } else {
        console.log('❌ API Error:', response.error)
        setError(response.error || 'Failed to fetch trends data')
      }
    } catch (err) {
      console.error('Error fetching trends:', err)
      setError('An error occurred while fetching trends data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrends()
  }, [filters])


  const handleFiltersChange = (newFilters: Partial<TrendsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Get unique periods from trends data (memoized to avoid recalculation)
  const uniquePeriods = React.useMemo(() => {
    if (trends.length === 0) return []
    const periods = new Set(trends.map(trend => trend.period_start).filter(Boolean))
    const sortedPeriods = Array.from(periods).sort()
    return sortedPeriods
  }, [trends])

  const getUniquePeriods = (): string[] => {
    return uniquePeriods
  }

  // Format period header for display
  const formatPeriodHeader = (period: string): string => {
    const date = parseAndConvertToUTC(period)
    const periodType = filters.periodType || 'MONTHLY'

    switch (periodType) {
      case 'WEEKLY':
      case 'BI_WEEKLY':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case 'MONTHLY':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      case 'QUARTERLY':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `Q${quarter} ${date.getFullYear().toString().slice(-2)}`
      case 'BI_ANNUALLY':
        const half = date.getMonth() < 6 ? 'H1' : 'H2'
        return `${half} ${date.getFullYear().toString().slice(-2)}`
      case 'ANNUALLY':
        return date.getFullYear().toString()
      default:
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Trends Analysis</h1>
            <p className="text-gray-600 mt-1">
              Analyze your financial patterns and trends over time using our advanced data cube
            </p>
          </div>

          {/* Quick Filters in Header */}
          <div className="flex items-center space-x-4 ml-6">
            {/* Transaction Type */}
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                value={filters.transactionType || 'EXPENSE'}
                onChange={(e) => handleFiltersChange({ transactionType: e.target.value as 'INCOME' | 'EXPENSE' | 'TRANSFER' })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>

            {/* Period Type */}
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period Type
              </label>
              <select
                value={filters.periodType}
                onChange={(e) => handleFiltersChange({ periodType: e.target.value as 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY' })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BI_WEEKLY">Bi-weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="BI_ANNUALLY">Bi-annually</option>
                <option value="ANNUALLY">Annually</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TrendsFilters
        filters={filters}
        onChange={handleFiltersChange}
        onRefresh={fetchTrends}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchTrends}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!error && (
        <>
          {/* Data Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Detailed Trends Data
              </h3>

              {trends.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No trends data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No data found for the selected filters. Try adjusting your date range or filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recurring
                        </th>
                        {/* Period columns */}
                        {uniquePeriods.map(period => (
                          <th key={period} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {formatPeriodHeader(period)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trends.slice(0, 50).map((trend, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateForDisplay(trend.period_start)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              trend.transaction_type === 'INCOME'
                                ? 'bg-green-100 text-green-800'
                                : trend.transaction_type === 'EXPENSE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {trend.transaction_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {trend.category_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {trend.account_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={trend.total_amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${Math.abs(trend.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {trend.transaction_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              trend.is_recurring
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {trend.is_recurring ? 'Recurring' : 'One-time'}
                            </span>
                          </td>
                          {/* Period data cells */}
                          {uniquePeriods.map(period => (
                            <td key={period} className="px-3 py-4 whitespace-nowrap text-sm text-center">
                              {trend.period_start === period ? (
                                <div className="space-y-1">
                                  <div className={`font-medium ${trend.total_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${Math.abs(trend.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {trend.transaction_count} txns
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {trends.length > 50 && (
                    <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                      Showing first 50 of {trends.length} results
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </>
      )}
    </div>
  )
}
