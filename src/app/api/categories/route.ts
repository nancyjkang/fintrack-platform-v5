import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/services/category'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const categoryService = new CategoryService()

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], {
    errorMap: () => ({ message: 'Type must be INCOME, EXPENSE, or TRANSFER' })
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
})

const getCategoriesSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  search: z.string().optional()
})

/**
 * GET /api/categories
 * Get all categories for the authenticated user's tenant
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
      type: searchParams.get('type') || undefined,
      search: searchParams.get('search') || undefined
    }

    // Validate query parameters
    const validationResult = getCategoriesSchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const filters = validationResult.data

    // Get categories
    const categories = await categoryService.getCategories(tenantId, filters)

    return NextResponse.json({
      success: true,
      data: {
        categories,
        count: categories.length
      }
    })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 * Create a new category
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
    const validationResult = createCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid category data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const categoryData = validationResult.data as { name: string; type: 'INCOME' | 'EXPENSE' | 'TRANSFER'; color: string }

    // Create category
    const category = await categoryService.createCategory(tenantId, categoryData)

    return NextResponse.json({
      success: true,
      data: { category },
      message: 'Category created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating category:', error)

    // Handle specific business logic errors
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        {
          error: 'Category already exists',
          details: error.message
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
