'use client';

import React from 'react';
import { Transaction } from '@prisma/client';
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { formatDateForDisplay, parseAndConvertToUTC } from '@/lib/utils/date-utils';

interface TransactionWithBalance extends Transaction {
  balance: number;
  account?: {
    name: string;
    type: string;
  };
  category?: {
    id: string;
    name: string;
    type: string;
  };
  member?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
}

interface AccountTransactionsTableProps {
  transactions: TransactionWithBalance[];
  loading?: boolean;
}

export default function AccountTransactionsTable({
  transactions,
  loading = false
}: AccountTransactionsTableProps) {

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAmountDisplay = (amount: number) => {
    const isPositive = amount >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="font-medium">
          {formatCurrency(Math.abs(amount))}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Account Transactions</h3>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Account Transactions</h3>
        </div>
        <div className="p-8 text-center">
          <ArrowUpDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No transactions found for the selected date range.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Account Transactions</h3>
        <p className="text-sm text-gray-600 mt-1">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
        </p>
      </div>

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.date.toString())}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium">{transaction.description}</span>
                    {transaction.category && (
                      <span className="text-xs text-gray-500 mt-1">
                        {transaction.category.name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getAmountDisplay(Number(transaction.amount))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(transaction.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
