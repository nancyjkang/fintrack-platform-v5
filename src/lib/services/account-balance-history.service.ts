import { BaseService } from './base.service'
import { prisma } from '@/lib/prisma'
import type { Account, Transaction } from '@prisma/client'
import {
  BalanceHistoryData,
  BalanceSummary,
  BalanceHistoryFilters,
  BalanceCalculationResult,
  DailyBalanceData
} from '@/types/balance-history'
import { getCurrentUTCDate, toUTCDateString, createUTCDate } from '@/lib/utils/date-utils'

/**
 * Account Balance History Service
 *
 * Provides balance history and summary data with strict MVP accounting system compliance.
 * Follows the accounting principles:
 * - INCOME transactions: +amount (increase balance)
 * - EXPENSE transactions: -amount (decrease balance)
 * - TRANSFER transactions: amount as-is (already properly signed)
 * - Never use Math.abs() in calculations (display only)
 * - Maintain data integrity: sum(transactions) = account_balance
 */
export class AccountBalanceHistoryService extends BaseService {

  /**
   * Get balance history for an account using MVP accounting methods
   *
   * @param tenantId - Tenant ID for data isolation
   * @param accountId - Account ID to get history for
   * @param startDate - Optional start date (YYYY-MM-DD)
   * @param endDate - Optional end date (YYYY-MM-DD)
   * @returns Promise<BalanceHistoryData[]> - Chronologically sorted balance history
   */
  public async getAccountBalanceHistory(
    tenantId: number,
    accountId: number,
    startDate?: string,
    endDate?: string
  ): Promise<BalanceHistoryData[]> {
    try {
      // 1. Validate account exists and belongs to tenant
      const account = await this.validateAccountAccess(tenantId, accountId);

      // 2. Determine date range (default to last 30 days if not specified)
      const dateRange = this.normalizeDateRange(startDate, endDate);

      // 3. Get all transactions in the date range
      const transactions = await this.getTransactionsInRange(
        tenantId,
        accountId,
        dateRange.startDate,
        dateRange.endDate
      );

      // 4. Get unique transaction dates for balance calculation
      const transactionDates = this.getUniqueDatesFromTransactions(transactions);

      // 5. Calculate balance for each date using MVP accounting methods
      const balanceHistory: BalanceHistoryData[] = [];

      for (const date of transactionDates) {
        const balanceResult = await this.calculateBalanceAtDate(
          tenantId,
          accountId,
          date
        );

        const dailyNetAmount = this.calculateDailyNetAmount(transactions, date);

        balanceHistory.push({
          date,
          balance: balanceResult.balance,
          netAmount: dailyNetAmount,
          calculationMethod: balanceResult.method,
          anchorUsed: balanceResult.anchorUsed
        });
      }

      // 6. Sort chronologically (oldest first)
      return balanceHistory.sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
      throw error; // Let the error bubble up for proper handling
    }
  }

  /**
   * Get balance summary statistics for an account
   *
   * @param tenantId - Tenant ID for data isolation
   * @param accountId - Account ID to get summary for
   * @param startDate - Optional start date (YYYY-MM-DD)
   * @param endDate - Optional end date (YYYY-MM-DD)
   * @returns Promise<BalanceSummary> - Summary statistics
   */
  public async getAccountBalanceSummary(
    tenantId: number,
    accountId: number,
    startDate?: string,
    endDate?: string
  ): Promise<BalanceSummary> {
    try {
      // 1. Get balance history data
      const balanceHistory = await this.getAccountBalanceHistory(
        tenantId,
        accountId,
        startDate,
        endDate
      );

      // 2. Get transaction count in date range
      const dateRange = this.normalizeDateRange(startDate, endDate);
      const transactionCount = await this.getTransactionCount(
        tenantId,
        accountId,
        dateRange.startDate,
        dateRange.endDate
      );

      // 3. Calculate summary statistics
      const startingBalance = balanceHistory.length > 0 ? balanceHistory[0].balance : 0;
      const endingBalance = balanceHistory.length > 0 ? balanceHistory[balanceHistory.length - 1].balance : 0;
      const netChange = endingBalance - startingBalance;

      // 4. Count calculation methods used
      const calculationMethods = balanceHistory.reduce(
        (acc, item) => {
          if (item.calculationMethod === 'direct') {
            acc.direct++;
          } else {
            acc.anchorBased++;
          }
          return acc;
        },
        { direct: 0, anchorBased: 0 }
      );

      return {
        startingBalance,
        endingBalance,
        totalTransactions: transactionCount,
        netChange,
        dateRange: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        calculationMethods
      };

    } catch (error) {
      throw error; // Let the error bubble up for proper handling
    }
  }

  /**
   * Calculate balance at a specific date using MVP accounting methods
   *
   * This method follows the MVP accounting system exactly:
   * - Method 1: Direct transaction sum (fallback)
   * - Method 2: Anchor + post-anchor transactions (preferred)
   * - Method 3: Bidirectional calculation from anchor
   *
   * @param tenantId - Tenant ID for data isolation
   * @param accountId - Account ID
   * @param targetDate - Date to calculate balance for (YYYY-MM-DD)
   * @returns Promise<BalanceCalculationResult> - Balance with calculation metadata
   */
  private async calculateBalanceAtDate(
    tenantId: number,
    accountId: number,
    targetDate: string
  ): Promise<BalanceCalculationResult> {
    try {
      // Note: Balance anchors are not yet implemented in v5
      // For now, we'll use direct transaction sum (Method 1)
      // TODO: Implement balance anchor support when available

      // Method 1: Direct transaction sum
      const transactions = await prisma.transaction.findMany({
        where: {
          tenant_id: tenantId,
          account_id: accountId,
          date: {
            lte: targetDate
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      let balance = 0;
      for (const transaction of transactions) {
        balance += this.getTransactionBalanceImpact(transaction);
      }

      return {
        balance,
        method: 'direct',
        transactionsProcessed: transactions.length
      };

    } catch (error) {
      throw new Error(`Failed to calculate balance at date ${targetDate}: ${error}`);
    }
  }

  /**
   * Calculate the balance impact of a transaction following MVP accounting rules
   *
   * CRITICAL: This follows the exact same logic as the MVP accounting system:
   * - INCOME: +transaction.amount (increases balance)
   * - EXPENSE: -transaction.amount (decreases balance)
   * - TRANSFER: transaction.amount (already properly signed)
   * - NEVER use Math.abs() in calculations
   *
   * @param transaction - Transaction to calculate impact for
   * @returns number - Balance impact (positive or negative)
   */
  private getTransactionBalanceImpact(transaction: Transaction): number {
    switch (transaction.type) {
      case 'INCOME':
        return Number(transaction.amount); // Positive impact
      case 'EXPENSE':
        return -Number(transaction.amount); // Negative impact
      case 'TRANSFER':
        return Number(transaction.amount); // Amount is already properly signed
      default:
        return 0;
    }
  }

  /**
   * Calculate daily net amount (sum of all transactions on a specific date)
   *
   * @param transactions - All transactions in the range
   * @param date - Date to calculate net amount for
   * @returns number - Net amount for the day
   */
  private calculateDailyNetAmount(transactions: Transaction[], date: string): number {
    const dailyTransactions = transactions.filter(t => t.date === date);
    return dailyTransactions.reduce((sum, transaction) => {
      return sum + this.getTransactionBalanceImpact(transaction);
    }, 0);
  }

  /**
   * Validate account exists and belongs to tenant
   *
   * @param tenantId - Tenant ID
   * @param accountId - Account ID
   * @returns Promise<Account> - Account if valid
   * @throws Error if account not found or access denied
   */
  private async validateAccountAccess(tenantId: number, accountId: number): Promise<Account> {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        tenant_id: tenantId
      }
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found or access denied`);
    }

    return account;
  }

  /**
   * Normalize date range with defaults
   *
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Object with normalized start and end dates
   */
  private normalizeDateRange(startDate?: string, endDate?: string): {
    startDate: string;
    endDate: string;
  } {
    const today = getCurrentUTCDate();
    const defaultStartDate = new Date(today);
    defaultStartDate.setDate(today.getDate() - 30); // Last 30 days

    return {
      startDate: startDate || toUTCDateString(defaultStartDate),
      endDate: endDate || toUTCDateString(today)
    };
  }

  /**
   * Get transactions in date range
   *
   * @param tenantId - Tenant ID
   * @param accountId - Account ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Promise<Transaction[]> - Transactions in range
   */
  private async getTransactionsInRange(
    tenantId: number,
    accountId: number,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    return await prisma.transaction.findMany({
      where: {
        tenant_id: tenantId,
        account_id: accountId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: [
        { date: 'asc' },
        { created_at: 'asc' }
      ]
    });
  }

  /**
   * Get transaction count in date range
   *
   * @param tenantId - Tenant ID
   * @param accountId - Account ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Promise<number> - Transaction count
   */
  private async getTransactionCount(
    tenantId: number,
    accountId: number,
    startDate: string,
    endDate: string
  ): Promise<number> {
    return await prisma.transaction.count({
      where: {
        tenant_id: tenantId,
        account_id: accountId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
  }

  /**
   * Get unique dates from transactions array
   *
   * @param transactions - Array of transactions
   * @returns string[] - Sorted unique dates
   */
  private getUniqueDatesFromTransactions(transactions: Transaction[]): string[] {
    const uniqueDates = new Set(transactions.map(t => t.date));
    return Array.from(uniqueDates).sort();
  }
}
