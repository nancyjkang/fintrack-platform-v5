import { BaseService } from './base.service'
import type { Transaction, Account, Category } from '@prisma/client'
import { getCurrentUTCDate, parseAndConvertToUTC } from '@/lib/utils/date-utils'
import { cubeService, CubeService } from './cube.service'
import type { CubeRelevantFields, BulkUpdateMetadata } from '@/lib/types/cube-delta.types'
import { Decimal } from '@prisma/client/runtime/library'

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
  category_id?: number
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  is_recurring?: boolean
  // eslint-disable-next-line no-restricted-globals
  date_from?: Date
  // eslint-disable-next-line no-restricted-globals
  date_to?: Date
  search?: string
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
   * Get all transactions for a tenant with optional filters
   */
  static async getTransactions(
    tenantId: string,
    filters?: TransactionFilters
  ): Promise<TransactionWithRelations[]> {
    try {
      this.validateTenantId(tenantId)

      const where: Record<string, unknown> = {
        tenant_id: tenantId
      }

      // Apply filters
      if (filters) {
        if (filters.account_id) where.account_id = filters.account_id
        if (filters.category_id) where.category_id = filters.category_id
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

      const transactions = await this.prisma.transaction.findMany({
        where,
        include: {
          account: true,
          category: true
        },
        orderBy: {
          date: 'desc'
        }
      })

      return transactions
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

      const transaction = await this.prisma.transaction.create({
        data: {
          tenant_id: tenantId,
          account_id: data.account_id,
          category_id: data.category_id,
          amount: data.amount,
          description: data.description,
          date: data.date,
          type: data.type,
          is_recurring: data.is_recurring || false
        },
        include: {
          account: true,
          category: true
        }
      })

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

      const transaction = await this.prisma.transaction.update({
        where: { id },
        data: {
          ...data,
          updated_at: getCurrentUTCDate()
        },
        include: {
          account: true,
          category: true
        }
      })

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
      return this.getTransactions(tenantId, { account_id: accountId })
    } catch (error) {
      return this.handleError(error, 'TransactionService.getTransactionsByAccount')
    }
  }

  /**
   * Get recurring transactions
   */
  static async getRecurringTransactions(tenantId: string): Promise<TransactionWithRelations[]> {
    try {
      return this.getTransactions(tenantId, { is_recurring: true })
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
    updates: Partial<CubeRelevantFields>,
    tenantId: string
  ): Promise<void> {
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
        throw new Error('No transactions found for bulk update')
      }
      
      // 2. Apply bulk update
      await this.prisma.transaction.updateMany({
        where: { id: { in: transactionIds }, tenant_id: tenantId },
        data: updates
      })
      
      // 3. Create bulk metadata from the update
      const bulkMetadata = this.createBulkUpdateMetadata(oldTransactions, updates, tenantId)
      
      // 4. Update cube efficiently with bulk metadata
      const { cubeService } = await import('./cube.service')
      await cubeService.updateCubeWithBulkMetadata(bulkMetadata)
      
    } catch (error) {
      return this.handleError(error, 'TransactionService.bulkUpdateTransactions')
    }
  }

  /**
   * Create bulk update metadata from transaction changes
   */
  private static createBulkUpdateMetadata(
    oldTransactions: Array<{
      id: number
      account_id: number
      category_id: number | null
      amount: Decimal
      date: Date
      type: string
      is_recurring: boolean
    }>, 
    updates: Partial<CubeRelevantFields>,
    tenantId: string
  ): BulkUpdateMetadata {
    const changedFields: BulkUpdateMetadata['changedFields'] = []
    
    // Determine which fields changed and their old/new values
    if (updates.category_id !== undefined) {
      // For category changes, we need to handle multiple old values
      const uniqueOldCategories = [...new Set(oldTransactions.map(t => t.category_id))]
      
      if (uniqueOldCategories.length === 1) {
        // All transactions had the same old category - simple case
        changedFields.push({
          fieldName: 'category_id',
          oldValue: uniqueOldCategories[0],
          newValue: updates.category_id
        })
      } else {
        // Multiple old categories - fall back to individual delta processing
        throw new Error('Bulk update with multiple old category values not supported. Use individual updates.')
      }
    }
    
    if (updates.account_id !== undefined) {
      const uniqueOldAccounts = [...new Set(oldTransactions.map(t => t.account_id))]
      
      if (uniqueOldAccounts.length === 1) {
        changedFields.push({
          fieldName: 'account_id',
          oldValue: uniqueOldAccounts[0],
          newValue: updates.account_id
        })
      } else {
        throw new Error('Bulk update with multiple old account values not supported. Use individual updates.')
      }
    }

    if (updates.type !== undefined) {
      const uniqueOldTypes = [...new Set(oldTransactions.map(t => t.type))]
      
      if (uniqueOldTypes.length === 1) {
        changedFields.push({
          fieldName: 'type',
          oldValue: uniqueOldTypes[0],
          newValue: updates.type
        })
      } else {
        throw new Error('Bulk update with multiple old transaction types not supported. Use individual updates.')
      }
    }

    if (updates.amount !== undefined) {
      changedFields.push({
        fieldName: 'amount',
        oldValue: null, // Amount changes don't need old/new distinction for cube regeneration
        newValue: updates.amount
      })
    }

    if (updates.is_recurring !== undefined) {
      changedFields.push({
        fieldName: 'is_recurring',
        oldValue: null, // Recurring changes don't need old/new distinction for cube regeneration
        newValue: updates.is_recurring
      })
    }

    if (updates.date !== undefined) {
      throw new Error('Date changes in bulk updates not supported. Use individual transaction updates.')
    }
    
    // Calculate date range from affected transactions
    const dates = oldTransactions.map(t => t.date)
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
    const dateRange = {
      startDate: sortedDates[0],
      endDate: sortedDates[sortedDates.length - 1]
    }
    
    return {
      tenantId,
      affectedTransactionIds: oldTransactions.map(t => t.id),
      changedFields,
      dateRange
    }
  }

  /**
   * Extract cube-relevant fields from a transaction for delta processing
   */
  static extractCubeRelevantFields(transaction: any): CubeRelevantFields {
    return {
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      amount: transaction.amount,
      date: transaction.date,
      type: transaction.type,
      is_recurring: transaction.is_recurring
    }
  }
}
