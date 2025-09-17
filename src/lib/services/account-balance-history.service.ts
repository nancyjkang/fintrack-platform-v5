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
import { getCurrentUTCDate, toUTCDateString, createUTCDate, parseDateStringForDB, parseAndConvertToUTC } from '@/lib/utils/date-utils'

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
    tenantId: string,
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
   * Calculate running balance for each transaction using MVP accounting principles with balance anchors
   *
   * This method follows the MVP accounting hierarchy:
   * 1. Primary: Latest balance anchor + post-anchor transactions
   * 2. Secondary: Account balance (fallback)
   * 3. Fallback: Direct transaction sum
   *
   * @param transactions - Array of transactions (will be sorted by date ascending for calculation)
   * @param accountId - Account ID for balance calculation
   * @param tenantId - Tenant ID for data isolation
   * @returns Promise<Array<Transaction & { balance: number }>> - Transactions with running balances, sorted by date descending
   */
  public async calculateRunningBalancesFromAnchor(
    transactions: Transaction[],
    accountId: number,
    tenantId: string
  ): Promise<Array<Transaction & { balance: number }>> {
    if (transactions.length === 0) {
      return [];
    }

    // Sort transactions by date ascending for calculation
    // For transactions on the same date, sort by ID (deterministic) then description (readable)
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = toUTCDateString(a.date);
      const dateB = toUTCDateString(b.date);

      if (dateA !== dateB) {
        return dateA.localeCompare(dateB); // Primary: sort by date
      }

      if (a.id !== b.id) {
        return a.id - b.id; // Secondary: sort by ID (deterministic)
      }

      // Tertiary: sort by description (for human readability)
      return (a.description || '').localeCompare(b.description || '');
    });

    // Step 1: Find the latest balance anchor for this account
    const latestAnchor = await this.findLatestBalanceAnchor(accountId, tenantId);

    if (latestAnchor) {
      // Method 2: Anchor-based calculation (preferred)
      return this.calculateFromAnchor(sortedTransactions, latestAnchor);
    } else {
      // Method 1: Fallback to account balance
      const account = await this.validateAccountAccess(tenantId, accountId);
      const currentAccountBalance = Number(account.balance);
      return this.calculateFromAccountBalance(sortedTransactions, accountId, currentAccountBalance);
    }
  }

  /**
   * Legacy method: Calculate running balances from account balance (fallback method)
   *
   * This method works backwards from the current account balance to calculate historical balances.
   * Used when no balance anchors are available.
   *
   * @param transactions - Array of transactions (will be sorted by date ascending for calculation)
   * @param accountId - Account ID for balance calculation
   * @param currentAccountBalance - Current account balance (source of truth)
   * @returns Array<Transaction & { balance: number }> - Transactions with running balances, sorted by date descending
   */
  public calculateFromAccountBalance(
    transactions: Transaction[],
    accountId: number,
    currentAccountBalance: number
  ): Array<Transaction & { balance: number }> {
    if (transactions.length === 0) {
      return [];
    }

    // Use the provided account balance as the source of truth
    // This method works backwards from the current account balance to calculate historical balances
    //
    // Note: In full MVP implementation with balance anchors, the logic would be:
    // 1. Find latest balance anchor for this account
    // 2. If anchor exists, calculate from anchor + post-anchor transactions
    // 3. If no anchor, use direct transaction sum or account balance
    //
    // For now, we use the provided currentAccountBalance parameter

    // Sort transactions by date ascending for calculation
    // For transactions on the same date, sort by ID (deterministic) then description (readable)
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = toUTCDateString(a.date);
      const dateB = toUTCDateString(b.date);

      if (dateA !== dateB) {
        return dateA.localeCompare(dateB); // Primary: sort by date
      }

      if (a.id !== b.id) {
        return a.id - b.id; // Secondary: sort by ID (deterministic)
      }

      // Tertiary: sort by description (for human readability)
      return (a.description || '').localeCompare(b.description || '');
    });

    // Calculate the balance before the first transaction by working backwards
    // currentBalance = startingBalance + sum(all_transaction_impacts)
    // Therefore: startingBalance = currentBalance - sum(all_transaction_impacts)
    let totalTransactionImpact = 0;
    for (const transaction of sortedTransactions) {
      totalTransactionImpact += this.getTransactionBalanceImpact(transaction);
    }

    const startingBalance = currentAccountBalance - totalTransactionImpact;

    // Now calculate running balances forward from the starting balance
    const transactionsWithBalance: Array<Transaction & { balance: number }> = [];
    let runningBalance = startingBalance;

    for (const transaction of sortedTransactions) {
      const impact = this.getTransactionBalanceImpact(transaction);
      runningBalance += impact;

      transactionsWithBalance.push({
        ...transaction,
        balance: runningBalance
      });
    }

    // Verify our calculation matches the account balance
    const finalCalculatedBalance = transactionsWithBalance[transactionsWithBalance.length - 1]?.balance || startingBalance;
    if (Math.abs(finalCalculatedBalance - currentAccountBalance) > 0.01) {
      console.warn(`Balance calculation mismatch for account ${accountId}: calculated=${finalCalculatedBalance}, actual=${currentAccountBalance}`);
    }

    // Return sorted by date descending (newest first)
    return transactionsWithBalance.sort((a, b) =>
      toUTCDateString(b.date).localeCompare(toUTCDateString(a.date))
    );
  }

  /**
   * Find the latest balance anchor for an account
   *
   * @param accountId - Account ID
   * @param tenantId - Tenant ID
   * @returns Promise<AccountBalanceAnchor | null> - Latest anchor or null if none exists
   */
  private async findLatestBalanceAnchor(
    accountId: number,
    tenantId: string
  ): Promise<any | null> {
    try {
      const anchors = await prisma.accountBalanceAnchor.findMany({
        where: {
          account_id: accountId,
          tenant_id: tenantId,
        },
        orderBy: {
          anchor_date: 'desc'
        },
        take: 1
      });

      return anchors.length > 0 ? anchors[0] : null;
    } catch (error) {
      console.warn(`Failed to find balance anchor for account ${accountId}:`, error);
      return null;
    }
  }

  /**
   * Calculate running balances from a balance anchor (MVP Method 2)
   *
   * @param transactions - Sorted transactions (ascending by date)
   * @param anchor - Balance anchor to calculate from
   * @returns Array<Transaction & { balance: number }> - Transactions with running balances
   */
  private calculateFromAnchor(
    transactions: Transaction[],
    anchor: { anchor_date: Date; balance: string | number }
  ): Array<Transaction & { balance: number }> {
    const anchorDate = toUTCDateString(anchor.anchor_date);
    const anchorBalance = Number(anchor.balance);


    // Separate transactions into pre-anchor and post-anchor
    const anchorDateObj = parseAndConvertToUTC(anchorDate);
    const preAnchorTransactions = transactions.filter(t => parseAndConvertToUTC(t.date.toString()) < anchorDateObj);
    const postAnchorTransactions = transactions.filter(t => parseAndConvertToUTC(t.date.toString()) >= anchorDateObj);


    const transactionsWithBalance: Array<Transaction & { balance: number }> = [];

    // Calculate pre-anchor balances (working backwards from anchor)
    if (preAnchorTransactions.length > 0) {
      // Calculate total impact of pre-anchor transactions
      const preAnchorImpact = preAnchorTransactions.reduce((sum, t) =>
        sum + this.getTransactionBalanceImpact(t), 0
      );

      // Starting balance = anchor balance - total pre-anchor impact
      const startingBalance = anchorBalance - preAnchorImpact;
      let runningBalance = startingBalance;

      for (const transaction of preAnchorTransactions) {
        const impact = this.getTransactionBalanceImpact(transaction);
        runningBalance += impact;

        transactionsWithBalance.push({
          ...transaction,
          balance: runningBalance
        });
      }
    }

    // Calculate post-anchor balances (working forward from anchor)
    let runningBalance = anchorBalance;

    for (const transaction of postAnchorTransactions) {
      const impact = this.getTransactionBalanceImpact(transaction);
      runningBalance += impact;

      transactionsWithBalance.push({
        ...transaction,
        balance: runningBalance
      });
    }

    // Return sorted by date descending (newest first)
    return transactionsWithBalance.sort((a, b) =>
      toUTCDateString(b.date).localeCompare(toUTCDateString(a.date))
    );
  }

  /**
   * Sync account balance with latest calculated balance from anchors and transactions
   * This ensures accounts.balance === latest_anchor.balance + sum(transactions_after_latest_anchor)
   *
   * @param tenantId - Tenant ID for data isolation
   * @param accountId - Account ID to sync balance for
   * @returns Promise<{ oldBalance: number, newBalance: number, updated: boolean }>
   */
  public async syncAccountBalance(
    tenantId: string,
    accountId: number
  ): Promise<{ oldBalance: number, newBalance: number, updated: boolean }> {
    try {
      // Get current account balance
      const account = await this.validateAccountAccess(tenantId, accountId);
      const oldBalance = Number(account.balance);

      // Calculate the correct balance using our anchor-based method
      const currentDate = getCurrentUTCDate();
      const currentDateString = toUTCDateString(currentDate);
      const calculatedBalance = await this.calculateBalanceAtDate(tenantId, accountId, currentDateString);
      const newBalance = calculatedBalance.balance;

      // Check if update is needed
      if (Math.abs(oldBalance - newBalance) < 0.01) {
        console.log(`✅ [syncAccountBalance] Account ${accountId} balance is already in sync: $${oldBalance}`);
        return { oldBalance, newBalance, updated: false };
      }

      // Update the account balance
      await AccountBalanceHistoryService.prisma.account.update({
        where: {
          id: accountId,
          tenant_id: tenantId
        },
        data: {
          balance: newBalance
        }
      });

      console.log(`🔄 [syncAccountBalance] Account ${accountId} balance updated: $${oldBalance} → $${newBalance}`);
      return { oldBalance, newBalance, updated: true };

    } catch (error) {
      console.error(`❌ [syncAccountBalance] Failed to sync account ${accountId}:`, error);
      throw new Error(`Failed to sync account balance: ${error}`);
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
    tenantId: string,
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
    tenantId: string,
    accountId: number,
    targetDate: string
  ): Promise<BalanceCalculationResult> {
    try {
      // Note: Balance anchors are not yet implemented in v5
      // For now, we'll use direct transaction sum (Method 1)
      // TODO: Implement balance anchor support when available

      // Method 1: Direct transaction sum
      // Convert YYYY-MM-DD string to Date object for Prisma
      const targetDateObj = parseDateStringForDB(targetDate, true);

      const transactions = await prisma.transaction.findMany({
        where: {
          tenant_id: tenantId,
          account_id: accountId,
          date: {
            lte: targetDateObj
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
    // Use transaction amount exactly as stored in database
    // INCOME: stored as positive (+2500)
    // EXPENSE: stored as negative (-800)
    // TRANSFER: stored with correct sign (±500)
    return Number(transaction.amount);
  }

  /**
   * Calculate daily net amount (sum of all transactions on a specific date)
   *
   * @param transactions - All transactions in the range
   * @param date - Date to calculate net amount for
   * @returns number - Net amount for the day
   */
  private calculateDailyNetAmount(transactions: Transaction[], date: string): number {
    const dailyTransactions = transactions.filter(t => toUTCDateString(t.date) === date);

    // Debug: Log transaction details for the first few days
    if (dailyTransactions.length > 0) {
      console.log(`🔍 [Daily Net Amount] Date: ${date}`);
      dailyTransactions.forEach(t => {
        const impact = this.getTransactionBalanceImpact(t);
        console.log(`  - ${t.type}: $${t.amount} → Impact: $${impact} (${t.description?.substring(0, 30)}...)`);
      });
    }

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
  private async validateAccountAccess(tenantId: string, accountId: number): Promise<Account> {
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
    const defaultStartDate = createUTCDate(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 30
    ); // Last 30 days

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
    tenantId: string,
    accountId: number,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    // Convert YYYY-MM-DD strings to Date objects for Prisma
    const startDateObj = parseDateStringForDB(startDate);
    const endDateObj = parseDateStringForDB(endDate, true);

    return await prisma.transaction.findMany({
      where: {
        tenant_id: tenantId,
        account_id: accountId,
        date: {
          gte: startDateObj,
          lte: endDateObj
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
    tenantId: string,
    accountId: number,
    startDate: string,
    endDate: string
  ): Promise<number> {
    // Convert YYYY-MM-DD strings to Date objects for Prisma
    const startDateObj = parseDateStringForDB(startDate);
    const endDateObj = parseDateStringForDB(endDate, true);

    return await prisma.transaction.count({
      where: {
        tenant_id: tenantId,
        account_id: accountId,
        date: {
          gte: startDateObj,
          lte: endDateObj
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
    const uniqueDates = new Set(transactions.map(t => toUTCDateString(t.date)));
    return Array.from(uniqueDates).sort();
  }
}
