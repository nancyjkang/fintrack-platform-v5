import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'
import { toISOString, getCurrentUTCDate } from '@/lib/utils/date-utils'
import { getVersionInfo, formatVersionForLog } from '@/lib/utils/version'

/**
 * GET /api/health - Health check endpoint for deployment validation
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = process.hrtime.bigint()

    // Test database connection
    await prisma.$queryRaw`SELECT 1`

    const dbResponseTime = Number(process.hrtime.bigint() - startTime) / 1000000 // Convert nanoseconds to milliseconds

    // Get version and system info
    const versionInfo = getVersionInfo()

    // Log health check with version info
    console.log(`Health check: ${formatVersionForLog()}`)

    const healthData = {
      status: 'healthy',
      timestamp: toISOString(getCurrentUTCDate()),
      version: versionInfo.version,
      fullVersion: versionInfo.fullVersion,
      environment: versionInfo.environment,
      gitCommit: versionInfo.gitCommit,
      gitBranch: versionInfo.gitBranch,
      buildTime: versionInfo.buildTime,
      database: {
        status: 'connected',
        responseTime: `${Math.round(dbResponseTime)}ms`
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      deployment: {
        isProduction: versionInfo.isProduction,
        isStaging: versionInfo.isStaging,
        isDevelopment: versionInfo.isDevelopment
      }
    }

    return createSuccessResponse(healthData, 'System healthy')

  } catch (error) {
    console.error('Health check failed:', error)

    const errorData = {
      status: 'unhealthy',
      timestamp: toISOString(getCurrentUTCDate()),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        status: 'disconnected'
      }
    }

    return Response.json(errorData, { status: 503 })
  }
}
