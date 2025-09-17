'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Building, Tag, FileText, RotateCcw } from 'lucide-react';
import { getCurrentDate, isValidDateString, parseAndConvertToUTC } from '@/lib/utils/date-utils';
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
}

interface Account {
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

interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface TransactionFormProps {
  editingTransaction?: Transaction | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function TransactionForm({ editingTransaction, onSave, onCancel }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    account_id: '',
    to_account_id: '', // For transfers
    amount: '',
    description: '',
    category_id: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    date: getCurrentDate(),
    is_recurring: false
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch accounts and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsResponse, categoriesResponse] = await Promise.all([
          api.getAccounts({ is_active: true }),
          api.getCategories()
        ]);

        if (accountsResponse.success && accountsResponse.data) {
          setAccounts(accountsResponse.data);
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update form data when editingTransaction changes (v4.1 pattern)
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        account_id: editingTransaction.account_id?.toString() || '',
        to_account_id: '', // Transfers will need special handling
        amount: editingTransaction.amount?.toString() || '',
        description: editingTransaction.description || '',
        category_id: editingTransaction.category_id?.toString() || '',
        type: editingTransaction.type || 'EXPENSE',
        date: editingTransaction.date ? editingTransaction.date.split('T')[0] : getCurrentDate(),
        is_recurring: editingTransaction.is_recurring || false
      });
    } else {
      // Reset form for new transaction
      setFormData({
        account_id: '',
        to_account_id: '',
        amount: '',
        description: '',
        category_id: '',
        type: 'EXPENSE',
        date: getCurrentDate(),
        is_recurring: false
      });
    }
  }, [editingTransaction]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleTypeChange = (newType: 'INCOME' | 'EXPENSE' | 'TRANSFER') => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      // Clear category for transfers as they typically don't have categories
      category_id: newType === 'TRANSFER' ? '' : prev.category_id
    }));
  };

  const validateForm = () => {
    if (!formData.account_id) {
      setError('Please select an account');
      return false;
    }

    if (formData.type === 'TRANSFER' && !formData.to_account_id) {
      setError('Please select a destination account for the transfer');
      return false;
    }

    if (formData.type === 'TRANSFER' && formData.account_id === formData.to_account_id) {
      setError('Source and destination accounts must be different');
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Please enter a description');
      return false;
    }

    if (!isValidDateString(formData.date)) {
      setError('Please enter a valid date');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const transactionData = {
        account_id: parseInt(formData.account_id),
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        type: formData.type,
        date: parseAndConvertToUTC(formData.date),
        is_recurring: formData.is_recurring
      };

      const response = editingTransaction
        ? await api.updateTransaction(editingTransaction.id, transactionData)
        : await api.createTransaction(transactionData);

      if (response.success) {
        onSave();
      } else {
        throw new Error(response.error || 'Failed to save transaction');
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(category => {
    if (formData.type === 'TRANSFER') return false; // No categories for transfers
    if (formData.type === 'INCOME') return category.type === 'INCOME';
    if (formData.type === 'EXPENSE') return category.type === 'EXPENSE';
    return true;
  });

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading form...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onCancel} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto">
          {/* Header - v4.1 layout */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form - v4.1 structure with v5 styling */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Description - First field in v4.1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter transaction description"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Amount and Date - Side by side in v4.1 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="0.00"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Transaction Type - v4.1 pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['INCOME', 'EXPENSE', 'TRANSFER'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                      formData.type === type
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={isSubmitting}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'TRANSFER' ? 'From Account' : 'Account'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={formData.account_id}
                  onChange={(e) => handleInputChange('account_id', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id.toString()}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

              {/* To Account (for transfers) */}
            {formData.type === 'TRANSFER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Account <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={formData.to_account_id}
                    onChange={(e) => handleInputChange('to_account_id', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select destination account</option>
                    {accounts
                      .filter(account => account.id.toString() !== formData.account_id)
                      .map(account => (
                        <option key={account.id} value={account.id.toString()}>
                          {account.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Category (not for transfers) */}
            {formData.type !== 'TRANSFER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                    disabled={isSubmitting}
                  >
                    <option value="">Select category</option>
                    {filteredCategories.map(category => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Recurring checkbox - v4.1 label */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={isSubmitting}
              />
              <label htmlFor="is_recurring" className="ml-2 text-sm text-gray-700 flex items-center">
                <RotateCcw className="w-4 h-4 mr-1" />
                Recurring
              </label>
            </div>

            {/* Actions - v4.1 layout */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (editingTransaction ? 'Updating...' : 'Adding...')
                  : (editingTransaction ? 'Update Transaction' : 'Add Transaction')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
