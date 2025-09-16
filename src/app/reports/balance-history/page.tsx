'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { BalanceHistoryFilters } from '@/components/balance-history/BalanceHistoryFilters';
import { BalanceHistorySummary } from '@/components/balance-history/BalanceHistorySummary';
import { AccountBalanceChart } from '@/components/balance-history/AccountBalanceChart';
import { BalanceHistoryTable } from '@/components/balance-history/BalanceHistoryTable';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { api } from '@/lib/client/api';
import type { BalanceHistoryData, BalanceSummary, BalanceHistoryFilters as FilterType } from '@/types/balance-history';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<string>('');

  // Filter state - default to last 30 days
  const [filters, setFilters] = useState<FilterType>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

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
        setAccounts(response.data);

        // Auto-select first account if available
        if (response.data.length > 0 && !filters.accountId) {
          setFilters(prev => ({ ...prev, accountId: response.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setError('Failed to load accounts');
    }
  };

  /**
   * Load balance history and summary data
   */
  const loadBalanceData = async () => {
    if (!filters.accountId) return;

    try {
      setLoading(true);
      setError(null);

      // Load both balance history and summary in parallel using fetch
      const [historyResponse, summaryResponse] = await Promise.all([
        fetch(`/api/accounts/${filters.accountId}/balance-history?startDate=${filters.startDate}&endDate=${filters.endDate}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`/api/accounts/${filters.accountId}/balance-summary?startDate=${filters.startDate}&endDate=${filters.endDate}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      // Parse JSON responses
      const historyData = await historyResponse.json();
      const summaryData = await summaryResponse.json();

      // Handle responses
      if (!historyResponse.ok) {
        throw new Error(`Failed to load balance history: ${historyResponse.statusText}`);
      }
      if (!summaryResponse.ok) {
        throw new Error(`Failed to load balance summary: ${summaryResponse.statusText}`);
      }

      if (!historyData.success) {
        throw new Error(historyData.error || 'Failed to load balance history');
      }
      if (!summaryData.success) {
        throw new Error(summaryData.error || 'Failed to load balance summary');
      }

      setBalanceHistory(historyData.data || []);
      setBalanceSummary(summaryData.data || null);

    } catch (error: any) {
      console.error('Failed to load balance data:', error);
      setError(`API Error: ${error.message}`);
      setBalanceHistory([]);
      setBalanceSummary(null);
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

            {/* Balance History Table - v4.1 style card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Daily Balance Details</h2>
              </div>
              <BalanceHistoryTable data={balanceHistory} />
            </div>
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
