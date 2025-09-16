import { BaseService } from './base.service'
import type { Transaction, Account, Category } from '@prisma/client'
import { getCurrentUTCDate, parseAndConvertToUTC } from '@/lib/utils/date-utils'

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

      const where: any = {
        tenant_id: tenantId
      }

      // Apply filters
      if (filters) {
        if (filters.account_id) where.account_id = filters.account_id
        if (filters.category_id) where.category_id = filters.category_id
        if (filters.type) where.type = filters.type
        if (filters.is_recurring !== undefined) where.is_recurring = filters.is_recurring

        if (filters.date_from || filters.date_to) {
          where.date = {} as any
          if (filters.date_from) (where.date as any).gte = filters.date_from
          if (filters.date_to) (where.date as any).lte = filters.date_to
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
}
