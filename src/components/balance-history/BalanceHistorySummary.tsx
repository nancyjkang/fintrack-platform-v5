'use client';

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { BalanceSummary } from '@/types/balance-history';

interface BalanceHistorySummaryProps {
  summary: BalanceSummary;
}

export function BalanceHistorySummary({ summary }: BalanceHistorySummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  const calculatePercentageChange = () => {
    if (summary.startingBalance === 0) {
      // If starting balance is 0, we can't calculate percentage
      return summary.netChange === 0 ? '0.0' : '∞';
    }
    const percentage = (summary.netChange / Math.abs(summary.startingBalance)) * 100;
    return percentage.toFixed(1);
  };

  const formatNetChangeWithPercentage = () => {
    const amount = summary.netChange >= 0 ? '+' : '';
    const currency = formatCurrency(summary.netChange);
    const percentage = calculatePercentageChange();

    if (percentage === '∞') {
      return `${amount}${currency}`;
    }

    return `${amount}${currency} (${percentage}%)`;
  };

  return (
    <>
      {/* Starting Balance Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Starting Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.startingBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Ending Balance Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Ending Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.endingBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Net Change Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`${getChangeColor(summary.netChange)}`}>
              {getChangeIcon(summary.netChange)}
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Net Change</p>
            <p className={`text-2xl font-bold ${getChangeColor(summary.netChange)}`}>
              {formatNetChangeWithPercentage()}
            </p>
          </div>
        </div>
      </div>

    </>
  );
}
