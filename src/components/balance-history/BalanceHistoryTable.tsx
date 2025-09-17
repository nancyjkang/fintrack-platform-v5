'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BalanceHistoryData } from '@/types/balance-history';
import { formatDateForDisplay, parseAndConvertToUTC, toUTCDateString } from '@/lib/utils/date-utils';

interface BalanceHistoryTableProps {
  data: BalanceHistoryData[];
}

export function BalanceHistoryTable({ data }: BalanceHistoryTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  const getNetChangeDisplay = (netAmount: number) => {
    if (netAmount > 0) {
      return {
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
        text: `+${formatCurrency(netAmount)}`,
        className: 'text-green-600',
      };
    } else if (netAmount < 0) {
      return {
        icon: <TrendingDown className="h-4 w-4 text-red-600" />,
        text: formatCurrency(netAmount),
        className: 'text-red-600',
      };
    } else {
      return {
        icon: <Minus className="h-4 w-4 text-gray-400" />,
        text: formatCurrency(0),
        className: 'text-gray-600',
      };
    }
  };

  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No balance history data available for the selected date range.</p>
      </div>
    );
  }

  // Sort data by date (most recent first)
  const sortedData = [...data].sort((a, b) => toUTCDateString(b.date).localeCompare(toUTCDateString(a.date)));

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => {
              const netChange = getNetChangeDisplay(item.netAmount);

              return (
                <tr key={`${item.date}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(item.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Daily Net Change
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`flex items-center justify-end gap-1 text-sm font-medium ${netChange.className}`}>
                      {netChange.icon}
                      {netChange.text}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.balance)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {sortedData.length} {sortedData.length === 1 ? 'day' : 'days'} of balance history
          </span>
          <span>
            Period: {formatDate(sortedData[sortedData.length - 1]?.date)} to {formatDate(sortedData[0]?.date)}
          </span>
        </div>
      </div>
    </div>
  );
}
