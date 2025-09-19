import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { z } from 'zod'
import { parseAndConvertToUTC } from '@/lib/utils/date-utils'
import { prisma } from '@/lib/prisma'
import { extractMerchantName } from '@/lib/utils/merchant-parser'

// Query parameter validation schema
const MerchantQuerySchema = z.object({
  categoryId: z.string().optional().transform(val => {
    if (!val) return null
    const numId = parseInt(val)
    return numId === 0 ? null : numId // Convert "0" to null for uncategorized
  }),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  transactionType: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  accountIds: z.string().optional(), // Comma-separated IDs
  isRecurring: z.enum(['true', 'false']).optional()
})

/**
 * GET /api/trends/merchants
 *
 * Get merchant breakdown for a specific category and time period
 * Used for tooltip functionality in trends table
 *
 * Query Parameters:
 * - categoryId: Category ID (or "0" for uncategorized)
 * - periodStart: Period start date (YYYY-MM-DD)
 * - periodEnd: Period end date (YYYY-MM-DD)
 * - transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER' (optional)
 * - accountIds: comma-separated account IDs (optional)
 * - isRecurring: 'true' | 'false' (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    console.log('🏪 Merchant API - Raw query params:', queryParams)
    console.log('🏪 Merchant API - URL:', request.url)

    const validatedParams = MerchantQuerySchema.parse(queryParams)
    console.log('🏪 Merchant API - Validated params:', validatedParams)

    // Build where clause for transaction query
    const where: any = {
      account: {
        tenant_id: user.tenantId,
        is_active: true
      },
      category_id: validatedParams.categoryId,
      date: {
        gte: parseAndConvertToUTC(validatedParams.periodStart),
        lte: parseAndConvertToUTC(validatedParams.periodEnd)
      }
    }

    // Add optional filters
    if (validatedParams.transactionType) {
      where.type = validatedParams.transactionType
    }

    if (validatedParams.accountIds) {
      const accountIds = validatedParams.accountIds
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id))

      if (accountIds.length > 0) {
        where.account_id = { in: accountIds }
      }
    }

    if (validatedParams.isRecurring) {
      where.is_recurring = validatedParams.isRecurring === 'true'
    }

    // Query transactions and aggregate by merchant
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        id: true,
        amount: true,
        description: true,
        merchant: true,
        date: true,
        type: true
      }
    })

    // Aggregate merchant data
    const merchantMap = new Map<string, {
      merchant: string
      totalAmount: number
      transactionCount: number
      sampleDescriptions: string[]
      sampleTransactions: Array<{
        id: number
        date: string
        amount: number
        description: string
        type: string
      }>
    }>()

    transactions.forEach(transaction => {
      const merchantName = transaction.merchant || extractMerchantName(transaction.description) || 'Unknown Merchant'

      if (!merchantMap.has(merchantName)) {
        merchantMap.set(merchantName, {
          merchant: merchantName,
          totalAmount: 0,
          transactionCount: 0,
          sampleDescriptions: [],
          sampleTransactions: []
        })
      }

      const merchantData = merchantMap.get(merchantName)!
      merchantData.totalAmount += Number(transaction.amount)
      merchantData.transactionCount += 1

      // Keep up to 3 sample descriptions for context
      if (merchantData.sampleDescriptions.length < 3) {
        merchantData.sampleDescriptions.push(transaction.description)
      }

      // Keep up to 5 sample transactions with full details
      if (merchantData.sampleTransactions.length < 5) {
        merchantData.sampleTransactions.push({
          id: transaction.id,
          date: transaction.date.toISOString().split('T')[0], // YYYY-MM-DD format
          amount: Number(transaction.amount),
          description: transaction.description,
          type: transaction.type
        })
      }
    })

    // Convert to array and sort by total amount (ascending - biggest expenses first)
    const merchants = Array.from(merchantMap.values()).sort((a, b) =>
      a.totalAmount - b.totalAmount
    )

    // Calculate summary statistics
    const summary = {
      totalAmount: merchants.reduce((sum, m) => sum + m.totalAmount, 0),
      totalTransactions: merchants.reduce((sum, m) => sum + m.transactionCount, 0),
      uniqueMerchants: merchants.length,
      periodStart: validatedParams.periodStart,
      periodEnd: validatedParams.periodEnd
    }

    return NextResponse.json({
      success: true,
      data: {
        merchants,
        summary
      }
    })

  } catch (error) {
    console.error('Error fetching merchant data:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
