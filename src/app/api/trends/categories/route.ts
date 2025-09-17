import { NextRequest, NextResponse } from 'next/server'
import { cubeService } from '@/lib/services/cube.service'
import { getCurrentUser } from '@/lib/auth/jwt'
import { parseAndConvertToUTC, toUTCDateString } from '@/lib/utils/date-utils'
import { z } from 'zod'

// Query parameter validation schema
const CategoryTrendsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodType: z.enum(['WEEKLY', 'MONTHLY']).default('MONTHLY')
})

/**
 * GET /api/trends/categories
 *
 * Get spending trends by category over time
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

    const { startDate, endDate, periodType } = CategoryTrendsQuerySchema.parse(queryParams)

    // Get category trends data
    const trends = await cubeService.getCategoryTrends(
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

    // Group by period for easier frontend consumption
    const groupedByPeriod = serializedTrends.reduce((acc, trend) => {
      const period = trend.period_start
      if (!acc[period]) {
        acc[period] = []
      }
      acc[period].push({
        category_name: trend.category_name,
        total_amount: trend.total_amount,
        transaction_count: trend.transaction_count
      })
      return acc
    }, {} as Record<string, Array<{
      category_name: string
      total_amount: number
      transaction_count: number
    }>>)

    return NextResponse.json({
      success: true,
      data: {
        raw: serializedTrends,
        byPeriod: groupedByPeriod
      },
      meta: {
        startDate,
        endDate,
        periodType,
        periodCount: Object.keys(groupedByPeriod).length
      }
    })

  } catch (error) {
    console.error('Error fetching category trends:', error)

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
