'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface TestResult {
  balanceHistory: any[];
  transactions: any[];
  consistencyErrors: Array<{
    date: string;
    expectedBalance: number;
    actualBalance: number;
    difference: number;
  }>;
  summary: {
    totalComparisons: number;
    errors: number;
    successRate: number;
  };
}

export default function BalanceConsistencyTestPage() {
  const [accountId, setAccountId] = useState('5'); // Default to seed account
  const [startDate, setStartDate] = useState('2025-08-01');
  const [endDate, setEndDate] = useState('2025-09-16');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Authentication state
  const [email, setEmail] = useState('demo@fintrack.com');
  const [password, setPassword] = useState('demo123');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Check authentication status on component mount
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = async () => {
    setAuthLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        setIsAuthenticated(true);
        setError(null);
      } else {
        throw new Error('Login failed: No token received');
      }
    } catch (err: any) {
      setError(`Login failed: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setResult(null);
  };

  const runConsistencyTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get auth token from localStorage or session
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No auth token found. Please log in first.');
      }

      console.log('🔍 Testing Balance Consistency');
      console.log(`Account ID: ${accountId}, Date Range: ${startDate} to ${endDate}`);

      // Fetch data from both endpoints
      const [balanceHistoryResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/accounts/${accountId}/balance-history?startDate=${startDate}&endDate=${endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/accounts/${accountId}/transactions-with-balances?startDate=${startDate}&endDate=${endDate}&sortOrder=asc`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!balanceHistoryResponse.ok) {
        throw new Error(`Balance history API failed: ${balanceHistoryResponse.status} ${balanceHistoryResponse.statusText}`);
      }

      if (!transactionsResponse.ok) {
        throw new Error(`Transactions API failed: ${transactionsResponse.status} ${transactionsResponse.statusText}`);
      }

      const balanceHistoryData = await balanceHistoryResponse.json();
      const transactionsData = await transactionsResponse.json();

      if (!balanceHistoryData.success) {
        throw new Error(`Balance history API error: ${balanceHistoryData.error}`);
      }

      if (!transactionsData.success) {
        throw new Error(`Transactions API error: ${transactionsData.error}`);
      }

      const balanceHistory = balanceHistoryData.data || [];
      const transactions = transactionsData.data.transactions || [];

      console.log(`✅ Fetched ${balanceHistory.length} balance history entries and ${transactions.length} transactions`);

      // Create maps for comparison
      const dailyBalances = new Map();
      balanceHistory.forEach((entry: any) => {
        dailyBalances.set(entry.date, entry.endingBalance);
      });

      const transactionDailyBalances = new Map();
      transactions.forEach((transaction: any) => {
        const date = transaction.date.split('T')[0];
        transactionDailyBalances.set(date, transaction.balance);
      });

      // Compare balances
      const consistencyErrors: TestResult['consistencyErrors'] = [];
      let totalComparisons = 0;

      for (const [date, expectedBalance] of dailyBalances) {
        const actualBalance = transactionDailyBalances.get(date);
        totalComparisons++;

        if (actualBalance !== undefined) {
          const difference = Math.abs(expectedBalance - actualBalance);
          if (difference > 0.01) {
            consistencyErrors.push({
              date,
              expectedBalance,
              actualBalance,
              difference
            });
          }
        }
      }

      setResult({
        balanceHistory,
        transactions,
        consistencyErrors,
        summary: {
          totalComparisons,
          errors: consistencyErrors.length,
          successRate: totalComparisons > 0 ? ((totalComparisons - consistencyErrors.length) / totalComparisons * 100) : 0
        }
      });

    } catch (err: any) {
      console.error('Test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Balance Consistency Test</h1>
        <p className="text-gray-600">
          Test the consistency between balance-history and transactions-with-balances API endpoints
        </p>
      </div>

      {/* Authentication Section */}
      {!isAuthenticated ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to test the API endpoints.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="demo@fintrack.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="demo123"
              />
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={authLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {authLoading ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      ) : (
        <div className="bg-green-50 rounded-lg p-4 mb-6 flex justify-between items-center">
          <div className="text-green-800">
            ✅ <strong>Authenticated</strong> - Ready to test API endpoints
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            Logout
          </Button>
        </div>
      )}

      {/* Test Configuration */}
      {isAuthenticated && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account ID
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={runConsistencyTest}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Running Test...' : 'Run Consistency Test'}
          </Button>
        </div>
      </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <div className="text-red-800">
            <strong>Test Failed:</strong> {error}
          </div>
        </Alert>
      )}

      {/* Results */}
      {isAuthenticated && result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.balanceHistory.length}</div>
                <div className="text-sm text-gray-600">Balance History Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.transactions.length}</div>
                <div className="text-sm text-gray-600">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.summary.errors}</div>
                <div className="text-sm text-gray-600">Consistency Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{result.summary.successRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>

            {result.summary.errors === 0 ? (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <div className="text-green-800">
                  🎉 <strong>Perfect Consistency!</strong> Both endpoints are using the same calculation logic.
                </div>
              </Alert>
            ) : (
              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <div className="text-yellow-800">
                  ⚠️ <strong>Inconsistencies Found:</strong> {result.summary.errors} out of {result.summary.totalComparisons} comparisons failed.
                </div>
              </Alert>
            )}
          </div>

          {/* Consistency Errors */}
          {result.consistencyErrors.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Consistency Errors</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected (Balance History)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual (Transactions)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.consistencyErrors.map((error, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{error.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${error.expectedBalance.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${error.actualBalance.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">${error.difference.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw Data Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Raw Data Preview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Balance History (First 5)</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.balanceHistory.slice(0, 5), null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Transactions (First 5)</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.transactions.slice(0, 5), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Make sure you're logged in (auth token is stored in localStorage/sessionStorage)</li>
          <li>Enter the account ID you want to test (default: 5 from seed data)</li>
          <li>Set the date range for the test</li>
          <li>Click "Run Consistency Test" to compare both endpoints</li>
          <li>Review the results to ensure both endpoints return consistent balance calculations</li>
        </ol>
      </div>
    </div>
  );
}
