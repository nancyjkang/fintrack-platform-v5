'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/client/api'
import { TrendsFilters } from '@/components/trends/TrendsFilters'
import { TrendsStackedBarChart } from '@/components/trends/TrendsStackedBarChart'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getCurrentDate, toUTCDateString, formatDateForDisplay, parseAndConvertToUTC, createEndOfMonth, addDays, createUTCDate, getCurrentUTCDate } from '@/lib/utils/date-utils'

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
  periodCount: number
  startDate: string
  endDate: string
  transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  accountId?: number | null // Optional account filter
}

// Calculate date range based on period type and count (complete periods) - same as TrendsFilters
const getDateRangeFromPeriods = (type: string, count: number) => {
  const today = getCurrentUTCDate();
  const endDate = getCurrentDate(); // End is always today
  const startDateObj = createUTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  switch (type) {
    case 'WEEKLY':
      const currentDayOfWeek = today.getUTCDay();
      const daysToStartOfWeek = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      startDateObj.setUTCDate(today.getUTCDate() - daysToStartOfWeek - ((count - 1) * 7));
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    case 'BI_WEEKLY':
      const currentDay = today.getUTCDay();
      const daysToStartOfBiWeek = currentDay === 0 ? 6 : currentDay - 1;
      startDateObj.setUTCDate(today.getUTCDate() - daysToStartOfBiWeek - ((count - 1) * 14));
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    case 'MONTHLY':
      startDateObj.setUTCFullYear(today.getUTCFullYear(), today.getUTCMonth() - count + 1, 1);
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    case 'QUARTERLY':
      const currentQuarter = Math.floor(today.getUTCMonth() / 3);
      const targetQuarter = currentQuarter - count + 1;
      const targetYear = today.getUTCFullYear() + Math.floor(targetQuarter / 4);
      const targetMonth = ((targetQuarter % 4) + 4) % 4 * 3;
      startDateObj.setUTCFullYear(targetYear, targetMonth, 1);
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    case 'BI_ANNUALLY':
      const currentHalf = Math.floor(today.getUTCMonth() / 6);
      const targetHalf = currentHalf - count + 1;
      const targetYearBi = today.getUTCFullYear() + Math.floor(targetHalf / 2);
      const targetMonthBi = ((targetHalf % 2) + 2) % 2 * 6;
      startDateObj.setUTCFullYear(targetYearBi, targetMonthBi, 1);
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    case 'ANNUALLY':
      startDateObj.setUTCFullYear(today.getUTCFullYear() - count + 1, 0, 1);
      startDateObj.setUTCHours(0, 0, 0, 0);
      break;
    default:
      startDateObj.setUTCFullYear(today.getUTCFullYear(), today.getUTCMonth() - count + 1, 1);
      startDateObj.setUTCHours(0, 0, 0, 0);
  }

  const startDate = toUTCDateString(startDateObj);
  return { startDate, endDate };
};

interface Category {
  id: number
  name: string
  type: string
  color: string
  tenant_id: string
  created_at: string
  updated_at: string
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
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
  // Calculate initial date range based on default period settings
  const initialDateRange = getDateRangeFromPeriods('MONTHLY', 6);

  const [filters, setFilters] = useState<TrendsFilters>({
    periodType: 'MONTHLY',
    periodCount: 6, // Default to 6 periods
    startDate: initialDateRange.startDate,
    endDate: initialDateRange.endDate,
    transactionType: 'EXPENSE', // Default to Expense
    accountId: null // No account filter by default
  })

  // Fetch categories data
  const fetchCategories = async () => {
    try {
      console.log('🔄 Starting to fetch categories...')
      const response = await api.getCategories({})
      console.log('📋 Categories API Response:', response)
      console.log('📋 Extracted categories:', response.data?.categories)
      setCategories(response.data?.categories || [])
    } catch (err) {
      console.error('❌ Error fetching categories:', err)
    }
  }

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
      console.log('🔍 Current filters state:', filters)
      console.log('🔍 Date range being sent:', {
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        periodType: queryParams.periodType
      })

      const response = await api.getCubeTrends(queryParams)
      console.log('📡 API Response:', response)
      console.log('📡 API Response data sample:', response.data?.slice(0, 3))

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

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout)
      }
    }
  }, [tooltipTimeout])

  // Export data as CSV
  const handleExportData = async () => {
    try {
      // Get account name if account filter is applied
      let accountName = 'All Accounts'
      if (filters.accountId) {
        try {
          const accountResponse = await fetch(`/api/accounts/${filters.accountId}`)
          if (accountResponse.ok) {
            const accountData = await accountResponse.json()
            accountName = accountData.data?.name || `Account ${filters.accountId}`
          }
        } catch (error) {
          console.warn('Could not fetch account name:', error)
          accountName = `Account ${filters.accountId}`
        }
      }

      // Format period type for display
      const periodTypeDisplay = {
        'WEEKLY': 'Weekly',
        'BI_WEEKLY': 'Bi-Weekly',
        'MONTHLY': 'Monthly',
        'QUARTERLY': 'Quarterly',
        'BI_ANNUALLY': 'Bi-Annually',
        'ANNUALLY': 'Annually'
      }[filters.periodType] || filters.periodType

      // Format transaction type for display
      const transactionTypeDisplay = {
        'INCOME': 'Income',
        'EXPENSE': 'Expense',
        'TRANSFER': 'Transfer'
      }[filters.transactionType] || filters.transactionType

      // Create CSV content
      const csvLines = [
        '# Category Trend Export',
        `# Export Date: ${getCurrentUTCDate().toLocaleString()}`,
        `# Transaction Type: ${transactionTypeDisplay}`,
        `# Breakdown Period: ${periodTypeDisplay}`,
        `# Date Range: ${filters.startDate} to ${filters.endDate}`,
        `# Account: ${accountName}`,
        '#',
        ''
      ]

      // Create header row
      const headers = ['Category', 'Total Amount', 'Average']
      uniquePeriods.forEach(period => {
        headers.push(formatPeriodHeader(period))
      })
      csvLines.push(headers.join(','))

      // Add data rows
      categoryStats.forEach(category => {
        const row = [
          `"${category.category_name}"`,
          `"$${category.total_amount.toFixed(2)}"`,
          `"$${(category.total_amount / uniquePeriods.length).toFixed(2)}"`
        ]

        uniquePeriods.forEach(period => {
          const periodData = category.periods[period]
          const amount = periodData?.amount || 0
          row.push(`"$${amount.toFixed(2)}"`)
        })

        csvLines.push(row.join(','))
      })

      // Create and download file
      const csvContent = csvLines.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')

      // Generate filename with date range
      const startDateFormatted = filters.startDate.replace(/-/g, '')
      const endDateFormatted = filters.endDate.replace(/-/g, '')
      const filename = `category-trends-${startDateFormatted}-to-${endDateFormatted}.csv`

      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Export failed:', error)
      // TODO: Show user-friendly error message
    }
  }

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
          console.log('🏪 MONTHLY calculation - createEndOfMonth result:', toUTCDateString(periodEnd))
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
        categoryId: categoryId ?? null,
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


  const handleFiltersChange = useCallback((newFilters: Partial<TrendsFilters>) => {
    console.log('🔄 handleFiltersChange called with:', newFilters)
    setFilters(prev => {
      const updated = { ...prev, ...newFilters }
      console.log('🔄 Updated filters:', updated)
      return updated
    })
  }, [])

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

  // Create category color mapping
  const categoryColorMap = React.useMemo(() => {
    const colorMap = new Map<string, string>()
    categories.forEach(category => {
      colorMap.set(category.name, category.color)
    })
    console.log('🎨 Category Color Map:', Object.fromEntries(colorMap))
    console.log('📊 Categories with colors:', categories.map(c => ({ name: c.name, color: c.color })))
    return colorMap
  }, [categories])

  // Calculate gradient intensity for individual cells based on column values
  const getCellGradientStyle = (amount: number, period: string): React.CSSProperties => {
    // Get all amounts for this specific period (column)
    const periodAmounts = categoryStats
      .map(stat => stat.periods[period]?.amount || 0)
      .filter(amt => amt !== 0)

    if (periodAmounts.length === 0) return {}

    const maxAmountInPeriod = Math.max(...periodAmounts.map(amt => Math.abs(amt)))
    if (maxAmountInPeriod === 0) return {}

    const intensity = Math.abs(amount) / maxAmountInPeriod
    const opacity = Math.max(0.05, intensity * 0.25) // Scale from 0.05 to 0.25 opacity

    // Use red for expenses (negative amounts) and green for income (positive amounts)
    const color = amount >= 0 ? '34, 197, 94' : '239, 68, 68' // green-500 : red-500 RGB values

    return {
      backgroundColor: `rgba(${color}, ${opacity})`
    }
  }

  // Calculate gradient for total amount column (row-based)
  const getTotalAmountGradientStyle = (amount: number): React.CSSProperties => {
    const maxAmount = Math.max(...categoryStats.map(stat => Math.abs(stat.total_amount)))
    if (maxAmount === 0) return {}

    const intensity = Math.abs(amount) / maxAmount
    const opacity = Math.max(0.05, intensity * 0.3)

    const color = amount >= 0 ? '34, 197, 94' : '239, 68, 68'

    return {
      backgroundColor: `rgba(${color}, ${opacity})`
    }
  }

  // Calculate gradient for average column (row-based)
  const getAverageGradientStyle = (amount: number): React.CSSProperties => {
    // Calculate all averages to find the maximum
    const averages = categoryStats.map(stat => {
      const periodsWithData = Object.values(stat.periods).filter(p => p.amount !== 0).length
      return periodsWithData > 0 ? Math.abs(stat.total_amount / periodsWithData) : 0
    }).filter(avg => avg > 0)

    if (averages.length === 0) return {}

    const maxAverage = Math.max(...averages)
    if (maxAverage === 0) return {}

    const intensity = Math.abs(amount) / maxAverage
    const opacity = Math.max(0.05, intensity * 0.3)

    const color = amount >= 0 ? '34, 197, 94' : '239, 68, 68'

    return {
      backgroundColor: `rgba(${color}, ${opacity})`
    }
  }

  // const getUniquePeriods = (): string[] => {
  //   return uniquePeriods
  // }

  // Format period header for display
  const formatPeriodHeader = (period: string): string => {
    const date = parseAndConvertToUTC(period)
    const periodType = filters.periodType || 'MONTHLY'

    switch (periodType) {
      case 'WEEKLY':
      case 'BI_WEEKLY':
        return formatDateForDisplay(toUTCDateString(date))
      case 'MONTHLY':
        return formatDateForDisplay(toUTCDateString(date))
      case 'QUARTERLY':
        const quarter = Math.floor(date.getUTCMonth() / 3) + 1
        return `Q${quarter} ${date.getUTCFullYear().toString().slice(-2)}`
      case 'BI_ANNUALLY':
        const half = date.getUTCMonth() < 6 ? 'H1' : 'H2'
        return `${half} ${date.getUTCFullYear().toString().slice(-2)}`
      case 'ANNUALLY':
        return date.getUTCFullYear().toString()
      default:
        return formatDateForDisplay(toUTCDateString(date))
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
            <h1 className="text-2xl font-bold text-gray-900">Category Trend</h1>
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
          {/* Stacked Bar Chart */}
          {categoryStats.length > 0 && (
            <TrendsStackedBarChart
              categoryStats={categoryStats}
              uniquePeriods={uniquePeriods}
              periodType={filters.periodType}
              categoryColorMap={categoryColorMap}
            />
          )}

          {/* Data Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Detailed Trends Data
                </h3>
                <button
                  onClick={handleExportData}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Data
                </button>
              </div>

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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Category
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Average
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                            {categoryData.category_name}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right"
                            style={getTotalAmountGradientStyle(categoryData.total_amount)}
                          >
                            <span className={categoryData.total_amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${Math.abs(categoryData.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right border-r border-gray-200"
                            style={(() => {
                              const periodsWithData = Object.values(categoryData.periods).filter(p => p.amount !== 0).length
                              if (periodsWithData > 0) {
                                const average = categoryData.total_amount / periodsWithData
                                return getAverageGradientStyle(average)
                              }
                              return {}
                            })()}
                          >
                            {(() => {
                              const periodsWithData = Object.values(categoryData.periods).filter(p => p.amount !== 0).length
                              if (periodsWithData > 0) {
                                const average = categoryData.total_amount / periodsWithData
                                return (
                                  <span className={average >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    ${Math.abs(average).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                )
                              } else {
                                return <span className="text-gray-400">-</span>
                              }
                            })()}
                          </td>
                          {/* Period data cells */}
                          {uniquePeriods.map(period => (
                            <td
                              key={period}
                              className="px-3 py-4 whitespace-nowrap text-sm text-center"
                              style={categoryData.periods[period] ? getCellGradientStyle(categoryData.periods[period].amount, period) : {}}
                            >
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
