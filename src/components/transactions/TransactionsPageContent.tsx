'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import TransactionsFilters from './TransactionsFilters';
import TransactionsList from './TransactionsList';
import TransactionsSummary from './TransactionsSummary';
import TransactionForm from './TransactionForm';
import { getCurrentDate, addDays, subtractDays, toUTCDateString } from '@/lib/utils/date-utils';

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

export default function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
    description: '',
    dateRange: 'this-month', // Default to "This Month" like v4.1
    fromDate: '',
    toDate: '',
    account: '',
    type: '',
    category: '',
    recurring: ''
  });

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  // Initialize date range when component mounts (v4.1 pattern)
  useEffect(() => {
    const { fromDate, toDate } = getDateRange('this-month');
    setFilters(prev => ({
      ...prev,
      fromDate,
      toDate
    }));

    // Check for add parameter in URL
    const addParam = searchParams.get('add');
    if (addParam === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  // Helper function to get date ranges (from v4.1)
  const getDateRange = (range: string): { fromDate: string; toDate: string } => {
    const today = getCurrentDate();

    switch (range) {
      case 'today':
        return { fromDate: today, toDate: today };
      case 'yesterday':
        const yesterday = subtractDays(today, 1);
        return { fromDate: toUTCDateString(yesterday), toDate: toUTCDateString(yesterday) };
      case 'this-week': {
        const date = new Date();
        const day = date.getDay();
        const diff = date.getDate() - day;
        const sunday = new Date(date.setDate(diff));
        const saturday = new Date(date.setDate(diff + 6));
        return {
          fromDate: sunday.toISOString().split('T')[0],
          toDate: saturday.toISOString().split('T')[0]
        };
      }
      case 'this-month': {
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return {
          fromDate: firstDay.toISOString().split('T')[0],
          toDate: lastDay.toISOString().split('T')[0]
        };
      }
      case 'last-30-days':
        return {
          fromDate: toUTCDateString(subtractDays(today, 30)),
          toDate: today
        };
      default:
        return { fromDate: '', toDate: '' };
    }
  };

  const handleFilterChange = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleAddTransaction = useCallback(() => {
    setEditingTransaction(null);
    setShowForm(true);
  }, []);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingTransaction(null);
  }, []);

  const handleTransactionSaved = useCallback(() => {
    setShowForm(false);
    setEditingTransaction(null);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleTransactionsChange = useCallback((transactions: Transaction[]) => {
    setFilteredTransactions(transactions);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header section - v4.1 layout */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">Manage your income, expenses, and transfers</p>
        </div>
        <button
          onClick={handleAddTransaction}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Filters section - v4.1 layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <TransactionsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Summary section - v4.1 layout */}
      <div className="mb-6">
        <TransactionsSummary
          transactions={filteredTransactions}
          filters={filters}
        />
      </div>

      {/* Transactions table - v4.1 layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <TransactionsList
          filters={filters}
          onEditTransaction={handleEditTransaction}
          onTransactionsChange={handleTransactionsChange}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Transaction form modal - v4.1 pattern */}
      {showForm && (
        <TransactionForm
          editingTransaction={editingTransaction}
          onSave={handleTransactionSaved}
          onCancel={handleFormClose}
        />
      )}
    </div>
  );
}
