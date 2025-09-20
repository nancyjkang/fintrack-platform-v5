'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, BarChart3, Database, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { getCurrentDate, getDaysAgo, toUTCDateString, formatDateForDisplay, createUTCDate, getCurrentUTCDate } from '@/lib/utils/date-utils';
import { useAuth } from '@/lib/client/auth-context';

interface CubeStats {
  totalRecords: number;
  weeklyRecords: number;
  monthlyRecords: number;
  dateRange: { earliest: string | null; latest: string | null };
  accountCount: number;
  categoryCount: number;
  lastUpdated: string | null;
}

interface OperationResult {
  success: boolean;
  message?: string;
  duration?: string;
  deletedCount?: number;
  error?: string;
}

export default function CubeOperationsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CubeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [result, setResult] = useState<OperationResult | null>(null);
  const [authToken, setAuthToken] = useState('');

  // Period configuration for cube operations
  const [periodType, setPeriodType] = useState<'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY'>('MONTHLY');
  const [periodCount, setPeriodCount] = useState(6); // Default to 6 periods

  // Calculate date range based on period type and count (complete periods)
  const getDateRangeFromPeriods = (type: string, count: number) => {
    const today = getCurrentUTCDate();
    const endDate = getCurrentDate(); // End is always today
    const startDateObj = createUTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    switch (type) {
      case 'WEEKLY':
        // Go back to start of the week N weeks ago
        const currentDayOfWeek = today.getUTCDay();
        const daysToStartOfWeek = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Monday = 0
        startDateObj.setUTCDate(today.getUTCDate() - daysToStartOfWeek - ((count - 1) * 7));
        startDateObj.setUTCHours(0, 0, 0, 0);
        break;
      case 'BI_WEEKLY':
        // Go back to start of the bi-week N bi-weeks ago
        const currentDay = today.getUTCDay();
        const daysToStartOfBiWeek = currentDay === 0 ? 6 : currentDay - 1;
        startDateObj.setUTCDate(today.getUTCDate() - daysToStartOfBiWeek - ((count - 1) * 14));
        startDateObj.setUTCHours(0, 0, 0, 0);
        break;
      case 'MONTHLY':
        // Go back to 1st of the month N months ago
        startDateObj.setUTCFullYear(today.getUTCFullYear(), today.getUTCMonth() - count + 1, 1);
        startDateObj.setUTCHours(0, 0, 0, 0);
        break;
      case 'QUARTERLY':
        // Go back to start of quarter N quarters ago
        const currentQuarter = Math.floor(today.getUTCMonth() / 3);
        const targetQuarter = currentQuarter - count + 1;
        const targetYear = today.getUTCFullYear() + Math.floor(targetQuarter / 4);
        const targetMonth = ((targetQuarter % 4) + 4) % 4 * 3;
        startDateObj.setUTCFullYear(targetYear, targetMonth, 1);
        startDateObj.setUTCHours(0, 0, 0, 0);
        break;
      case 'BI_ANNUALLY':
        // Go back to start of 6-month period N periods ago
        const currentHalf = Math.floor(today.getUTCMonth() / 6);
        const targetHalf = currentHalf - count + 1;
        const targetYearBi = today.getUTCFullYear() + Math.floor(targetHalf / 2);
        const targetMonthBi = ((targetHalf % 2) + 2) % 2 * 6;
        startDateObj.setUTCFullYear(targetYearBi, targetMonthBi, 1);
        startDateObj.setUTCHours(0, 0, 0, 0);
        break;
      case 'ANNUALLY':
        // Go back to January 1st N years ago
        startDateObj.setUTCFullYear(today.getUTCFullYear() - count + 1, 0, 1);
        startDateObj.setUTCHours(0, 0, 0, 0);
        break;
      default:
        // Default to monthly
        startDateObj.setUTCFullYear(today.getUTCFullYear(), today.getUTCMonth() - count + 1, 1);
        startDateObj.setUTCHours(0, 0, 0, 0);
    }

    const startDate = toUTCDateString(startDateObj);
    return { startDate, endDate };
  };

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cube/status', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        const error = await response.json();
        setResult({
          success: false,
          error: error.error || 'Failed to load cube statistics'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      });
    } finally {
      setLoading(false);
    }
  };

  const executeOperation = async (operationType: 'populate' | 'rebuild' | 'clear') => {
    setOperation(operationType);
    setResult(null);
    setLoading(true);

    try {
      let url = '';
      let method = 'POST';
      let body: string | null = null;

      // Calculate date range from period selection
      const { startDate, endDate } = getDateRangeFromPeriods(periodType, periodCount);

      switch (operationType) {
        case 'populate':
          url = '/api/cube/populate';
          // Use calculated date range for populate
          const populateBody = {
            clearExisting: true,
            startDate,
            endDate
          };
          body = JSON.stringify(populateBody);
          break;
        case 'rebuild':
          url = '/api/cube/rebuild';
          // Use calculated date range for rebuild
          body = JSON.stringify({ startDate, endDate });
          break;
        case 'clear':
          url = '/api/cube/clear';
          method = 'POST'; // Changed from DELETE to match the actual API
          break;
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        ...(body && { body })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          duration: data.duration,
          deletedCount: data.deletedCount
        });
        // Reload stats after successful operation
        await loadStats();
      } else {
        setResult({
          success: false,
          error: data.error || data.details || 'Operation failed'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      });
    } finally {
      setLoading(false);
      setOperation(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return formatDateForDisplay(dateString);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Financial Cube Operations</h1>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cube Statistics */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Cube Statistics
                </h2>
                <button
                  onClick={loadStats}
                  disabled={loading}
                  className="bg-gray-600 text-white py-1 px-3 rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loading && !stats && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              )}

              {stats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Total Records</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{formatNumber(stats.totalRecords)}</div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Weekly Records</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">{formatNumber(stats.weeklyRecords)}</div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Monthly Records</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">{formatNumber(stats.monthlyRecords)}</div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Accounts</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-900">{formatNumber(stats.accountCount)}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Categories:</span>
                        <span className="font-medium">{formatNumber(stats.categoryCount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date Range:</span>
                        <span className="font-medium">
                          {formatDate(stats.dateRange.earliest)} - {formatDate(stats.dateRange.latest)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{formatDate(stats.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!stats && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Click refresh to load cube statistics
                </div>
              )}
            </div>
          </div>

          {/* Operations Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cube Operations</h2>

              {/* Period Configuration */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Period Configuration</h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">
                      Period Type
                    </label>
                    <select
                      value={periodType}
                      onChange={(e) => setPeriodType(e.target.value as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="WEEKLY">Weekly</option>
                      <option value="BI_WEEKLY">Bi-weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="BI_ANNUALLY">Bi-annually</option>
                      <option value="ANNUALLY">Annually</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">
                      Number of Periods
                    </label>
                    <select
                      value={periodCount}
                      onChange={(e) => setPeriodCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value={3}>3</option>
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={15}>15</option>
                    </select>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Selected range: {(() => {
                    const { startDate, endDate } = getDateRangeFromPeriods(periodType, periodCount);
                    return `${formatDate(startDate)} to ${formatDate(endDate)} (${periodCount} ${periodType.toLowerCase()} periods)`;
                  })()}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>• <strong>Populate:</strong> Processes data for the selected period (clears existing data first)</div>
                  <div>• <strong>Rebuild:</strong> Clears and rebuilds data for the selected period only</div>
                  <div>• <strong>Clear:</strong> Removes ALL cube data regardless of period selection</div>
                </div>
              </div>

              {/* Operation Buttons */}
              <div className="space-y-4">
                <button
                  onClick={() => executeOperation('populate')}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  {operation === 'populate' && loading ? 'Populating...' : 'Populate Cube'}
                </button>

                <button
                  onClick={() => executeOperation('rebuild')}
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {operation === 'rebuild' && loading ? 'Rebuilding...' : 'Rebuild Cube'}
                </button>

                <button
                  onClick={() => executeOperation('clear')}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {operation === 'clear' && loading ? 'Clearing...' : 'Clear All Data'}
                </button>
              </div>

              {/* Operation Descriptions */}
              <div className="mt-6 text-xs text-gray-600 space-y-2 p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-800 mb-2">Operation Details:</div>
                <div><strong>Populate:</strong> Initial setup - processes data for the selected {periodCount} month period</div>
                <div><strong>Rebuild:</strong> Targeted fix - clears and rebuilds the selected {periodCount} month period</div>
                <div><strong>Clear:</strong> Nuclear option - removes ALL cube data for your tenant (ignores period selection)</div>
              </div>
            </div>

            {/* Operation Result */}
            {result && (
              <div className={`rounded-lg p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? 'Success' : 'Error'}
                  </span>
                </div>

                <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success ? result.message : result.error}
                </div>

                {result.duration && (
                  <div className="text-xs text-green-600 mt-1">
                    Completed in {result.duration}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
