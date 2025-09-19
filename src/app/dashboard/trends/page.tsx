'use client'

import React, { useState, useEffect } from 'react'
import { api } from '@/lib/client/api'
import { TrendsChart } from '@/components/trends/TrendsChart'
import { TrendsFilters } from '@/components/trends/TrendsFilters'
import { TrendsSummary } from '@/components/trends/TrendsSummary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getCurrentDate, getDaysAgo, toUTCDateString, formatDateForDisplay, parseAndConvertToUTC, createEndOfMonth, addDays, createUTCDate } from '@/lib/utils/date-utils'

// Temporary functions until we add them to date-utils
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

interface TrendData {
  period_start: string
  period_type: string
  transaction_type: string
  category_id?: number | null
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
  accountId?: number | null // Optional account filter
}


export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    merchants: Array<{
      merchant: string
      totalAmount: number
      transactionCount: number
      sampleDescriptions: string[]
      sampleTransactions?: Array<{
        id: number
        date: string
        amount: number
        description: string
        type: string
      }>
    }>
    summary: {
      totalAmount: number
      totalTransactions: number
      uniqueMerchants: number
    }
    period: string
    category: string
    loading: boolean
  } | null>(null)
  const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | null>(null)
  const [filters, setFilters] = useState<TrendsFilters>({
    periodType: 'MONTHLY',
    startDate: toUTCDateString(getDaysAgo(90)), // 90 days ago
    endDate: getCurrentDate(), // Today
    transactionType: 'EXPENSE', // Default to Expense
    accountId: null // No account filter by default
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

      // Add account filter if selected
      if (filters.accountId) {
        queryParams.accountIds = filters.accountId.toString()
      }

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout)
      }
    }
  }, [tooltipTimeout])

  // Fetch merchant data for tooltip
  const fetchMerchantData = async (categoryName: string, period: string, categoryId?: number) => {
    try {
      // Calculate period end date using same logic as cube service
      const periodStart = parseAndConvertToUTC(period)
      let periodEnd: Date

      switch (filters.periodType) {
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
          console.log('🏪 MONTHLY calculation - createEndOfMonth result:', periodEnd.toISOString())
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

      const merchantFilters = {
        categoryId: categoryId ?? null, // Use null for uncategorized
        periodStart: toUTCDateString(periodStart),
        periodEnd: toUTCDateString(periodEnd),
        transactionType: filters.transactionType,
        ...(filters.accountId && { accountIds: [filters.accountId] })
      }

      console.log('🏪 Fetching merchant data:', merchantFilters)
      const response = await api.getTrendsMerchants(merchantFilters)
      console.log('🏪 Merchant API response:', response)

      if (response.success && response.data) {
        console.log('✅ Merchant data received:', response.data)
        return response.data
      } else {
        console.error('❌ Failed to fetch merchant data:', response.error)
        return null
      }
    } catch (error) {
      console.error('Error fetching merchant data:', error)
      return null
    }
  }

  // Handle mouse enter on amount cell
  const handleAmountHover = async (
    event: React.MouseEvent<HTMLDivElement>,
    categoryName: string,
    period: string,
    categoryId?: number
  ) => {
    // Clear any existing timeout
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout)
      setTooltipTimeout(null)
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const tooltipWidth = 400 // Approximate tooltip width
    const screenWidth = window.innerWidth

    // Position tooltip to the right if there's space, otherwise to the left
    const shouldPositionLeft = rect.right + tooltipWidth + 20 > screenWidth
    const x = shouldPositionLeft ? rect.left - tooltipWidth - 10 : rect.right + 10
    const y = Math.max(10, rect.top - 50) // Ensure tooltip doesn't go above screen

    // Set tooltip with loading state - use simple period for now
    setTooltip({
      visible: true,
      x,
      y,
      merchants: [],
      summary: {
        totalAmount: 0,
        totalTransactions: 0,
        uniqueMerchants: 0
      },
      period: formatPeriodHeader(period),
      category: categoryName,
      loading: true
    })

    // Fetch merchant data
    const merchantData = await fetchMerchantData(categoryName, period, categoryId)

    if (merchantData) {
      setTooltip(prev => {
        // Only update if tooltip is still visible and for the same category/period
        if (prev && prev.visible && prev.category === categoryName && prev.period === formatPeriodHeader(period)) {
          // Create the date range display from the API response
          const dateRange = `${formatDateForDisplay(merchantData.summary.periodStart)} - ${formatDateForDisplay(merchantData.summary.periodEnd)}`

          return {
            ...prev,
            merchants: merchantData.merchants,
            summary: merchantData.summary,
            period: dateRange,
            loading: false
          }
        }
        return prev
      })
    } else {
      // Handle error case - show error message
      setTooltip(prev => {
        if (prev && prev.visible && prev.category === categoryName && prev.period === formatPeriodHeader(period)) {
          return {
            ...prev,
            merchants: [],
            summary: {
              totalAmount: 0,
              totalTransactions: 0,
              uniqueMerchants: 0
            },
            loading: false
          }
        }
        return prev
      })
    }
  }

  // Handle mouse leave with delay
  const handleAmountLeave = () => {
    const timeout = setTimeout(() => {
      setTooltip(null)
    }, 300) // 300ms delay
    setTooltipTimeout(timeout)
  }

  // Handle tooltip mouse enter (cancel hide timeout)
  const handleTooltipMouseEnter = () => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout)
      setTooltipTimeout(null)
    }
  }

  // Handle tooltip mouse leave (hide immediately)
  const handleTooltipMouseLeave = () => {
    setTooltip(null)
  }


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

  // Aggregate data by category for cleaner table display
  const categoryStats = React.useMemo(() => {
    if (trends.length === 0) return []

    const categoryMap = new Map<string, {
      category_id: number | null
      category_name: string
      transaction_type: string
      total_amount: number
      transaction_count: number
      recurring_amount: number
      recurring_count: number
      periods: Record<string, {
        amount: number;
        count: number;
        recurring_amount: number;
        recurring_count: number;
        merchants: Record<string, { amount: number; count: number }>
      }>
    }>()

    trends.forEach(trend => {
      const key = trend.category_name

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          category_id: trend.category_id,
          category_name: trend.category_name,
          transaction_type: trend.transaction_type,
          total_amount: 0,
          transaction_count: 0,
          recurring_amount: 0,
          recurring_count: 0,
          periods: {}
        })
      }

      const categoryData = categoryMap.get(key)!
      categoryData.total_amount += trend.total_amount
      categoryData.transaction_count += trend.transaction_count

      if (trend.is_recurring) {
        categoryData.recurring_amount += trend.total_amount
        categoryData.recurring_count += trend.transaction_count
      }

      // Initialize period if it doesn't exist
      if (!categoryData.periods[trend.period_start]) {
        categoryData.periods[trend.period_start] = {
          amount: 0,
          count: 0,
          recurring_amount: 0,
          recurring_count: 0,
          merchants: {}
        }
      }

      // Add to period totals
      categoryData.periods[trend.period_start].amount += trend.total_amount
      categoryData.periods[trend.period_start].count += trend.transaction_count

      if (trend.is_recurring) {
        categoryData.periods[trend.period_start].recurring_amount += trend.total_amount
        categoryData.periods[trend.period_start].recurring_count += trend.transaction_count
      }

      // Track merchants (using account_name as merchant for now, but this could be enhanced)
      const merchantName = trend.account_name
      if (!categoryData.periods[trend.period_start].merchants[merchantName]) {
        categoryData.periods[trend.period_start].merchants[merchantName] = {
          amount: 0,
          count: 0
        }
      }
      categoryData.periods[trend.period_start].merchants[merchantName].amount += trend.total_amount
      categoryData.periods[trend.period_start].merchants[merchantName].count += trend.transaction_count
    })

    return Array.from(categoryMap.values()).sort((a, b) =>
      Math.abs(b.total_amount) - Math.abs(a.total_amount)
    )
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
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      case 'MONTHLY':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
      case 'QUARTERLY':
        const quarter = Math.floor(date.getUTCMonth() / 3) + 1
        return `Q${quarter} ${date.getUTCFullYear().toString().slice(-2)}`
      case 'BI_ANNUALLY':
        const half = date.getUTCMonth() < 6 ? 'H1' : 'H2'
        return `${half} ${date.getUTCFullYear().toString().slice(-2)}`
      case 'ANNUALLY':
        return date.getUTCFullYear().toString()
      default:
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
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

              {categoryStats.length === 0 ? (
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
                          Category
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recurring %
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
                      {categoryStats.slice(0, 50).map((categoryData, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {categoryData.category_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                            <span className={categoryData.total_amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${Math.abs(categoryData.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {categoryData.transaction_count > 0 ? (
                              <span className="text-purple-600">
                                {Math.round((categoryData.recurring_count / categoryData.transaction_count) * 100)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          {/* Period data cells */}
                          {uniquePeriods.map(period => (
                            <td key={period} className="px-3 py-4 whitespace-nowrap text-sm text-center">
                              {categoryData.periods[period] ? (
                                <div
                                  className="space-y-1 cursor-pointer hover:bg-blue-50 rounded p-1 transition-colors"
                                  onMouseEnter={(e) => handleAmountHover(e, categoryData.category_name, period, categoryData.category_id ?? 0)}
                                  onMouseLeave={handleAmountLeave}
                                >
                                  <div className={`font-medium ${categoryData.periods[period].amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${Math.abs(categoryData.periods[period].amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {categoryData.periods[period].count} txns
                                    {categoryData.periods[period].recurring_count > 0 && (
                                      <span className="text-purple-500 ml-1">
                                        ({categoryData.periods[period].recurring_count}R)
                                      </span>
                                    )}
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

                  {categoryStats.length > 50 && (
                    <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                      Showing first 50 of {categoryStats.length} category combinations
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </>
      )}

      {/* Merchant Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            width: '400px',
            maxHeight: '500px',
            transform: 'translateY(-25%)'
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="mb-2">
            <h4 className="font-semibold text-gray-900">
              {tooltip.category} <span className="text-sm font-normal text-gray-600">({tooltip.period})</span>
            </h4>
          </div>

          {tooltip.loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading merchants...</span>
            </div>
          ) : (
            <div>
              {tooltip.merchants.length > 0 ? (
                <div>
                   <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                     <div className="flex justify-between">
                       <span>Total Amount:</span>
                       <span className="font-medium">
                         ${Math.abs(tooltip.summary.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                       </span>
                     </div>
                   </div>

                   <div className="space-y-3 max-h-64 overflow-y-auto">
                     <h5 className="text-sm font-medium text-gray-700">
                       Top Merchants:
                       <span className="text-xs text-gray-500 ml-1">
                         (Showing {Math.min(10, tooltip.merchants.length)} of {tooltip.merchants.length})
                       </span>
                     </h5>
                     {tooltip.merchants.slice(0, 10).map((merchant, index) => (
                       <div key={index} className="border-b border-gray-100 pb-2 last:border-b-0">
                         <div className="flex justify-between items-start text-sm mb-1">
                           <div className="flex-1 min-w-0">
                             <div className="font-medium text-gray-900 truncate">
                               {merchant.merchant}
                             </div>
                           </div>
                           <div className="ml-2 text-right">
                             <div className={`font-medium ${merchant.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                               ${Math.abs(merchant.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                             </div>
                           </div>
                         </div>

                         {/* Show sample transactions - date and amount only */}
                         {merchant.sampleTransactions && merchant.sampleTransactions.length > 0 && (
                           <div className="mt-1 space-y-1">
                             {merchant.sampleTransactions.map((txn, txnIndex) => (
                               <div key={txnIndex} className="flex justify-between items-center text-xs text-gray-600">
                                 <span className="font-mono text-gray-500">{txn.date}</span>
                                 <span className={`font-medium ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                   ${Math.abs(txn.amount).toFixed(2)}
                                 </span>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                <div className="text-sm text-gray-500 py-2">
                  No merchant data available for this period.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
