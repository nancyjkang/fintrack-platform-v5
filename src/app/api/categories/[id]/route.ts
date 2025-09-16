import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/services/category.service'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const categoryService = new CategoryService()

// Validation schemas
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long').optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], {
    errorMap: () => ({ message: 'Type must be INCOME, EXPENSE, or TRANSFER' })
  }).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
})

/**
 * GET /api/categories/[id]
 * Get a specific category by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Parse and validate category ID
    const resolvedParams = await params
    const categoryId = parseInt(resolvedParams.id)
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }

    // Get category
    const category = await categoryService.getCategoryById(tenantId, categoryId)

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { category }
    })

  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/categories/[id]
 * Update a specific category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Parse and validate category ID
    const resolvedParams = await params
    const categoryId = parseInt(resolvedParams.id)
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validationResult = updateCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid category data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Update category
    const category = await categoryService.updateCategory(tenantId, categoryId, updateData)

    return NextResponse.json({
      success: true,
      data: { category },
      message: 'Category updated successfully'
    })

  } catch (error) {
    console.error('Error updating category:', error)

    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message === 'Category not found') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          {
            error: 'Category already exists',
            details: error.message
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to update category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a specific category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Parse and validate category ID
    const resolvedParams = await params
    const categoryId = parseInt(resolvedParams.id)
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }

    // Delete category
    await categoryService.deleteCategory(tenantId, categoryId)

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting category:', error)

    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message === 'Category not found') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('Cannot delete category')) {
        return NextResponse.json(
          {
            error: 'Cannot delete category',
            details: error.message
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to delete category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
