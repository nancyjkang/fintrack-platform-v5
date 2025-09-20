'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { parseAndConvertToUTC, formatDateForDisplay, toUTCDateString } from '@/lib/utils/date-utils'

interface CategoryData {
  category_id?: number | null
  category_name: string
  transaction_type: string
  total_amount: number
  transaction_count: number
  recurring_amount: number
  recurring_count: number
  periods: Record<string, {
    amount: number
    count: number
    recurring_amount: number
    recurring_count: number
    merchants: Record<string, { amount: number; count: number }>
  }>
}

interface TrendsStackedBarChartProps {
  categoryStats: CategoryData[]
  uniquePeriods: string[]
  periodType: string
  categoryColorMap: Map<string, string>
}

// Generate a consistent color palette for categories
const generateCategoryColor = (categoryName: string, index: number): string => {
  const colors = [
    '#3B82F6', // blue-500
    '#EF4444', // red-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
    '#6366F1', // indigo-500
    '#14B8A6', // teal-500
    '#A855F7', // purple-500
    '#DC2626', // red-600
    '#059669', // emerald-600
    '#D97706', // amber-600
    '#7C3AED', // violet-600
    '#DB2777', // pink-600
    '#0891B2', // cyan-600
    '#65A30D', // lime-600
    '#EA580C', // orange-600
  ]

  return colors[index % colors.length]
}

// Format period label based on period type
const formatPeriodLabel = (period: string, periodType: string): string => {
  const date = parseAndConvertToUTC(period)

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

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: { value: number }) => sum + Math.abs(entry.value), 0)

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload
            .filter((entry: { value: number }) => entry.value !== 0)
            .sort((a: { value: number }, b: { value: number }) => Math.abs(b.value) - Math.abs(a.value))
            .map((entry: { dataKey: string; value: number; color: string }, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-700">{entry.dataKey}</span>
                </div>
                <span className="font-medium text-gray-900">
                  ${Math.abs(entry.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          <div className="border-t border-gray-200 pt-1 mt-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-gray-700">Total:</span>
              <span className="text-gray-900">
                ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export const TrendsStackedBarChart: React.FC<TrendsStackedBarChartProps> = ({
  categoryStats,
  uniquePeriods,
  periodType,
  categoryColorMap
}) => {
  // Transform data for stacked bar chart
  const chartData = uniquePeriods.map(period => {
    const periodData: Record<string, string | number> = {
      period: formatPeriodLabel(period, periodType),
      fullPeriod: period // Keep original for reference
    }

    // Add each category's data for this period
    categoryStats.forEach((category, index) => {
      const periodAmount = category.periods[period]?.amount || 0
      // For expenses, use absolute value for visualization (they're already negative)
      const displayAmount = Math.abs(periodAmount)

      if (displayAmount > 0) {
        periodData[category.category_name] = displayAmount
      }
    })

    return periodData
  })

  // Get all categories that have data
  const categoriesWithData = categoryStats.filter(category =>
    Object.values(category.periods).some(period => period.amount !== 0)
  )

  if (chartData.length === 0 || categoriesWithData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Chart Data</h3>
          <p className="text-gray-500 mt-1">
            No data available for the selected filters to display in the chart.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Trends by Period</h3>
        <p className="text-sm text-gray-600">
          Stacked bar chart showing category breakdown for each time period
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 14, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              tick={{ fontSize: 14, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '14px', color: '#1f2937' }}
              iconType="rect"
            />

            {/* Render a Bar for each category */}
            {categoriesWithData.map((category, categoryIndex) => {
              // Use actual category color if available, otherwise fall back to generated color
              const categoryColor = categoryColorMap.get(category.category_name) || generateCategoryColor(category.category_name, categoryIndex)

              return (
                <Bar
                  key={category.category_name}
                  dataKey={category.category_name}
                  stackId="categories"
                  fill={categoryColor}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              )
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
