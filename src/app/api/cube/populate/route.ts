import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cubeService } from '@/lib/services/cube'
import { getCurrentUser } from '@/lib/auth/session'
import { parseAndConvertToUTC } from '@/lib/utils/date-utils'

const PopulateCubeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  clearExisting: z.boolean().default(false),
  batchSize: z.number().min(1).max(1000).default(100),
  accountId: z.number().positive().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = PopulateCubeSchema.parse(body)

    // Convert date strings to Date objects
    const options = {
      ...validatedData,
      startDate: validatedData.startDate ? parseAndConvertToUTC(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? parseAndConvertToUTC(validatedData.endDate) : undefined
    }

    // Populate historical cube data
    const result = await cubeService.populateHistoricalData(user.tenantId, options)

    return NextResponse.json({
      success: true,
      message: 'Cube population completed successfully',
      data: {
        periodsProcessed: result.periodsProcessed,
        recordsCreated: result.recordsCreated,
        timeElapsed: result.timeElapsed,
        timeElapsedFormatted: `${(result.timeElapsed / 1000).toFixed(2)}s`,
        accountsProcessed: result.accountsProcessed
      }
    })

  } catch (error) {
    console.error('Error populating cube:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to populate cube data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get cube population status/stats
    const stats = await cubeService.getCubeStatistics(user.tenantId)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error getting cube stats:', error)
    return NextResponse.json(
      { error: 'Failed to get cube statistics' },
      { status: 500 }
    )
  }
}
