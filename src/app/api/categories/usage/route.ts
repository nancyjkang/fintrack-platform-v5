import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/services/category.service'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const categoryService = new CategoryService()

// Validation schema
const getUsageStatsSchema = z.object({
  categoryIds: z.string().optional().transform((val) => {
    if (!val) return undefined
    return val.split(',').map(id => {
      const parsed = parseInt(id.trim())
      if (isNaN(parsed)) throw new Error(`Invalid category ID: ${id}`)
      return parsed
    })
  })
})

/**
 * GET /api/categories/usage
 * Get usage statistics for categories (transaction counts)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: userId, tenantId } = user

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      categoryIds: searchParams.get('categoryIds') || undefined
    }

    // Validate query parameters
    const validationResult = getUsageStatsSchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { categoryIds } = validationResult.data

    // Get usage statistics
    const usageStats = await categoryService.getCategoryUsageStats(userId, tenantId, categoryIds)

    return NextResponse.json({
      success: true,
      data: {
        usageStats,
        count: usageStats.length
      }
    })

  } catch (error) {
    console.error('Error fetching category usage stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch category usage statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
