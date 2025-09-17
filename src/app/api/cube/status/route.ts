import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { CubeService } from '@/lib/services/cube.service'
import { performance } from 'perf_hooks'

/**
 * GET /api/cube/status
 * Get cube status and statistics for the authenticated user's tenant
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] /api/cube/status called')

    // Authenticate user
    const user = await getCurrentUser(request)
    console.log('[API] User authenticated:', user ? { tenantId: user.tenantId } : 'null')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = performance.now()

    console.log('[API] Creating CubeService...')
    const cubeService = new CubeService()

    // Get cube statistics
    console.log('[API] Calling getCubeStatistics with tenantId:', user.tenantId)
    const stats = await cubeService.getCubeStatistics(user.tenantId)
    console.log('[API] getCubeStatistics completed:', stats)

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
