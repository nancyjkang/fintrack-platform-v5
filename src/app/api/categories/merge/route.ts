import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/services/category.service'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const categoryService = new CategoryService()

// Validation schema
const mergeCategoriesSchema = z.object({
  sourceCategoryId: z.number().int().positive('Source category ID must be a positive integer'),
  targetCategoryId: z.number().int().positive('Target category ID must be a positive integer')
}).refine(data => data.sourceCategoryId !== data.targetCategoryId, {
  message: 'Source and target categories must be different'
})

/**
 * POST /api/categories/merge
 * Merge two categories (move all transactions from source to target, then delete source)
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validationResult = mergeCategoriesSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid merge data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { sourceCategoryId, targetCategoryId } = validationResult.data

    // Perform merge operation
    const result = await categoryService.mergeCategories(
      tenantId,
      sourceCategoryId,
      targetCategoryId
    )

    if (!result.success) {
      // Handle business logic errors
      if (result.error?.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Category not found',
            details: result.error
          },
          { status: 404 }
        )
      }

      if (result.error?.includes('Cannot merge')) {
        return NextResponse.json(
          {
            error: 'Invalid merge operation',
            details: result.error
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: 'Merge operation failed',
          details: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionsUpdated: result.transactionsUpdated,
        sourceCategoryDeleted: result.sourceCategoryDeleted
      },
      message: `Successfully merged categories. ${result.transactionsUpdated} transactions updated.`
    })

  } catch (error) {
    console.error('Error merging categories:', error)
    return NextResponse.json(
      {
        error: 'Failed to merge categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
