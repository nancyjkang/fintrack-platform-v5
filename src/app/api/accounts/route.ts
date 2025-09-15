import { NextRequest } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/auth'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'
import { AccountService } from '@/lib/services/account.service'

// Validation schemas (aligned with new schema)
const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT', 'CASH'], {
    errorMap: () => ({ message: 'Type must be CHECKING, SAVINGS, CREDIT, INVESTMENT, or CASH' })
  }),
  balance: z.number().default(0),
  balance_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional(),
  color: z.string().min(1, 'Color is required'),
  is_active: z.boolean().default(true)
})

const querySchema = z.object({
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT', 'CASH']).optional(),
  is_active: z.string().optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
  search: z.string().optional(),
})

/**
 * GET /api/accounts
 * List accounts for the authenticated user's tenant
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
    const { type, is_active, search } = querySchema.parse(queryParams)

    // Build filters
    const filters: any = {}
    if (type) filters.type = type
    if (is_active !== undefined) filters.is_active = is_active
    if (search) filters.search = search

    // Get accounts using service
    const accounts = await AccountService.getAccounts(auth.tenantId, filters)

    return createSuccessResponse({
      accounts,
      total: accounts.length
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/accounts
 * Create a new account
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
    const validatedData = createAccountSchema.parse(body)

    // Create account using service
    const account = await AccountService.createAccount(auth.tenantId, {
      name: validatedData.name,
      type: validatedData.type,
      balance: validatedData.balance,
      balance_date: validatedData.balance_date ? new Date(validatedData.balance_date) : new Date(),
      color: validatedData.color,
      is_active: validatedData.is_active
    })

    return createSuccessResponse(account, 'Account created successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
