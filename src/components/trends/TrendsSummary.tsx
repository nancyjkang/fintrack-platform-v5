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

interface TrendsSummaryProps {
  // TODO: Define proper props when implementing
  data?: Record<string, unknown>
  trends?: TrendData[]
}

export function TrendsSummary({ data }: TrendsSummaryProps) {
  return (
    <div className="trends-summary">
      <h3>Trends Summary</h3>
      <p>Summary component will be implemented here</p>
      {data && <p>Summary data available</p>}
    </div>
  )
}
