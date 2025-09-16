import { NextRequest, NextResponse } from 'next/server'
import { AccountService } from '@/lib/services/account.service'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'
import { parseAndConvertToUTC } from '@/lib/utils/date-utils'

// Validation schemas
const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Account name too long'),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'TRADITIONAL_RETIREMENT', 'ROTH_RETIREMENT']),
  net_worth_category: z.enum(['ASSET', 'LIABILITY', 'EXCLUDED']).optional(),
  balance: z.number().finite('Balance must be a valid number'),
  balance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
  is_active: z.boolean().optional()
})

const AccountFiltersSchema = z.object({
  type: z.string().nullable().optional(),
  is_active: z.string().nullable().optional().transform(val => val === null ? null : val === 'true'),
  search: z.string().nullable().optional()
})

/**
 * GET /api/accounts - Get all accounts for the authenticated user's tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and get tenant context
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { tenantId } = user

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filtersResult = AccountFiltersSchema.safeParse({
      type: searchParams.get('type'),
      is_active: searchParams.get('is_active'),
      search: searchParams.get('search')
    })

    if (!filtersResult.success) {
      return NextResponse.json({
        error: 'Invalid filters',
        details: filtersResult.error.errors
      }, { status: 400 })
    }

    // Filter out null values from the filters
    const filters = Object.fromEntries(
      Object.entries(filtersResult.data).filter(([_, value]) => value !== null)
    )

    const accounts = await AccountService.getAccounts(tenantId, filters)

    return NextResponse.json({
      success: true,
      data: accounts,
      count: accounts.length
    })
  } catch (error) {
    console.error('GET /api/accounts error:', error)
    return NextResponse.json({
      error: 'Failed to fetch accounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/accounts - Create a new account
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get tenant context
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { tenantId } = user

    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateAccountSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid account data',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const accountData = validationResult.data

    // Convert date string to Date object
    const balanceDate = parseAndConvertToUTC(accountData.balance_date)

    // Create account
    const account = await AccountService.createAccount(tenantId, {
      name: accountData.name,
      type: accountData.type,
      net_worth_category: accountData.net_worth_category,
      balance: accountData.balance,
      balance_date: balanceDate,
      color: accountData.color,
      is_active: accountData.is_active
    })

    return NextResponse.json({
      success: true,
      data: account
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/accounts error:', error)

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({
          error: 'Account with this name already exists'
        }, { status: 409 })
      }
    }

    return NextResponse.json({
      error: 'Failed to create account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
