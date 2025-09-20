import { NextRequest, NextResponse } from 'next/server'
import { AccountBalanceHistoryService } from '@/lib/services/account'
import { TransactionService } from '@/lib/services/transaction'
import { verifyAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/api-response'
import { createUTCDate, getCurrentUTCDate, subtractDays, parseAndConvertToUTC, toUTCDateString } from '@/lib/utils/date-utils'
import type { Transaction } from '@prisma/client'

/**
 * GET /api/accounts/[id]/transactions-with-balances
 *
 * Returns transactions with running balances calculated using balance anchors as primary source of truth.
 * This endpoint provides the same balance calculation logic as the balance-history endpoint
 * but returns individual transactions instead of daily summaries.
 */
export async function GET(
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

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit')
    const sortOrder = searchParams.get('sortOrder') || 'desc' // Default to descending for display

    // 5. Validate date formats if provided
    if (startDate && !isValidDateFormat(startDate)) {
      return handleApiError(new Error('Invalid startDate format. Use YYYY-MM-DD'))
    }

    if (endDate && !isValidDateFormat(endDate)) {
      return handleApiError(new Error('Invalid endDate format. Use YYYY-MM-DD'))
    }

    // 6. Handle date range - if no dates provided, fetch all transactions (no date filter)
    let finalStartDate: Date | undefined;
    let finalEndDate: Date | undefined;

    if (startDate) {
      finalStartDate = createUTCDate(
        parseInt(startDate.split('-')[0]),
        parseInt(startDate.split('-')[1]) - 1,
        parseInt(startDate.split('-')[2])
      );
    }

    if (endDate) {
      finalEndDate = createUTCDate(
        parseInt(endDate.split('-')[0]),
        parseInt(endDate.split('-')[1]) - 1,
        parseInt(endDate.split('-')[2])
      );
    }

    // 7. Initialize service and get transactions with running balances
    const service = new AccountBalanceHistoryService()

    // Build filters for TransactionService - only include date filters if provided
    const filters: Record<string, unknown> = {
      account_id: accountId
    };

    if (finalStartDate) {
      filters.date_from = finalStartDate;
    }
    if (finalEndDate) {
      filters.date_to = finalEndDate;
    }

    // Get transactions in the specified date range
    const transactions = await TransactionService.getTransactions(auth.tenantId, filters)

    // For date-filtered requests, we need to calculate the correct starting balance
    // The anchor-based method assumes all transactions since anchor, but we're filtering by date
    let transactionsWithBalance: Array<Transaction & { balance: number }>;

    if (finalStartDate || finalEndDate) {
      // Date filtering is active - calculate proper starting balance for the range
      transactionsWithBalance = await service.calculateRunningBalancesForDateRange(
        transactions.transactions,
        accountId,
        auth.tenantId,
        finalStartDate,
        finalEndDate
      );
    } else {
      // No date filtering - use standard anchor-based calculation
      transactionsWithBalance = await service.calculateRunningBalancesFromAnchor(
        transactions.transactions,
        accountId,
        auth.tenantId
      );
    }

    // Sort transactions based on requested order using deterministic sorting
    // This must match the sorting used in calculateRunningBalancesFromAnchor to preserve balance calculation order
    const sortedTransactions = [...transactionsWithBalance].sort((a, b) => {
      const dateA = toUTCDateString(a.date)
      const dateB = toUTCDateString(b.date)

      // Primary: sort by date
      if (dateA !== dateB) {
        return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA)
      }

      // Secondary: sort by ID (deterministic for same-date transactions)
      if (a.id !== b.id) {
        return sortOrder === 'asc' ? a.id - b.id : b.id - a.id
      }

      // Tertiary: sort by description (for human readability)
      const descCompare = (a.description || '').localeCompare(b.description || '')
      return sortOrder === 'asc' ? descCompare : -descCompare
    })

    return NextResponse.json({
      success: true,
      data: {
        transactions: sortedTransactions,
        count: sortedTransactions.length,
        dateRange: {
          startDate: finalStartDate ? toUTCDateString(finalStartDate) : null,
          endDate: finalEndDate ? toUTCDateString(finalEndDate) : null
        },
        calculationMethod: 'balance-anchor-primary', // Indicates which method was used
        metadata: {
          sortOrder,
          limit: limit ? parseInt(limit) : null
        }
      }
    })

  } catch (error: unknown) {
    console.error('Error in transactions-with-balances API:', error)
    return handleApiError(error)
  }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDateFormat(dateString: string): boolean {
  try {
    const date = parseAndConvertToUTC(dateString)
    if (isNaN(Number(date))) return false

    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + 1
    const day = date.getUTCDate()

    const expectedFormat = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    return dateString === expectedFormat
  } catch {
    return false
  }
}
