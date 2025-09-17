import { BaseService } from './base.service'
import type { Account } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { getCurrentUTCDate, parseAndConvertToUTC } from '@/lib/utils/date-utils'

export interface CreateAccountData {
  name: string
  type: string // CHECKING, SAVINGS, CREDIT_CARD, INVESTMENT, LOAN, TRADITIONAL_RETIREMENT, ROTH_RETIREMENT
  net_worth_category?: string // ASSET, LIABILITY, EXCLUDED - will be auto-determined if not provided
  balance: number
  // eslint-disable-next-line no-restricted-globals
  balance_date: Date
  color: string
  is_active?: boolean
}

export interface UpdateAccountData {
  name?: string
  type?: string
  net_worth_category?: string // ASSET, LIABILITY, EXCLUDED
  balance?: number
  // eslint-disable-next-line no-restricted-globals
  balance_date?: Date
  color?: string
  is_active?: boolean
}

export interface AccountFilters {
  type?: string
  is_active?: boolean
  search?: string
}

export interface ReconcileAccountData {
  newBalance: number
  reconcileDate: string // YYYY-MM-DD format
}

/**
 * Account service for managing financial accounts
 */
export class AccountService extends BaseService {

  /**
   * Determine default net worth category based on account type
   */
  private static getDefaultNetWorthCategory(accountType: string): string {
    const liabilityTypes = ['CREDIT', 'CREDIT_CARD', 'LOAN']
    return liabilityTypes.includes(accountType) ? 'LIABILITY' : 'ASSET'
  }

  /**
   * Get all accounts for a tenant with optional filters
   */
  static async getAccounts(
    tenantId: string,
    filters?: AccountFilters
  ): Promise<(Account & { latest_anchor_date?: Date })[]> { // eslint-disable-line no-restricted-globals
    try {
      this.validateTenantId(tenantId)

      const where: Record<string, unknown> = {
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
        include: {
          balance_anchors: {
            orderBy: {
              anchor_date: 'desc'
            },
            take: 1,
            select: {
              anchor_date: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })

      // Transform the result to include latest_anchor_date
      return accounts.map(account => ({
        ...account,
        latest_anchor_date: account.balance_anchors[0]?.anchor_date || null,
        balance_anchors: undefined // Remove the nested structure from the response
      }))
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
          net_worth_category: data.net_worth_category ?? this.getDefaultNetWorthCategory(data.type),
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
          updated_at: getCurrentUTCDate()
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

  /**
   * Calculate net worth for all accounts in a tenant
   */
  static async calculateNetWorth(tenantId: string): Promise<number> {
    try {
      this.validateTenantId(tenantId)

      const accounts = await this.getAccounts(tenantId, { is_active: true })
      let totalNetWorth = 0

      for (const account of accounts) {
        if (account.net_worth_category === 'EXCLUDED') {
          continue // Skip excluded accounts
        }

        // For now, use the stored balance. In the future, this could use
        // the MVP accounting system's calculateAccountBalance() function
        const currentBalance = Number(account.balance)

        // Add balance as-is: assets are positive, liabilities are negative
        totalNetWorth += currentBalance
      }

      return totalNetWorth
    } catch (error) {
      return this.handleError(error, 'AccountService.calculateNetWorth')
    }
  }

  /**
   * Reconcile account balance - creates balance anchor and adjustment transaction
   * This follows the MVP accounting system pattern
   */
  static async reconcileAccount(
    accountId: number,
    tenantId: string,
    data: ReconcileAccountData
  ): Promise<{ account: Account; adjustmentTransaction?: unknown }> {
    try {
      this.validateTenantId(tenantId)

      // Check if account exists and belongs to tenant
      const existingAccount = await this.getAccountById(accountId, tenantId)
      if (!existingAccount) {
        throw new Error('Account not found or does not belong to tenant')
      }

      const reconcileDate = parseAndConvertToUTC(data.reconcileDate)
      const currentBalance = Number(existingAccount.balance)
      const difference = data.newBalance - currentBalance

      // Create balance anchor
      const balanceAnchor = await this.prisma.accountBalanceAnchor.create({
        data: {
          tenant_id: tenantId,
          account_id: accountId,
          balance: data.newBalance,
          anchor_date: reconcileDate,
          description: `Reconciled balance on ${data.reconcileDate}`
        }
      })

      // Update account balance
      const updatedAccount = await this.updateAccount(accountId, tenantId, {
        balance: data.newBalance,
        balance_date: reconcileDate
      })

      // Create adjustment transaction if there's a significant difference
      let adjustmentTransaction = null
      if (Math.abs(difference) > 0.01) {
        // Always use TRANSFER type for reconciliation adjustments (MVP accounting system)
        adjustmentTransaction = await this.prisma.transaction.create({
          data: {
            tenant_id: tenantId,
            account_id: accountId,
            amount: new Decimal(difference), // Explicitly convert to Decimal with correct sign
            description: 'System Balance Adjustment',
            date: reconcileDate,
            type: 'TRANSFER',
            category_id: null // System Transfer category (to be implemented)
          }
        })
      }

      return {
        account: updatedAccount,
        adjustmentTransaction
      }
    } catch (error) {
      return this.handleError(error, 'AccountService.reconcileAccount')
    }
  }

  /**
   * Get accounts by net worth category
   */
  static async getAccountsByNetWorthCategory(
    category: string,
    tenantId: string
  ): Promise<Account[]> {
    try {
      return this.getAccounts(tenantId, { is_active: true }).then(accounts =>
        accounts.filter(account => account.net_worth_category === category)
      )
    } catch (error) {
      return this.handleError(error, 'AccountService.getAccountsByNetWorthCategory')
    }
  }
}
