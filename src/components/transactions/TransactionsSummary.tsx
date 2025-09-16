'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';

interface Transaction {
  id: number;
  account_id: number;
  category_id?: number;
  amount: number;
  description: string;
  date: Date;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  is_recurring: boolean;
  created_at: Date;
  updated_at: Date;
  tenant_id: number;
}

interface Filters {
  description: string;
  dateRange: string;
  fromDate: string;
  toDate: string;
  account: string;
  type: string;
  category: string;
  recurring: string;
}

interface TransactionsSummaryProps {
  transactions: Transaction[];
  filters: Filters;
}

export default function TransactionsSummary({ transactions, filters }: TransactionsSummaryProps) {
  // Calculate summary data (v4.1 logic)
  const summary = useMemo(() => {
    const totalTransactions = transactions.length;

    // Calculate totals by type
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const transfers = transactions
      .filter(t => t.type === 'TRANSFER')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate net value (income - expenses)
    const netValue = income - expenses;

    return {
      totalTransactions,
      income,
      expenses,
      transfers,
      netValue
    };
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDateRangeLabel = () => {
    switch (filters.dateRange) {
      case 'this-week':
        return 'This week';
      case 'last-week':
        return 'Last week';
      case 'this-month':
        return 'This month';
      case 'last-month':
        return 'Last month';
      case 'this-quarter':
        return 'This quarter';
      case 'last-quarter':
        return 'Last quarter';
      case 'this-half':
        return 'This half';
      case 'last-half':
        return 'Last half';
      default:
        return 'All time';
    }
  };

  // Generate filter summary text - v4.1 style
  const getFilterSummary = () => {
    const parts = [];

    if (filters.dateRange) {
      parts.push(`Date: ${getDateRangeLabel()}`);
    }

    if (filters.account) {
      parts.push(`Account: Selected account`);
    }

    if (filters.type) {
      parts.push(`Type: ${filters.type}`);
    }

    if (filters.category) {
      parts.push(`Category: Selected category`);
    }

    if (filters.recurring) {
      const recurringLabel = filters.recurring === 'true' ? 'Recurring only' : 'One-time only';
      parts.push(`Recurring: ${recurringLabel}`);
    }

    if (filters.description) {
      parts.push(`Search: "${filters.description}"`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No filters applied';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      {/* Filter Summary - v4.1 style */}
      <div className="mb-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Filters:</span> {getFilterSummary()}
        </p>
      </div>

      {/* Summary Stats - v4.1 text-based layout */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Transactions:</span>
          <span className="font-semibold text-gray-900">{summary.totalTransactions}</span>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Income:</span>
          <span className="font-semibold text-green-700">{formatCurrency(summary.income)}</span>
        </div>

        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <span className="text-gray-600">Expenses:</span>
          <span className="font-semibold text-red-700">{formatCurrency(summary.expenses)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-3 h-3 border border-purple-500 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
            </div>
          </div>
          <span className="text-gray-600">Transfers:</span>
          <span className="font-semibold text-purple-700">{formatCurrency(summary.transfers)}</span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className={`w-4 h-4 ${summary.netValue >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
          <span className="text-gray-600">Net:</span>
          <span className={`font-semibold ${summary.netValue >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatCurrency(summary.netValue)}
          </span>
        </div>
      </div>
    </div>
  );
}
