import { NextRequest, NextResponse } from 'next/server'
import { AccountBalanceHistoryService } from '@/lib/services/account-balance-history.service'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'
import { verifyAuth } from '@/lib/auth'
import { createUTCDate } from '@/lib/utils/date-utils'

/**
 * GET /api/accounts/[id]/balance-history
 *
 * Get balance history for a specific account with optional date range filtering.
 * Follows MVP accounting system for accurate balance calculations.
 *
 * Query Parameters:
 * - startDate (optional): Start date in YYYY-MM-DD format
 * - endDate (optional): End date in YYYY-MM-DD format
 *
 * Returns:
 * - 200: Array of BalanceHistoryData objects
 * - 400: Invalid request parameters
 * - 401: Unauthorized
 * - 404: Account not found
 * - 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validate authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'))
    }

    // 2. Await params (Next.js 15 requirement)
    const { id } = await params

    // 3. Parse and validate parameters
    const accountId = parseInt(id)
    if (isNaN(accountId)) {
      return handleApiError(new Error('Invalid account ID'))
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    // 4. Validate date formats if provided
    if (startDate && !isValidDateFormat(startDate)) {
      return handleApiError(new Error('Invalid startDate format. Use YYYY-MM-DD'))
    }

    if (endDate && !isValidDateFormat(endDate)) {
      return handleApiError(new Error('Invalid endDate format. Use YYYY-MM-DD'))
    }

    // 5. Validate date range logic
    if (startDate && endDate && startDate > endDate) {
      return handleApiError(new Error('Start date must be before or equal to end date'))
    }

    // 6. Get balance history using service
    const service = new AccountBalanceHistoryService()
    const balanceHistory = await service.getAccountBalanceHistory(
      auth.tenantId,
      accountId,
      startDate,
      endDate
    )

    // 7. Return successful response
    return createSuccessResponse(balanceHistory, 'Balance history retrieved successfully')

  } catch (error: any) {
    console.error('Balance history API error:', error)
    return handleApiError(error)
  }
}

/**
 * Validate date format (YYYY-MM-DD)
 *
 * @param dateString - Date string to validate
 * @returns boolean - True if valid format
 */
function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return false
  }

  // Validate that it's a real date
  const [year, month, day] = dateString.split('-').map(Number)

  // Simple validation - check if it's a valid date
  // eslint-disable-next-line no-restricted-globals
  const date = new Date(year, month - 1, day) // Month is 0-indexed in Date constructor

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 && // Month is 0-indexed
    date.getDate() === day
  )
}
