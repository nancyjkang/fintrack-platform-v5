import { NextRequest } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/auth'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'
import { TransactionService } from '@/lib/services/transaction.service'
import { isValidDateString, parseAndConvertToUTC } from '@/lib/utils/date-utils'

// Validation schemas
const updateTransactionSchema = z.object({
  account_id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().optional(),
  amount: z.number().min(0.01).optional(),
  description: z.string().min(1).optional(),
  date: z.string().refine((date) => isValidDateString(date)).optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  is_recurring: z.boolean().optional(),
})

/**
 * GET /api/transactions/[id]
 * Get a specific transaction by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'))
    }

    // Get transaction ID from params
    const { id } = await params
    const transactionId = parseInt(id)

    if (isNaN(transactionId)) {
      return handleApiError(new Error('Invalid transaction ID'))
    }

    // Get transaction using service
    const transaction = await TransactionService.getTransactionById(transactionId, auth.tenantId)

    if (!transaction) {
      return handleApiError(new Error('Transaction not found'))
    }

    return createSuccessResponse(transaction)

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/transactions/[id]
 * Update a specific transaction
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'))
    }

    // Get transaction ID from params
    const { id } = await params
    const transactionId = parseInt(id)

    if (isNaN(transactionId)) {
      return handleApiError(new Error('Invalid transaction ID'))
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateTransactionSchema.parse(body)

    // Prepare update data
    const updateData: any = {}
    if (validatedData.account_id !== undefined) updateData.account_id = validatedData.account_id
    if (validatedData.category_id !== undefined) updateData.category_id = validatedData.category_id
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.date !== undefined) updateData.date = parseAndConvertToUTC(validatedData.date)
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.is_recurring !== undefined) updateData.is_recurring = validatedData.is_recurring

    // Update transaction using service
    const transaction = await TransactionService.updateTransaction(transactionId, auth.tenantId, updateData)

    return createSuccessResponse(transaction, 'Transaction updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/transactions/[id]
 * Delete a specific transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'))
    }

    // Get transaction ID from params
    const { id } = await params
    const transactionId = parseInt(id)

    if (isNaN(transactionId)) {
      return handleApiError(new Error('Invalid transaction ID'))
    }

    // Delete transaction using service
    await TransactionService.deleteTransaction(transactionId, auth.tenantId)

    return createSuccessResponse({ deleted: true }, 'Transaction deleted successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
