import { NextRequest, NextResponse } from 'next/server'
import { AccountBalanceHistoryService } from '@/lib/services/account-balance-history.service'
import { validateRequestBody, createApiResponse, createApiError } from '@/lib/api-response'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
  { params }: { params: { id: string } }
) {
  try {
    // 1. Validate authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        createApiError('Unauthorized', 401),
        { status: 401 }
      )
    }

    // 2. Parse and validate parameters
    const accountId = parseInt(params.id)
    if (isNaN(accountId)) {
      return NextResponse.json(
        createApiError('Invalid account ID', 400),
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    // 3. Validate date formats if provided
    if (startDate && !isValidDateFormat(startDate)) {
      return NextResponse.json(
        createApiError('Invalid startDate format. Use YYYY-MM-DD', 400),
        { status: 400 }
      )
    }

    if (endDate && !isValidDateFormat(endDate)) {
      return NextResponse.json(
        createApiError('Invalid endDate format. Use YYYY-MM-DD', 400),
        { status: 400 }
      )
    }

    // 4. Validate date range logic
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        createApiError('Start date must be before or equal to end date', 400),
        { status: 400 }
      )
    }

    // 5. Get balance history using service
    const service = new AccountBalanceHistoryService()
    const balanceHistory = await service.getAccountBalanceHistory(
      session.user.tenantId,
      accountId,
      startDate,
      endDate
    )

    // 6. Return successful response
    return NextResponse.json(
      createApiResponse(balanceHistory, 'Balance history retrieved successfully'),
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Balance history API error:', error)

    // Handle specific error types
    if (error.message.includes('not found or access denied')) {
      return NextResponse.json(
        createApiError('Account not found or access denied', 404),
        { status: 404 }
      )
    }

    // Generic server error
    return NextResponse.json(
      createApiError('Failed to retrieve balance history', 500),
      { status: 500 }
    )
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
  const date = new Date(dateString)
  const [year, month, day] = dateString.split('-').map(Number)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 && // Month is 0-indexed
    date.getDate() === day
  )
}
