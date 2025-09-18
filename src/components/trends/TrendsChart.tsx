'use client'

import React from 'react'

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

interface TrendsChartProps {
  // TODO: Define proper props when implementing
  data?: TrendData[]
  title?: string
  chartType?: string
  groupBy?: string
  filters?: Record<string, unknown>
  limit?: number
}

export function TrendsChart({ data }: TrendsChartProps) {
  return (
    <div className="trends-chart">
      <h3>Trends Chart</h3>
      <p>Chart component will be implemented here</p>
      {data && <p>Data points: {data.length}</p>}
    </div>
  )
}
