'use client';

import { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, RotateCcw, FileText } from 'lucide-react';
import { formatDateForDisplay } from '@/lib/utils/date-utils';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { api } from '@/lib/client/api';

interface Transaction {
  id: number;
  account_id: number;
  category_id?: number;
  amount: number;
  description: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  tenant_id: number;
  // Relations
  account?: {
    id: number;
    name: string;
    type: string;
    color?: string;
  };
  category?: {
    id: number;
    name: string;
    type: string;
    color?: string;
  };
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

interface TransactionsListProps {
  filters: Filters;
  onEditTransaction?: (transaction: Transaction) => void;
  onTransactionsChange?: (transactions: Transaction[]) => void;
  refreshTrigger?: number;
}

interface TransactionQueryParams {
  search?: string;
  account_id?: string;
  type?: string;
  category_id?: string;
  is_recurring?: string;
  date_from?: string;
  date_to?: string;
}

export default function TransactionsList({
  filters,
  onEditTransaction,
  onTransactionsChange,
  refreshTrigger
}: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions based on filters
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params: TransactionQueryParams = {};

      if (filters.description) params.search = filters.description;
      if (filters.account) params.account_id = filters.account;
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category_id = filters.category;
      if (filters.recurring) params.is_recurring = filters.recurring;
      if (filters.fromDate) params.date_from = filters.fromDate;
      if (filters.toDate) params.date_to = filters.toDate;

      const response = await api.getTransactions(params);

      if (response.success) {
        const transactionsData = response.data?.transactions || [];

        // Convert amounts to numbers (keep dates as strings)
        const processedTransactions = transactionsData.map(t => ({
          ...t,
          amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount
        }));
        setTransactions(processedTransactions);
        onTransactionsChange?.(processedTransactions);
      } else {
        throw new Error(response.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setTransactions([]);
      onTransactionsChange?.([]);
    } finally {
      setLoading(false);
    }
  }, [filters, onTransactionsChange]);

  // Effects
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  // Handlers
  const handleDeleteClick = useCallback((transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!transactionToDelete) return;

    try {
      const response = await api.deleteTransaction(transactionToDelete.id);

      if (response.success) {
        // Refresh transactions
        fetchTransactions();
      } else {
        throw new Error(response.error || 'Failed to delete transaction');
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setShowDeleteDialog(false);
      setTransactionToDelete(null);
    }
  }, [transactionToDelete, fetchTransactions]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteDialog(false);
    setTransactionToDelete(null);
  }, []);

  const handleEditClick = useCallback((transaction: Transaction) => {
    onEditTransaction?.(transaction);
  }, [onEditTransaction]);

  // Bulk selection handlers
  const handleSelectTransaction = useCallback((transactionId: number, checked: boolean) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(transactionId);
      } else {
        newSet.delete(transactionId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(transactions.map(t => t.id));
      setSelectedTransactions(allIds);
    } else {
      setSelectedTransactions(new Set());
    }
  }, [transactions]);

  const clearSelection = useCallback(() => {
    setSelectedTransactions(new Set());
  }, []);

  // Bulk action handlers
  const handleBulkUpdateClick = useCallback(() => {
    setShowBulkUpdateModal(true);
  }, []);

  const handleBulkDeleteClick = useCallback(() => {
    setShowBulkDeleteDialog(true);
  }, []);

  // Helper functions - use data from transaction relations
  const getAccountName = (transaction: Transaction) => {
    return transaction.account?.name || 'Unknown Account';
  };

  const getAccountColor = (transaction: Transaction) => {
    return transaction.account?.color || '#6B7280'; // Default gray color
  };

  const getCategoryName = (transaction: Transaction) => {
    if (!transaction.category_id) return 'Uncategorized';
    return transaction.category?.name || 'Unknown Category';
  };

  const getCategoryColor = (transaction: Transaction) => {
    if (!transaction.category_id) return '#6B7280'; // Default gray color
    return transaction.category?.color || '#6B7280';
  };

  // Helper function to determine if a color is light or dark
  const isLightColor = (hexColor: string) => {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance (0-255, higher = lighter)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

    // Return true if light (luminance > 128)
    return luminance > 128;
  };

  const getTextColor = (backgroundColor: string) => {
    return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
  };

  // Selection state calculations
  const isAllSelected = transactions.length > 0 &&
    transactions.every(t => selectedTransactions.has(t.id));
  const isIndeterminate = transactions.some(t => selectedTransactions.has(t.id)) && !isAllSelected;

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));

    if (type === 'INCOME') {
      return <span className="text-green-600 font-medium">+{formatted}</span>;
    } else if (type === 'EXPENSE') {
      return <span className="text-red-600 font-medium">-{formatted}</span>;
    } else {
      return <span className="text-blue-600 font-medium">{formatted}</span>;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchTransactions}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Render empty state
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
        <p className="text-gray-600">
          {Object.values(filters).some(f => f)
            ? 'Try adjusting your filters to see more transactions.'
            : 'Get started by adding your first transaction.'
          }
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Table - v4.1 exact structure */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Bulk selection header - v4.1 pattern */}
          {selectedTransactions.size > 0 && (
            <thead className="bg-blue-50 border-b border-blue-200">
              <tr>
                <td colSpan={7} className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBulkUpdateClick}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Bulk Update
                      </button>
                      <button
                        onClick={handleBulkDeleteClick}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Bulk Delete
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-sm text-blue-700 hover:text-blue-900 transition-colors"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </thead>
          )}

          {/* Main table header - v4.1 exact structure */}
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  title={isAllSelected ? "Deselect all" : "Select all"}
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                Category/Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className={`hover:bg-gray-50 ${selectedTransactions.has(transaction.id) ? 'bg-blue-50' : ''}`}
                style={{
                  borderLeft: `3px solid ${getAccountColor(transaction)}`,
                  backgroundColor: selectedTransactions.has(transaction.id)
                    ? 'rgba(59, 130, 246, 0.05)' // Blue tint for selected
                    : `${getAccountColor(transaction)}08` // Account color with 3% opacity
                }}
              >
                {/* Checkbox */}
                <td className="px-6 py-3 whitespace-nowrap w-12">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.has(transaction.id)}
                    onChange={(e) => handleSelectTransaction(transaction.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>

                {/* Date */}
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatDateForDisplay(transaction.date.toString())}
                </td>

                {/* Description */}
                <td className="px-6 py-3 text-sm text-gray-900">
                  <div className="flex items-center">
                    <span className="truncate">{transaction.description}</span>
                    {transaction.is_recurring && (
                      <div title="Recurring transaction" className="ml-2 flex-shrink-0">
                        <RotateCcw className="w-4 h-4 text-blue-500" />
                      </div>
                    )}
                  </div>
                </td>

                {/* Category/Type - Combined column (v4.1 format) */}
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {transaction.category_id ? (
                      <span
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: getCategoryColor(transaction),
                          color: getTextColor(getCategoryColor(transaction))
                        }}
                      >
                        {getCategoryName(transaction)}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === 'INCOME' ? 'bg-green-100 text-green-800' :
                          transaction.type === 'EXPENSE' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    )}
                  </div>
                </td>

                {/* Account */}
                <td className="px-6 py-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: getAccountColor(transaction) }}
                    />
                    {getAccountName(transaction)}
                  </div>
                </td>

                {/* Amount */}
                <td className="px-6 py-3 text-sm text-right whitespace-nowrap">
                  {formatAmount(transaction.amount, transaction.type)}
                </td>

                {/* Actions */}
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(transaction)}
                      className="text-gray-700 hover:text-black transition-colors"
                      title="Edit transaction"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(transaction)}
                      className="text-gray-700 hover:text-black transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transactionToDelete?.description}" from ${transactionToDelete ? formatDateForDisplay(transactionToDelete.date.toString()) : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </>
  );
}
