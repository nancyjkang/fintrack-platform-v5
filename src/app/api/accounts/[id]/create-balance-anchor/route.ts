import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/api-response'
import { toUTCDateString } from '@/lib/utils/date-utils'

/**
 * POST /api/accounts/[id]/create-balance-anchor
 * 
 * Creates a balance anchor for an account using its current balance and balance_date
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'))
    }

    // 2. Await params (Next.js 15 requirement)
    const { id } = await params

    // 3. Parse and validate account ID
    const accountId = parseInt(id)
    if (isNaN(accountId)) {
      return handleApiError(new Error('Invalid account ID'))
    }

    // 4. Get the account
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        tenant_id: auth.tenantId
      }
    })

    if (!account) {
      return handleApiError(new Error('Account not found'))
    }

    // 5. Check if anchor already exists
    const existingAnchor = await prisma.accountBalanceAnchor.findFirst({
      where: {
        account_id: accountId,
        tenant_id: auth.tenantId
      }
    })

    if (existingAnchor) {
      return NextResponse.json({
        success: true,
        message: 'Balance anchor already exists',
        data: {
          anchor_date: toUTCDateString(existingAnchor.anchor_date),
          balance: existingAnchor.balance,
          created: false
        }
      })
    }

    // 6. Create the balance anchor
    const anchor = await prisma.accountBalanceAnchor.create({
      data: {
        tenant_id: auth.tenantId,
        account_id: accountId,
        anchor_date: account.balance_date || account.created_at,
        balance: account.balance
      }
    })

    console.log(`✅ Created balance anchor for account ${accountId} (${account.name}): ${toUTCDateString(anchor.anchor_date)} = $${anchor.balance}`)

    return NextResponse.json({
      success: true,
      message: 'Balance anchor created successfully',
      data: {
        anchor_date: toUTCDateString(anchor.anchor_date),
        balance: anchor.balance,
        created: true
      }
    })

  } catch (error: unknown) {
    console.error('Error creating balance anchor:', error)
    return handleApiError(error)
  }
}
