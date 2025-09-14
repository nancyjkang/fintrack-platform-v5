import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'

/**
 * GET /api/health - Health check endpoint for deployment validation
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()

    // Test database connection
    await prisma.$queryRaw`SELECT 1`

    const dbResponseTime = Date.now() - startTime

    // Get basic system info
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '5.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }

    return createSuccessResponse(healthData, 'System healthy')

  } catch (error) {
    console.error('Health check failed:', error)

    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        status: 'disconnected'
      }
    }

    return Response.json(errorData, { status: 503 })
  }
}
