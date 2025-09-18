import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { CubeService } from '@/lib/services/cube'
import { performance } from 'perf_hooks'

/**
 * GET /api/cube/status
 * Get cube status and statistics for the authenticated user's tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = performance.now()

    const cubeService = new CubeService()

    // Get cube statistics
    const stats = await cubeService.getCubeStatistics(user.tenantId)

    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)

    return NextResponse.json({
      success: true,
      stats,
      queryDuration: `${duration}ms`
    })

  } catch (error) {
    console.error('Error getting cube status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get cube status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
