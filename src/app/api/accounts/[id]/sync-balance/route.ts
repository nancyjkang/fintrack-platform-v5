import { NextRequest } from 'next/server'
import { AccountBalanceHistoryService } from '@/lib/services/account-balance-history.service'
import { verifyAuth } from '@/lib/auth'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'

/**
 * POST /api/accounts/[id]/sync-balance
 *
 * Synchronizes the account balance in the accounts table with the calculated balance
 * from balance anchors and transactions. This ensures data integrity according to
 * the MVP accounting system: accounts.balance === latest_anchor.balance + sum(transactions_after_latest_anchor)
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

    // 4. Initialize service and sync balance
    const service = new AccountBalanceHistoryService()
    const result = await service.syncAccountBalance(auth.tenantId, accountId)

    return createSuccessResponse({
      accountId,
      oldBalance: result.oldBalance,
      newBalance: result.newBalance,
      updated: result.updated,
      message: result.updated
        ? `Account balance updated from $${result.oldBalance} to $${result.newBalance}`
        : `Account balance is already in sync at $${result.oldBalance}`
    })

  } catch (error: unknown) {
    console.error('Error in sync-balance API:', error)
    return handleApiError(error)
  }
}
