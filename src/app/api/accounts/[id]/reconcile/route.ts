import { NextRequest, NextResponse } from 'next/server'
import { AccountService, type ReconcileAccountData } from '@/lib/services/account.service'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

// Validation schema
const ReconcileAccountSchema = z.object({
  newBalance: z.number().finite('New balance must be a valid number'),
  reconcileDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
})

/**
 * POST /api/accounts/[id]/reconcile - Reconcile account balance
 */
export async function POST(
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
    const validationResult = ReconcileAccountSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid reconciliation data',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const reconcileData = validationResult.data as ReconcileAccountData

    // Reconcile account
    const result = await AccountService.reconcileAccount(accountId, tenantId, reconcileData)

    return NextResponse.json({
      success: true,
      data: {
        account: result.account,
        adjustmentTransaction: result.adjustmentTransaction,
        message: result.adjustmentTransaction
          ? 'Account reconciled with adjustment transaction created'
          : 'Account reconciled - no adjustment needed'
      }
    })
  } catch (error) {
    console.error('POST /api/accounts/[id]/reconcile error:', error)

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }
      if (error.message.includes('future')) {
        return NextResponse.json({
          error: 'Reconciliation date cannot be in the future'
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      error: 'Failed to reconcile account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
