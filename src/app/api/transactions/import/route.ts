import { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { TransactionService } from '@/lib/services/transaction'
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-response'
import { parseAndConvertToUTC } from '@/lib/utils/date-utils'

interface ImportTransactionData {
  accountId: string
  date: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  category?: string
  notes?: string
  isRecurring?: boolean
}

interface ImportRequest {
  transactions: ImportTransactionData[]
  skipDuplicates: boolean
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
  duplicatesSkipped: number
}

/**
 * POST /api/transactions/import - Import multiple transactions from CSV
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return createErrorResponse('Authentication required', 401)
    }

    const body: ImportRequest = await request.json()
    const { transactions, skipDuplicates = true } = body

    console.log('Import API received:', { 
      transactionCount: transactions?.length, 
      skipDuplicates,
      tenantId: auth.tenantId,
      firstTransaction: transactions?.[0]
    })

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return createErrorResponse('No transactions provided for import', 400)
    }

    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
      duplicatesSkipped: 0
    }

    // Validate and prepare transactions for bulk processing
    const validTransactions: Array<{
      account_id: number
      amount: number
      description: string
      date: Date
      type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
      category_id?: number
      is_recurring: boolean
    }> = []
    
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i]

      try {
        // Validate required fields
        if (!transaction.accountId || !transaction.date || !transaction.description || transaction.amount === 0) {
          result.errors.push(`Transaction ${i + 1}: Missing required fields`)
          result.skipped++
          continue
        }

        // Parse and validate date
        let parsedDate: Date
        try {
          parsedDate = parseAndConvertToUTC(transaction.date)
        } catch (error) {
          result.errors.push(`Transaction ${i + 1}: Invalid date format`)
          result.skipped++
          continue
        }

        // Convert transaction type to Prisma enum
        let transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER'
        switch (transaction.type) {
          case 'INCOME':
            transactionType = 'INCOME'
            break
          case 'EXPENSE':
            transactionType = 'EXPENSE'
            break
          case 'TRANSFER':
            transactionType = 'TRANSFER'
            break
          default:
            transactionType = 'EXPENSE' // Default fallback
        }

        // Check for duplicates if enabled
        if (skipDuplicates) {
          const existingTransactions = await TransactionService.getTransactions(
            auth.tenantId,
            {
              account_id: parseInt(transaction.accountId),
              date_from: parsedDate,
              date_to: parsedDate,
              search: transaction.description
            }
          )

          if (existingTransactions.length > 0) {
            result.duplicatesSkipped++
            continue
          }
        }

        // Add to valid transactions for bulk processing
        validTransactions.push({
          account_id: parseInt(transaction.accountId),
          amount: transaction.amount,
          description: transaction.description,
          date: parsedDate,
          type: transactionType,
          category_id: transaction.category ? parseInt(transaction.category) : undefined,
          is_recurring: transaction.isRecurring || false
        })

      } catch (error) {
        console.error(`Error validating transaction ${i + 1}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Transaction ${i + 1}: ${errorMessage}`)
        result.skipped++
      }
    }

    // Bulk create all valid transactions with trend cube integration
    if (validTransactions.length > 0) {
      try {
        console.log(`Bulk creating ${validTransactions.length} transactions with trend cube integration...`)
        
        const bulkResult = await TransactionService.bulkCreateTransactions(
          validTransactions,
          auth.tenantId
        )
        
        result.imported = bulkResult.createdCount
        
        console.log(`✅ Bulk import completed: ${result.imported} transactions created with trend cube updated`)
      } catch (error) {
        console.error('Bulk create failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Bulk import failed'
        result.errors.push(`Bulk import error: ${errorMessage}`)
        result.skipped += validTransactions.length
      }
    }

    return createSuccessResponse(result, `Import completed: ${result.imported} imported, ${result.skipped} skipped`)

  } catch (error) {
    console.error('POST /api/transactions/import error:', error)
    return handleApiError(error)
  }
}
