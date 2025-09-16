/**
 * TypeScript interfaces for Account Balance History feature
 * Ensures type safety and MVP accounting system compliance
 */

export interface BalanceHistoryData {
  date: string;           // YYYY-MM-DD format
  balance: number;        // Calculated balance using MVP accounting methods
  netAmount: number;      // Daily net change (sum of transactions for that day)
  calculationMethod: 'direct' | 'anchor-forward' | 'anchor-backward';
  anchorUsed?: {
    id: number;
    date: string;
    balance: number;
  };
}

export interface BalanceSummary {
  startingBalance: number;
  endingBalance: number;
  totalTransactions: number;
  netChange: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  calculationMethods: {
    direct: number;        // Count of days using direct calculation
    anchorBased: number;   // Count of days using anchor-based calculation
  };
}

export interface BalanceHistoryFilters {
  accountId: number;
  startDate?: string;    // YYYY-MM-DD format
  endDate?: string;      // YYYY-MM-DD format
}

export interface BalanceCalculationResult {
  balance: number;
  method: 'direct' | 'anchor-forward' | 'anchor-backward';
  anchorUsed?: {
    id: number;
    date: string;
    balance: number;
  };
  transactionsProcessed: number;
}

export interface DailyBalanceData {
  date: string;
  transactions: Array<{
    id: number;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    description: string;
  }>;
  dailyNetAmount: number;
  runningBalance: number;
  calculationMethod: 'direct' | 'anchor-forward' | 'anchor-backward';
}

// For API responses
export interface BalanceHistoryResponse {
  success: boolean;
  data: BalanceHistoryData[];
  summary?: BalanceSummary;
  error?: string;
}

export interface BalanceSummaryResponse {
  success: boolean;
  data: BalanceSummary;
  error?: string;
}
