import { NextRequest } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/auth'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'
import { TransactionService } from '@/lib/services/transaction.service'

// Validation schemas (aligned with new schema)
const createTransactionSchema = z.object({
  account_id: z.number().int().positive('Account ID must be a positive integer'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], {
    errorMap: () => ({ message: 'Type must be INCOME, EXPENSE, or TRANSFER' })
  }),
  is_recurring: z.boolean().default(false),
  category_id: z.number().int().positive().optional(),
})

const querySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val) || 20, 100) : 20),
  account_id: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
  category_id: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  is_recurring: z.string().optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
  search: z.string().optional(),
  date_from: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  date_to: z.string().optional().transform((val) => val ? new Date(val) : undefined),
})

/**
 * GET /api/transactions
 * List transactions for the authenticated user's tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'))
    }

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const { page, limit, account_id, category_id, type, is_recurring, search, date_from, date_to } = querySchema.parse(queryParams)

    // Build filters
    const filters: any = {}
    if (account_id) filters.account_id = account_id
    if (category_id) filters.category_id = category_id
    if (type) filters.type = type
    if (is_recurring !== undefined) filters.is_recurring = is_recurring
    if (search) filters.search = search
    if (date_from) filters.date_from = date_from
    if (date_to) filters.date_to = date_to

    // Get transactions using service
    const transactions = await TransactionService.getTransactions(auth.tenantId, filters)

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedTransactions = transactions.slice(startIndex, endIndex)

    return createSuccessResponse({
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: transactions.length,
        totalPages: Math.ceil(transactions.length / limit)
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'))
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createTransactionSchema.parse(body)

    // Create transaction using service
    const transaction = await TransactionService.createTransaction(auth.tenantId, {
      account_id: validatedData.account_id,
      category_id: validatedData.category_id,
      amount: validatedData.amount,
      description: validatedData.description,
      date: new Date(validatedData.date),
      type: validatedData.type,
      is_recurring: validatedData.is_recurring
    })

    return createSuccessResponse(transaction, 'Transaction created successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
