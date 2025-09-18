import { NextRequest, NextResponse } from 'next/server'
import { cubeService } from '@/lib/services/cube'
import { getCurrentUser } from '@/lib/auth/jwt'
import { z } from 'zod'
import { parseAndConvertToUTC } from '@/lib/utils/date-utils'
import { differenceInDays } from 'date-fns'

// Request body validation schema
const RebuildCubeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodType: z.enum(['WEEKLY', 'MONTHLY']).default('MONTHLY')
})

/**
 * POST /api/cube/rebuild
 *
 * Rebuild cube data for a specific date range
 * This will clear existing cube data and regenerate it from transaction data
 *
 * Request Body:
 * {
 *   "startDate": "2024-01-01",
 *   "endDate": "2024-12-31",
 *   "periodType": "MONTHLY"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { startDate, endDate, periodType } = RebuildCubeSchema.parse(body)

    const start = parseAndConvertToUTC(startDate)
    const end = parseAndConvertToUTC(endDate)

    // Validate date range
    if (start > end) {
      return NextResponse.json({
        error: 'Invalid date range: startDate must be before endDate'
      }, { status: 400 })
    }

    // Check if date range is reasonable (not more than 2 years)
    const daysDiff = Math.abs(differenceInDays(end, start))
    if (daysDiff > 730) { // 2 years
      return NextResponse.json({
        error: 'Date range too large: maximum 2 years allowed'
      }, { status: 400 })
    }

    console.log(`Rebuilding cube for tenant ${user.tenantId}: ${startDate} to ${endDate} (${periodType})`)

    // Rebuild cube data
    const startTime = performance.now()
    await cubeService.rebuildCubeForPeriod(
      user.tenantId,
      start,
      end,
      periodType
    )
    const duration = performance.now() - startTime

    console.log(`Cube rebuild completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'Cube data rebuilt successfully',
      meta: {
        startDate,
        endDate,
        periodType,
        duration: `${duration}ms`
      }
    })

  } catch (error) {
    console.error('Error rebuilding cube:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
