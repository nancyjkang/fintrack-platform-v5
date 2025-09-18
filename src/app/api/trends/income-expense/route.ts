import { NextRequest, NextResponse } from 'next/server'
import { cubeService } from '@/lib/services/cube'
import { getCurrentUser } from '@/lib/auth/jwt'
import { parseAndConvertToUTC, toUTCDateString } from '@/lib/utils/date-utils'
import { z } from 'zod'

// Query parameter validation schema
const IncomeExpenseQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodType: z.enum(['WEEKLY', 'MONTHLY']).default('MONTHLY')
})

/**
 * GET /api/trends/income-expense
 *
 * Get income vs expense trends over time
 *
 * Required Query Parameters:
 * - startDate: YYYY-MM-DD format
 * - endDate: YYYY-MM-DD format
 *
 * Optional Query Parameters:
 * - periodType: 'WEEKLY' | 'MONTHLY' (default: 'MONTHLY')
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const { startDate, endDate, periodType } = IncomeExpenseQuerySchema.parse(queryParams)

    // Get income vs expense trends data
    const trends = await cubeService.getIncomeExpenseTrends(
      user.tenantId,
      parseAndConvertToUTC(startDate),
      parseAndConvertToUTC(endDate),
      periodType
    )

    // Convert Decimal to number for JSON serialization
    const serializedTrends = trends.map(trend => ({
      ...trend,
      total_amount: Number(trend.total_amount),
      period_start: toUTCDateString(trend.period_start) // YYYY-MM-DD format
    }))

    // Structure data for easier chart consumption
    const chartData = serializedTrends.reduce((acc, trend) => {
      const period = trend.period_start
      const existing = acc.find(item => item.period === period)

      if (existing) {
        existing[trend.transaction_type.toLowerCase()] = trend.total_amount
        existing[`${trend.transaction_type.toLowerCase()}_count`] = trend.transaction_count
      } else {
        acc.push({
          period,
          [trend.transaction_type.toLowerCase()]: trend.total_amount,
          [`${trend.transaction_type.toLowerCase()}_count`]: trend.transaction_count
        })
      }

      return acc
    }, [] as Array<{
      period: string
      income?: number
      expense?: number
      transfer?: number
      income_count?: number
      expense_count?: number
      transfer_count?: number
    }>)

    // Calculate net income (income - expenses) for each period
    const netIncomeData = chartData.map(item => ({
      ...item,
      net_income: (item.income || 0) - (item.expense || 0),
      savings_rate: item.income ? ((item.income - (item.expense || 0)) / item.income * 100) : 0
    }))

    // Calculate summary statistics
    const totalIncome = serializedTrends
      .filter(t => t.transaction_type === 'INCOME')
      .reduce((sum, t) => sum + t.total_amount, 0)

    const totalExpenses = serializedTrends
      .filter(t => t.transaction_type === 'EXPENSE')
      .reduce((sum, t) => sum + t.total_amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        raw: serializedTrends,
        chartData: netIncomeData,
        summary: {
          totalIncome,
          totalExpenses,
          netIncome: totalIncome - totalExpenses,
          savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0
        }
      },
      meta: {
        startDate,
        endDate,
        periodType,
        periodCount: chartData.length
      }
    })

  } catch (error) {
    console.error('Error fetching income/expense trends:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
