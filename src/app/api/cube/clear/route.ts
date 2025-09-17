import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { CubeService } from '@/lib/services/cube.service'
import { performance } from 'perf_hooks'

/**
 * DELETE /api/cube/clear
 * Clear all cube data for the authenticated user's tenant
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = performance.now()

    // Clear all cube data for this tenant
    const cubeService = new CubeService()
    const deletedCount = await cubeService.clearAllData(user.tenantId)

    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)

    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} cube records`,
      deletedCount,
      duration: `${duration}ms`
    })

  } catch (error) {
    console.error('Error clearing cube data:', error)
    return NextResponse.json(
      {
        error: 'Failed to clear cube data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
