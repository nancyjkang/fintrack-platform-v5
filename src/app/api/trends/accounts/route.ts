import { NextRequest, NextResponse } from 'next/server'
import { cubeService } from '@/lib/services/cube.service'
import { getCurrentUser } from '@/lib/auth/jwt'
import { parseAndConvertToUTC } from '@/lib/utils/date-utils'
import { z } from 'zod'

// Query parameter validation schema
const AccountTrendsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodType: z.enum(['WEEKLY', 'MONTHLY']).default('MONTHLY')
})

/**
 * GET /api/trends/accounts
 *
 * Get account balance trends over time
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

    const { startDate, endDate, periodType } = AccountTrendsQuerySchema.parse(queryParams)

    // Get account trends data
    const trends = await cubeService.getAccountTrends(
      user.tenantId,
      parseAndConvertToUTC(startDate),
      parseAndConvertToUTC(endDate),
      periodType
    )

    // Convert Decimal to number for JSON serialization
    const serializedTrends = trends.map(trend => ({
      ...trend,
      total_amount: Number(trend.total_amount),
      period_start: trend.period_start.toISOString().split('T')[0] // YYYY-MM-DD format
    }))

    // Group by account for easier frontend consumption
    const groupedByAccount = serializedTrends.reduce((acc, trend) => {
      const account = trend.account_name
      if (!acc[account]) {
        acc[account] = []
      }
      acc[account].push({
        period_start: trend.period_start,
        total_amount: trend.total_amount,
        transaction_count: trend.transaction_count
      })
      return acc
    }, {} as Record<string, Array<{
      period_start: string
      total_amount: number
      transaction_count: number
    }>>)

    return NextResponse.json({
      success: true,
      data: {
        raw: serializedTrends,
        byAccount: groupedByAccount
      },
      meta: {
        startDate,
        endDate,
        periodType,
        accountCount: Object.keys(groupedByAccount).length
      }
    })

  } catch (error) {
    console.error('Error fetching account trends:', error)

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
