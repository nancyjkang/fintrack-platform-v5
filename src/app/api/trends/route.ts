import { NextRequest, NextResponse } from 'next/server'
import { cubeService } from '@/lib/services/cube'
import { getCurrentUser } from '@/lib/auth/jwt'
import { z } from 'zod'
import { parseAndConvertToUTC } from '@/lib/utils/date-utils'

// Query parameter validation schema
const TrendsQuerySchema = z.object({
  periodType: z.enum(['WEEKLY', 'MONTHLY']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  transactionType: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  categoryIds: z.string().optional(), // Comma-separated IDs
  accountIds: z.string().optional(),  // Comma-separated IDs
  isRecurring: z.enum(['true', 'false']).optional()
})

/**
 * GET /api/trends
 *
 * Get financial trends data with flexible filtering
 *
 * Query Parameters:
 * - periodType: 'WEEKLY' | 'MONTHLY'
 * - startDate: YYYY-MM-DD format
 * - endDate: YYYY-MM-DD format
 * - transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER'
 * - categoryIds: comma-separated category IDs
 * - accountIds: comma-separated account IDs
 * - isRecurring: 'true' | 'false'
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

    const validatedParams = TrendsQuerySchema.parse(queryParams)

    // Convert string parameters to appropriate types
    const filters: Parameters<typeof cubeService.getTrends>[1] = {}

    if (validatedParams.periodType) {
      filters.periodType = validatedParams.periodType
    }

    if (validatedParams.startDate) {
      filters.startDate = parseAndConvertToUTC(validatedParams.startDate)
    }

    if (validatedParams.endDate) {
      filters.endDate = parseAndConvertToUTC(validatedParams.endDate)
    }

    if (validatedParams.transactionType) {
      filters.transactionType = validatedParams.transactionType
    }

    if (validatedParams.categoryIds) {
      filters.categoryIds = validatedParams.categoryIds
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id))
    }

    if (validatedParams.accountIds) {
      filters.accountIds = validatedParams.accountIds
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id))
    }

    if (validatedParams.isRecurring) {
      filters.isRecurring = validatedParams.isRecurring === 'true'
    }

    // Get trends data
    const trends = await cubeService.getTrends(user.tenantId, filters)

    // Convert Decimal to number for JSON serialization
    const serializedTrends = trends.map(trend => ({
      ...trend,
      total_amount: Number(trend.total_amount)
    }))

    return NextResponse.json({
      success: true,
      data: serializedTrends,
      filters: validatedParams
    })

  } catch (error) {
    console.error('Error fetching trends:', error)

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
