import { NextRequest, NextResponse } from 'next/server'
import { AccountService } from '@/lib/services/account.service'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'
import { parseAndConvertToUTC } from '@/lib/utils/date-utils'

// Validation schemas
const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Account name too long').optional(),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'TRADITIONAL_RETIREMENT', 'ROTH_RETIREMENT']).optional(),
  net_worth_category: z.enum(['ASSET', 'LIABILITY', 'EXCLUDED']).optional(),
  balance: z.number().finite('Balance must be a valid number').optional(),
  balance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  is_active: z.boolean().optional()
})

/**
 * GET /api/accounts/[id] - Get a specific account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and get tenant context
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { tenantId } = user
    const resolvedParams = await params
    const accountId = parseInt(resolvedParams.id)

    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 })
    }

    const account = await AccountService.getAccountById(accountId, tenantId)

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: account
    })
  } catch (error) {
    console.error('GET /api/accounts/[id] error:', error)
    return NextResponse.json({
      error: 'Failed to fetch account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/accounts/[id] - Update a specific account
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and get tenant context
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { tenantId } = user
    const resolvedParams = await params
    const accountId = parseInt(resolvedParams.id)

    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = UpdateAccountSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid account data',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const updateData = validationResult.data

    // Convert date string to Date object if provided
    const processedUpdateData = { ...updateData }
    if (processedUpdateData.balance_date) {
      processedUpdateData.balance_date = parseAndConvertToUTC(processedUpdateData.balance_date)
    }

    // Update account
    const account = await AccountService.updateAccount(accountId, tenantId, processedUpdateData)

    return NextResponse.json({
      success: true,
      data: account
    })
  } catch (error) {
    console.error('PUT /api/accounts/[id] error:', error)

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json({
          error: 'Account with this name already exists'
        }, { status: 409 })
      }
    }

    return NextResponse.json({
      error: 'Failed to update account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/accounts/[id] - Delete a specific account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and get tenant context
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { tenantId } = user
    const resolvedParams = await params
    const accountId = parseInt(resolvedParams.id)

    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 })
    }

    // Delete account
    await AccountService.deleteAccount(accountId, tenantId)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/accounts/[id] error:', error)

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }
      if (error.message.includes('existing transactions')) {
        return NextResponse.json({
          error: 'Cannot delete account with existing transactions. Set to inactive instead.'
        }, { status: 409 })
      }
    }

    return NextResponse.json({
      error: 'Failed to delete account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
