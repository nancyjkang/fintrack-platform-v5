'use client'

import { useState, useEffect } from 'react'
import { X, Save, Building } from 'lucide-react'
import { api } from '@/lib/client/api'
import { getCurrentDate } from '@/lib/utils/date-utils'

interface Account {
  id: number
  name: string
  type: string
  net_worth_category: string
  balance: number
  balance_date: string
  color: string
  is_active: boolean
}

interface AccountFormProps {
  account?: Account | null
  onSubmit: () => void
  onCancel: () => void
}

const ACCOUNT_TYPES = [
  { value: 'CHECKING', label: 'Checking Account' },
  { value: 'SAVINGS', label: 'Savings Account' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'INVESTMENT', label: 'Investment Account' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'TRADITIONAL_RETIREMENT', label: 'Traditional Retirement (401k, IRA)' },
  { value: 'ROTH_RETIREMENT', label: 'Roth Retirement (Roth IRA, Roth 401k)' }
]

const NET_WORTH_CATEGORIES = [
  { value: 'ASSET', label: 'Asset (increases net worth)' },
  { value: 'LIABILITY', label: 'Liability (decreases net worth)' },
  { value: 'EXCLUDED', label: 'Excluded (not counted in net worth)' }
]


export function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECKING',
    net_worth_category: 'ASSET',
    balance: 0,
    balance_date: getCurrentDate(),
    color: '#3B82F6', // Default blue color
    is_active: true
  })

  // Initialize form with account data if editing
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        net_worth_category: account.net_worth_category,
        balance: account.balance,
        balance_date: account.balance_date.split('T')[0],
        color: account.color,
        is_active: account.is_active
      })
    }
  }, [account])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let response
      if (account) {
        // For updates, only send editable fields (not balance/balance_date)
        const updateData = {
          name: formData.name,
          type: formData.type as 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN' | 'TRADITIONAL_RETIREMENT' | 'ROTH_RETIREMENT',
          net_worth_category: formData.net_worth_category as 'ASSET' | 'LIABILITY' | 'EXCLUDED',
          color: formData.color,
          is_active: formData.is_active
        }
        response = await api.updateAccount(account.id, updateData)
      } else {
        // For new accounts, send all fields
        response = await api.createAccount({
          name: formData.name,
          type: formData.type as 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN' | 'TRADITIONAL_RETIREMENT' | 'ROTH_RETIREMENT',
          net_worth_category: formData.net_worth_category as 'ASSET' | 'LIABILITY' | 'EXCLUDED',
          balance: formData.balance,
          balance_date: formData.balance_date,
          color: formData.color,
          is_active: formData.is_active
        })
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to save account')
      }

      onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input changes
  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Auto-suggest net worth category based on account type
  const handleTypeChange = (type: string) => {
    handleChange('type', type)

    // Auto-suggest net worth category
    if (['CREDIT_CARD', 'LOAN'].includes(type)) {
      handleChange('net_worth_category', 'LIABILITY')
    } else {
      handleChange('net_worth_category', 'ASSET')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {account ? 'Edit Account' : 'Add New Account'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Chase Checking, Savings Account"
              required
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {ACCOUNT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Net Worth Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Net Worth Impact *
            </label>
            <select
              value={formData.net_worth_category}
              onChange={(e) => handleChange('net_worth_category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {NET_WORTH_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Assets increase your net worth, liabilities decrease it, excluded accounts are not counted.
            </p>
          </div>

          {/* Current Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Balance *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => handleChange('balance', parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              For credit cards and loans, enter the amount owed as a positive number.
            </p>
          </div>

          {/* Balance Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Balance Date *
            </label>
            <input
              type="date"
              value={formData.balance_date}
              onChange={(e) => handleChange('balance_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Account is active
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? 'Saving...' : (account ? 'Update Account' : 'Create Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
