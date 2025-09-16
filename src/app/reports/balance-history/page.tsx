'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { BalanceHistoryFilters } from '@/components/balance-history/BalanceHistoryFilters';
import { BalanceHistorySummary } from '@/components/balance-history/BalanceHistorySummary';
import { AccountBalanceChart } from '@/components/balance-history/AccountBalanceChart';
import AccountTransactionsTable from '@/components/balance-history/AccountTransactionsTable';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { api } from '@/lib/client/api';
import { getCurrentUTCDate, subtractDays, parseAndConvertToUTC } from '@/lib/utils/date-utils';
import type { BalanceHistoryData, BalanceSummary, BalanceHistoryFilters as FilterType } from '@/types/balance-history';
import type { Transaction } from '@prisma/client';
// Using API endpoints for all balance calculations

/**
 * Derive daily balance history from transactions with running balances
 * This ensures the chart uses the same corrected balance calculation as the transactions table
 */
function deriveBalanceHistoryFromTransactions(
  transactions: (Transaction & { balance: number })[]
): BalanceHistoryData[] {
  if (transactions.length === 0) return [];

  // Group transactions by date and calculate daily aggregates
  const dailyData = new Map<string, {
    date: string;
    balance: number;
    netAmount: number;
    transactionCount: number;
  }>();

  // Group transactions by date
  // Since transactions come sorted desc by date, the FIRST transaction for each date has the final balance
  for (const transaction of transactions) {
    const dateString = transaction.date.toString().split('T')[0]; // Get YYYY-MM-DD
    const amount = Number(transaction.amount);

    if (!dailyData.has(dateString)) {
      // First transaction for this date - use its balance as the final balance
      dailyData.set(dateString, {
        date: dateString,
        balance: transaction.balance, // This is the final balance for this date
        netAmount: amount,
        transactionCount: 1
      });
    } else {
      // Additional transactions for same date - only update netAmount, keep the balance from first transaction
      const existing = dailyData.get(dateString)!;
      existing.netAmount += amount;
      existing.transactionCount += 1;
      // Don't update balance - keep the final balance from the first transaction we saw for this date
    }
  }

  // Convert to array and sort by date, adding required calculationMethod
  return Array.from(dailyData.values())
    .map(item => ({
      date: item.date,
      balance: item.balance,
      netAmount: item.netAmount,
      calculationMethod: 'anchor-forward' as const // Since we're using anchor-based transactions
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Account response interface for API data - matches actual API response
interface AccountResponse {
  id: number;
  tenant_id: string;
  name: string;
  type: string;
  net_worth_category: string;
  balance: number;
  balance_date: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function BalanceHistoryPage() {
  // State management
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryData[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Array<Transaction & { balance: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<string>('');

  // Filter state - default to last 30 days
  const [filters, setFilters] = useState<FilterType>(() => {
    const today = getCurrentUTCDate();
    const thirtyDaysAgo = subtractDays(today, 30);

    return {
      accountId: null,
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  });

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Load balance data when filters change
  useEffect(() => {
    if (filters.accountId) {
      loadBalanceData();
    }
  }, [filters]);

  /**
   * Load available accounts
   */
  const loadAccounts = async () => {
    try {
      const response = await api.getAccounts();

      if (response.success && response.data) {
        // Handle both array format and paginated format
        const accountsData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).items || response.data

        setAccounts(accountsData);

        // Auto-select first account if available
        if (accountsData.length > 0 && !filters.accountId) {
          setFilters(prev => ({ ...prev, accountId: accountsData[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setError('Failed to load accounts');
    }
  };

  /**
   * Load balance history, summary data, and transactions
   */
  const loadBalanceData = async () => {
    if (!filters.accountId) return;

    try {
      setLoading(true);
      setError(null);

      // Get auth token for requests
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        throw new Error('Authentication required');
      }
      // Load summary and transactions in parallel
      // Note: We'll derive the balance history from transactions for consistency
      const [summaryResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/accounts/${filters.accountId}/balance-summary?startDate=${filters.startDate}&endDate=${filters.endDate}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`/api/accounts/${filters.accountId}/transactions-with-balances?startDate=${filters.startDate}&endDate=${filters.endDate}&sortOrder=desc&limit=1000`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      // Check for HTTP errors
      if (!summaryResponse.ok) {
        throw new Error(`Failed to load balance summary: ${summaryResponse.statusText}`);
      }
      if (!transactionsResponse.ok) {
        throw new Error(`Failed to load transactions: ${transactionsResponse.statusText}`);
      }

      // Parse JSON responses
      const summaryData = await summaryResponse.json();
      const transactionsData = await transactionsResponse.json();

      // Check for API errors
      if (!summaryData.success) {
        throw new Error(summaryData.error || 'Failed to load balance summary');
      }
      if (!transactionsData.success) {
        throw new Error(transactionsData.error || 'Failed to load transactions');
      }

      setBalanceSummary(summaryData.data || null);

      // Set transactions directly - they already have correct running balances from balance anchors
      if (transactionsData.data?.transactions && transactionsData.data.transactions.length > 0) {
        const transactions = transactionsData.data.transactions;

        // Transactions already have running balances calculated using balance anchors
        setTransactions(transactions);

        // Derive balance history from transactions for chart consistency
        const balanceHistoryFromTransactions = deriveBalanceHistoryFromTransactions(transactions);
        setBalanceHistory(balanceHistoryFromTransactions);
      } else {
        setTransactions([]);
        setBalanceHistory([]);
      }

    } catch (error: any) {
      console.error('Failed to load balance data:', error);
      setError(`API Error: ${error.message}`);
      setBalanceHistory([]);
      setBalanceSummary(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle filter changes
   */
  const handleFiltersChange = useCallback((newFilters: Partial<FilterType & { fromTimePeriod?: boolean }>) => {
    // If start or end date is manually changed (not from time period), reset time period
    if ((newFilters.startDate !== undefined || newFilters.endDate !== undefined) && !newFilters.fromTimePeriod) {
      setTimePeriod('');
    }

    // Remove the flag before updating filters
    const { fromTimePeriod, ...filterUpdates } = newFilters;
    setFilters(prev => ({ ...prev, ...filterUpdates }));
  }, []);

  /**
   * Handle manual refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBalanceData();
    setRefreshing(false);
  };

  /**
   * Get selected account details
   */
  const selectedAccount = accounts.find(account => account.id === filters.accountId);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Matching v4.1 exactly */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Account Balance</h1>
            </div>
            {/* Account Selection - v4.1 style in header */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Account</span>
              <select
                value={filters.accountId || ''}
                onChange={(e) => handleFiltersChange({ accountId: e.target.value ? Number(e.target.value) : null })}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select an account...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-gray-600">
            Track your account balance over time and analyze spending patterns
          </p>
        </div>

        {/* Filters Section - v4.1 style */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <BalanceHistoryFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            loading={loading}
            timePeriod={timePeriod}
            onTimePeriodChange={setTimePeriod}
          />
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div className="text-red-800">{error}</div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </Alert>
        )}

        {/* Loading State */}
        {loading && filters.accountId && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading balance history...</span>
            </div>
          </div>
        )}

        {/* No Account Selected */}
        {!filters.accountId && !loading && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Account</h3>
            <p className="text-gray-600">Choose an account to view its balance history</p>
          </div>
        )}

        {/* Main Content - Only show when we have data */}
        {!loading && filters.accountId && balanceSummary && (
          <>
            {/* Summary Cards - v4.1 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <BalanceHistorySummary summary={balanceSummary} />
            </div>

            {/* Balance History Chart - v4.1 style card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Balance Trend</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {selectedAccount && (
                    <span>{selectedAccount.name}</span>
                  )}
                  <span>•</span>
                  <span>{filters.startDate} to {filters.endDate}</span>
                </div>
              </div>
              <AccountBalanceChart
                data={balanceHistory}
                accountName={selectedAccount?.name}
              />
            </div>

            {/* Account Transactions Table */}
            <AccountTransactionsTable
              transactions={transactions}
              loading={loading}
            />
          </>
        )}

        {/* No Data State */}
        {!loading && filters.accountId && balanceHistory.length === 0 && !error && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">
              No transactions found for the selected date range
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
