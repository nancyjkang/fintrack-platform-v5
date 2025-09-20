import { BaseService } from '../base'
import type { Transaction, Account, Category } from '@prisma/client'
import { getCurrentUTCDate } from '@/lib/utils/date-utils'
import { cubeService, CubeService } from '../cube'
import type { CubeRelevantFields, BulkUpdateMetadata } from '@/lib/types/cube-delta.types'
import { Decimal } from '@prisma/client/runtime/library'
import { extractMerchantName } from '@/lib/utils/merchant-parser'
import { defaultCategoriesService } from '../category/default-categories.service'

// Interface for bulk update data
interface BulkUpdateData {
  category_id?: number | null
  account_id?: number
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount?: number
  is_recurring?: boolean
  description?: string
  merchant?: string | null
}

// Interface for transaction data used in cube operations
interface TransactionForCube {
  id: number
  account_id: number
  category_id: number | null
  amount: Decimal
  date: Date
  type: string
  is_recurring: boolean
}

export interface CreateTransactionData {
  account_id: number
  category_id?: number
  amount: number
  description: string
  // eslint-disable-next-line no-restricted-globals
  date: Date // Keep as Date for Prisma compatibility - conversion happens in API layer
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  is_recurring?: boolean
}

export interface UpdateTransactionData {
  account_id?: number
  category_id?: number
  amount?: number
  description?: string
  // eslint-disable-next-line no-restricted-globals
  date?: Date
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  is_recurring?: boolean
}

export interface TransactionFilters {
  account_id?: number
  category_id?: number | null
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  is_recurring?: boolean
  // eslint-disable-next-line no-restricted-globals
  date_from?: Date
  // eslint-disable-next-line no-restricted-globals
  date_to?: Date
  search?: string
  sort_field?: string
  sort_direction?: string
  // Pagination parameters
  page?: number
  limit?: number
}

export interface TransactionWithRelations extends Transaction {
  account: Account
  category: Category | null
}

/**
 * Transaction service for managing financial transactions
 */
export class TransactionService extends BaseService {

  /**
   * Get paginated transactions for a tenant with optional filters
   */
  static async getTransactions(
    tenantId: string,
    filters?: TransactionFilters
  ): Promise<{
    transactions: TransactionWithRelations[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      this.validateTenantId(tenantId)

      const where: Record<string, unknown> = {
        tenant_id: tenantId
      }

      // Apply filters
      if (filters) {
        if (filters.account_id) where.account_id = filters.account_id
        if (filters.category_id !== undefined) {
          // Handle both specific category ID and null (uncategorized)
          where.category_id = filters.category_id
        }
        if (filters.type) where.type = filters.type
        if (filters.is_recurring !== undefined) where.is_recurring = filters.is_recurring

        if (filters.date_from || filters.date_to) {
          where.date = {} as Record<string, unknown>
          if (filters.date_from) (where.date as Record<string, unknown>).gte = filters.date_from
          if (filters.date_to) (where.date as Record<string, unknown>).lte = filters.date_to
        }

        if (filters.search) {
          where.description = {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      }

      // Build orderBy clause based on sort parameters
      let orderBy: Record<string, string | Record<string, string>> = { date: 'desc' } // Default sorting

      if (filters?.sort_field && filters?.sort_direction) {
        const sortField = filters.sort_field as string
        const sortDirection = filters.sort_direction as 'asc' | 'desc'

        switch (sortField) {
          case 'date':
            orderBy = { date: sortDirection }
            break
          case 'description':
            orderBy = { description: sortDirection }
            break
          case 'amount':
            orderBy = { amount: sortDirection }
            break
          case 'type':
            orderBy = { type: sortDirection }
            break
          case 'category':
            orderBy = { category: { name: sortDirection } }
            break
          case 'account':
            orderBy = { account: { name: sortDirection } }
            break
          default:
            orderBy = { date: 'desc' }
        }
      }

      // Extract pagination parameters
      const page = filters?.page || 1
      const limit = filters?.limit || 50
      const skip = (page - 1) * limit

      // Get total count and transactions in parallel for better performance
      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where,
          include: {
            account: true,
            category: true
          },
          orderBy,
          skip,
          take: limit
        }),
        this.prisma.transaction.count({ where })
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        transactions,
        total,
        page,
        totalPages
      }
    } catch (error) {
      return this.handleError(error, 'TransactionService.getTransactions')
    }
  }

  /**
   * Get a single transaction by ID (with tenant validation)
   */
  static async getTransactionById(
    id: number,
    tenantId: string
  ): Promise<TransactionWithRelations | null> {
    try {
      this.validateTenantId(tenantId)

      const transaction = await this.prisma.transaction.findFirst({
        where: {
          id,
          tenant_id: tenantId
        },
        include: {
          account: true,
          category: true
        }
      })

      return transaction
    } catch (error) {
      return this.handleError(error, 'TransactionService.getTransactionById')
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(
    tenantId: string,
    data: CreateTransactionData
  ): Promise<TransactionWithRelations> {
    try {
      this.validateTenantId(tenantId)

      // Validate that account belongs to tenant
      const account = await this.prisma.account.findFirst({
        where: {
          id: data.account_id,
          tenant_id: tenantId
        }
      })

      if (!account) {
        throw new Error('Account not found or does not belong to tenant')
      }

      // Validate category if provided
      if (data.category_id) {
        const category = await this.prisma.category.findFirst({
          where: {
            id: data.category_id,
            tenant_id: tenantId
          }
        })

        if (!category) {
          throw new Error('Category not found or does not belong to tenant')
        }
      }

      // Auto-parse merchant from description
      const merchant = extractMerchantName(data.description);

      // If no category provided, use default "Uncategorized" category
      let categoryId = data.category_id;
      if (!categoryId) {
        categoryId = await defaultCategoriesService.getDefaultCategoryId(
          tenantId,
          data.type as 'INCOME' | 'EXPENSE' | 'TRANSFER'
        );
      }

      const transaction = await this.prisma.transaction.create({
        data: {
          tenant_id: tenantId,
          account_id: data.account_id,
          category_id: categoryId,
          amount: data.amount,
          description: data.description,
          merchant: merchant,
          date: data.date,
          type: data.type,
          is_recurring: data.is_recurring || false
        },
        include: {
          account: true,
          category: true
        }
      })

      // Update cube with new transaction
      await cubeService.addTransaction({
        ...transaction,
        type: transaction.type as 'INCOME' | 'EXPENSE' | 'TRANSFER'
      }, tenantId)

      return transaction
    } catch (error) {
      return this.handleError(error, 'TransactionService.createTransaction')
    }
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(
    id: number,
    tenantId: string,
    data: UpdateTransactionData
  ): Promise<TransactionWithRelations> {
    try {
      this.validateTenantId(tenantId)

      // Check if transaction exists and belongs to tenant
      const existingTransaction = await this.getTransactionById(id, tenantId)
      if (!existingTransaction) {
        throw new Error('Transaction not found or does not belong to tenant')
      }

      // Validate account if being updated
      if (data.account_id) {
        const account = await this.prisma.account.findFirst({
          where: {
            id: data.account_id,
            tenant_id: tenantId
          }
        })

        if (!account) {
          throw new Error('Account not found or does not belong to tenant')
        }
      }

      // Validate category if being updated
      if (data.category_id) {
        const category = await this.prisma.category.findFirst({
          where: {
            id: data.category_id,
            tenant_id: tenantId
          }
        })

        if (!category) {
          throw new Error('Category not found or does not belong to tenant')
        }
      }

      // Auto-parse merchant if description is being updated
      const updateData: any = { ...data, updated_at: getCurrentUTCDate() };
      if (data.description) {
        updateData.merchant = extractMerchantName(data.description);
      }

      const transaction = await this.prisma.transaction.update({
        where: { id },
        data: updateData,
        include: {
          account: true,
          category: true
        }
      })

      // Update cube with transaction changes using delta approach
      const delta = CubeService.createUpdateDelta(
        id,
        tenantId,
        {
          account_id: existingTransaction.account_id,
          category_id: existingTransaction.category_id,
          amount: existingTransaction.amount,
          date: existingTransaction.date,
          type: existingTransaction.type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
          is_recurring: existingTransaction.is_recurring
        },
        {
          account_id: transaction.account_id,
          category_id: transaction.category_id,
          amount: transaction.amount,
          date: transaction.date,
          type: transaction.type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
          is_recurring: transaction.is_recurring
        }
      )
      await cubeService.updateTransaction(delta, tenantId)

      return transaction
    } catch (error) {
      return this.handleError(error, 'TransactionService.updateTransaction')
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(id: number, tenantId: string): Promise<void> {
    try {
      this.validateTenantId(tenantId)

      // Check if transaction exists and belongs to tenant
      const existingTransaction = await this.getTransactionById(id, tenantId)
      if (!existingTransaction) {
        throw new Error('Transaction not found or does not belong to tenant')
      }

      await this.prisma.transaction.delete({
        where: { id }
      })

      // Remove transaction from cube using direct removal approach
      await cubeService.removeTransaction({
        ...existingTransaction,
        type: existingTransaction.type as 'INCOME' | 'EXPENSE' | 'TRANSFER'
      }, tenantId)
    } catch (error) {
      return this.handleError(error, 'TransactionService.deleteTransaction')
    }
  }

  /**
   * Get transactions for a specific account
   */
  static async getTransactionsByAccount(
    accountId: number,
    tenantId: string
  ): Promise<TransactionWithRelations[]> {
    try {
      const result = await this.getTransactions(tenantId, { account_id: accountId })
      return result.transactions
    } catch (error) {
      return this.handleError(error, 'TransactionService.getTransactionsByAccount')
    }
  }

  /**
   * Get recurring transactions
   */
  static async getRecurringTransactions(tenantId: string): Promise<TransactionWithRelations[]> {
    try {
      const result = await this.getTransactions(tenantId, { is_recurring: true })
      return result.transactions
    } catch (error) {
      return this.handleError(error, 'TransactionService.getRecurringTransactions')
    }
  }

  // ============================================================================
  // BULK UPDATE METHODS - Superior for bulk operations
  // ============================================================================

  /**
   * Bulk update transactions using efficient bulk metadata approach
   */
  static async bulkUpdateTransactions(
    transactionIds: number[],
    updates: BulkUpdateData,
    tenantId: string
  ): Promise<void> {
    try {
      // Defensive fix: Ensure transactionIds is always an array
      const safeTransactionIds = Array.isArray(transactionIds) ? transactionIds : [transactionIds];

      // 1. Get old values for affected transactions (for cube calculation)
      const oldTransactions = await this.prisma.transaction.findMany({
        where: { id: { in: safeTransactionIds }, tenant_id: tenantId },
        select: {
          id: true,
          account_id: true,
          category_id: true,
          amount: true,
          date: true,
          type: true,
          is_recurring: true
        }
      })

      if (oldTransactions.length === 0) {
        throw new Error('No transactions found for bulk update')
      }

      // 2. Apply bulk update with merchant parsing if description is updated
      const updateData: any = { ...updates };
      if (updates.description) {
        updateData.merchant = extractMerchantName(updates.description);
      }

      await this.prisma.transaction.updateMany({
        where: { id: { in: safeTransactionIds }, tenant_id: tenantId },
        data: updateData
      })

      // 3. Update cube using efficient delete-insert approach
      const dates = oldTransactions.map(t => t.date)
      const startDate = dates.reduce((min, date) => date < min ? date : min, dates[0])
      const endDate = dates.reduce((max, date) => date > max ? date : max, dates[0])

      await cubeService.regenerateCubeForDateRange(tenantId, startDate, endDate)

    } catch (error) {
      return this.handleError(error, 'TransactionService.bulkUpdateTransactions')
    }
  }


  /**
   * Extract cube-relevant fields from a transaction for delta processing
   */
  static extractCubeRelevantFields(transaction: TransactionForCube): CubeRelevantFields {
    return {
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      amount: transaction.amount,
      date: transaction.date,
      type: transaction.type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
      is_recurring: transaction.is_recurring
    }
  }

  /**
   * Bulk delete transactions using efficient approach
   */
  static async bulkDeleteTransactions(
    transactionIds: number[],
    tenantId: string
  ): Promise<{ deletedCount: number }> {
    try {
      // 1. Get old values for affected transactions (for cube calculation)
      const oldTransactions = await this.prisma.transaction.findMany({
        where: { id: { in: transactionIds }, tenant_id: tenantId },
        select: {
          id: true,
          account_id: true,
          category_id: true,
          amount: true,
          date: true,
          type: true,
          is_recurring: true
        }
      })

      if (oldTransactions.length === 0) {
        return { deletedCount: 0 }
      }

      // 2. Delete transactions
      const deleteResult = await this.prisma.transaction.deleteMany({
        where: { id: { in: transactionIds }, tenant_id: tenantId }
      })

      // 3. Update cube using efficient delete-insert approach
      const dates = oldTransactions.map(t => t.date)
      const startDate = dates.reduce((min, date) => date < min ? date : min, dates[0])
      const endDate = dates.reduce((max, date) => date > max ? date : max, dates[0])

      await cubeService.regenerateCubeForDateRange(tenantId, startDate, endDate)

      return { deletedCount: deleteResult.count }

    } catch (error) {
      return this.handleError(error, 'TransactionService.bulkDeleteTransactions')
    }
  }


  /**
   * Bulk create transactions with efficient cube updates (for imports)
   */
  static async bulkCreateTransactions(
    transactions: CreateTransactionData[],
    tenantId: string
  ): Promise<{ createdCount: number; createdTransactions: Array<{
    id: number
    account_id: number
    category_id: number | null
    amount: Decimal
    date: Date
    type: string
    is_recurring: boolean
  }> }> {
    try {
      if (transactions.length === 0) {
        return { createdCount: 0, createdTransactions: [] }
      }

      // 1. Prepare transaction data for bulk insert
      const transactionData = transactions.map(tx => ({
        tenant_id: tenantId,
        account_id: tx.account_id,
        amount: tx.amount,
        description: tx.description,
        merchant: extractMerchantName(tx.description),
        date: tx.date,
        type: tx.type,
        category_id: tx.category_id || null,
        is_recurring: tx.is_recurring || false,
        created_at: getCurrentUTCDate(),
        updated_at: getCurrentUTCDate()
      }))

      // 2. Bulk insert transactions
      const createdTransactions = await this.prisma.transaction.createManyAndReturn({
        data: transactionData
      })

      // 3. Update cube using efficient delete-insert approach
      const dates = createdTransactions.map(tx => tx.date)
      const startDate = dates.reduce((min, date) => date < min ? date : min, dates[0])
      const endDate = dates.reduce((max, date) => date > max ? date : max, dates[0])

      await cubeService.regenerateCubeForDateRange(tenantId, startDate, endDate)

      return {
        createdCount: createdTransactions.length,
        createdTransactions
      }

    } catch (error) {
      return this.handleError(error, 'TransactionService.bulkCreateTransactions')
    }
  }


}

// Export singleton instance
export const transactionService = new TransactionService()
