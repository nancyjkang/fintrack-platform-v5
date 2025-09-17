import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/api-response'
import { TransactionService } from '@/lib/services/transaction.service'
import { getCurrentUTCDate, parseAndConvertToUTC } from '@/lib/utils/date-utils'

// Validation schemas
const bulkUpdateSchema = z.object({
  transactionIds: z.array(z.number()).min(1, 'At least one transaction ID is required'),
  updates: z.object({
    category_id: z.number().nullable().optional(),
    account_id: z.number().optional(),
    amount: z.string().transform(val => parseFloat(val)).optional(),
    description: z.string().optional(),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
    is_recurring: z.boolean().optional(),
    date: z.string().transform(val => parseAndConvertToUTC(val)).optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
  })
})

const bulkDeleteSchema = z.object({
  transactionIds: z.array(z.number()).min(1, 'At least one transaction ID is required')
})


/**
 * GET /api/transactions/bulk - Test endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Bulk API endpoint is working!',
    timestamp: getCurrentUTCDate().toISOString(),
    url: request.url
  })
}


/**
 * PATCH /api/transactions/bulk - Bulk update transactions
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user using JWT Bearer token
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'))
    }

    const body = await request.json()

    // Validate input
    const validationResult = bulkUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Invalid request data',
          data: validationResult.error.issues,
          timestamp: getCurrentUTCDate().toISOString()
        },
        { status: 400 }
      )
    }

    const { transactionIds, updates } = validationResult.data


    // Perform bulk update using our optimized service
    await TransactionService.bulkUpdateTransactions(transactionIds, updates, auth.tenantId)

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully updated ${transactionIds.length} transaction(s)`,
        updatedCount: transactionIds.length,
        updatedAt: getCurrentUTCDate()
      },
      timestamp: getCurrentUTCDate().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: getCurrentUTCDate().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transactions/bulk - Bulk delete transactions
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user using JWT Bearer token
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'))
    }

    const body = await request.json()

    // Validate input
    const validationResult = bulkDeleteSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Invalid request data',
          data: validationResult.error.issues,
          timestamp: getCurrentUTCDate().toISOString()
        },
        { status: 400 }
      )
    }

    const { transactionIds } = validationResult.data

    // Perform bulk delete using our optimized service
    const result = await TransactionService.bulkDeleteTransactions(transactionIds, auth.tenantId)
    const deletedCount = result.deletedCount

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully deleted ${deletedCount} transaction(s)`,
        deletedCount,
        requestedCount: transactionIds.length,
        deletedAt: getCurrentUTCDate()
      },
      timestamp: getCurrentUTCDate().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: getCurrentUTCDate().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions/bulk - Bulk create transactions (for imports)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user using JWT Bearer token
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'))
    }

    return NextResponse.json(
      {
        error: 'Bulk create not implemented yet',
        message: 'Use individual POST /api/transactions for now'
      },
      { status: 501 }
    )

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: getCurrentUTCDate().toISOString()
      },
      { status: 500 }
    )
  }
}
