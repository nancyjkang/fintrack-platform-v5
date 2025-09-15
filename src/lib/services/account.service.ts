import { BaseService } from './base.service'
import type { Account } from '@prisma/client'

export interface CreateAccountData {
  name: string
  type: string // CHECKING, SAVINGS, CREDIT, INVESTMENT, CASH
  balance: number
  balance_date: Date
  color: string
  is_active?: boolean
}

export interface UpdateAccountData {
  name?: string
  type?: string
  balance?: number
  balance_date?: Date
  color?: string
  is_active?: boolean
}

export interface AccountFilters {
  type?: string
  is_active?: boolean
  search?: string
}

/**
 * Account service for managing financial accounts
 */
export class AccountService extends BaseService {

  /**
   * Get all accounts for a tenant with optional filters
   */
  static async getAccounts(
    tenantId: string,
    filters?: AccountFilters
  ): Promise<Account[]> {
    try {
      this.validateTenantId(tenantId)

      const where: any = {
        tenant_id: tenantId
      }

      // Apply filters
      if (filters) {
        if (filters.type) where.type = filters.type
        if (filters.is_active !== undefined) where.is_active = filters.is_active

        if (filters.search) {
          where.name = {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      }

      const accounts = await this.prisma.account.findMany({
        where,
        orderBy: {
          name: 'asc'
        }
      })

      return accounts
    } catch (error) {
      return this.handleError(error, 'AccountService.getAccounts')
    }
  }

  /**
   * Get a single account by ID (with tenant validation)
   */
  static async getAccountById(
    id: number,
    tenantId: string
  ): Promise<Account | null> {
    try {
      this.validateTenantId(tenantId)

      const account = await this.prisma.account.findFirst({
        where: {
          id,
          tenant_id: tenantId
        }
      })

      return account
    } catch (error) {
      return this.handleError(error, 'AccountService.getAccountById')
    }
  }

  /**
   * Create a new account
   */
  static async createAccount(
    tenantId: string,
    data: CreateAccountData
  ): Promise<Account> {
    try {
      this.validateTenantId(tenantId)

      // Check for duplicate account name within tenant
      const existingAccount = await this.prisma.account.findFirst({
        where: {
          tenant_id: tenantId,
          name: data.name
        }
      })

      if (existingAccount) {
        throw new Error('Account with this name already exists')
      }

      const account = await this.prisma.account.create({
        data: {
          tenant_id: tenantId,
          name: data.name,
          type: data.type,
          balance: data.balance,
          balance_date: data.balance_date,
          color: data.color,
          is_active: data.is_active ?? true
        }
      })

      return account
    } catch (error) {
      return this.handleError(error, 'AccountService.createAccount')
    }
  }

  /**
   * Update an account
   */
  static async updateAccount(
    id: number,
    tenantId: string,
    data: UpdateAccountData
  ): Promise<Account> {
    try {
      this.validateTenantId(tenantId)

      // Check if account exists and belongs to tenant
      const existingAccount = await this.getAccountById(id, tenantId)
      if (!existingAccount) {
        throw new Error('Account not found or does not belong to tenant')
      }

      // Check for duplicate name if name is being updated
      if (data.name && data.name !== existingAccount.name) {
        const duplicateAccount = await this.prisma.account.findFirst({
          where: {
            tenant_id: tenantId,
            name: data.name,
            id: { not: id } // Exclude current account
          }
        })

        if (duplicateAccount) {
          throw new Error('Account with this name already exists')
        }
      }

      const account = await this.prisma.account.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date()
        }
      })

      return account
    } catch (error) {
      return this.handleError(error, 'AccountService.updateAccount')
    }
  }

  /**
   * Delete an account
   */
  static async deleteAccount(id: number, tenantId: string): Promise<void> {
    try {
      this.validateTenantId(tenantId)

      // Check if account exists and belongs to tenant
      const existingAccount = await this.getAccountById(id, tenantId)
      if (!existingAccount) {
        throw new Error('Account not found or does not belong to tenant')
      }

      // Check if account has transactions
      const transactionCount = await this.prisma.transaction.count({
        where: {
          account_id: id,
          tenant_id: tenantId
        }
      })

      if (transactionCount > 0) {
        throw new Error('Cannot delete account with existing transactions')
      }

      await this.prisma.account.delete({
        where: { id }
      })
    } catch (error) {
      return this.handleError(error, 'AccountService.deleteAccount')
    }
  }

  /**
   * Get accounts by type
   */
  static async getAccountsByType(
    type: string,
    tenantId: string
  ): Promise<Account[]> {
    try {
      return this.getAccounts(tenantId, { type })
    } catch (error) {
      return this.handleError(error, 'AccountService.getAccountsByType')
    }
  }

  /**
   * Get active accounts only
   */
  static async getActiveAccounts(tenantId: string): Promise<Account[]> {
    try {
      return this.getAccounts(tenantId, { is_active: true })
    } catch (error) {
      return this.handleError(error, 'AccountService.getActiveAccounts')
    }
  }

  /**
   * Calculate total balance for all accounts of a specific type
   */
  static async getTotalBalanceByType(
    type: string,
    tenantId: string
  ): Promise<number> {
    try {
      this.validateTenantId(tenantId)

      const result = await this.prisma.account.aggregate({
        where: {
          tenant_id: tenantId,
          type,
          is_active: true
        },
        _sum: {
          balance: true
        }
      })

      return Number(result._sum.balance) || 0
    } catch (error) {
      return this.handleError(error, 'AccountService.getTotalBalanceByType')
    }
  }
}
