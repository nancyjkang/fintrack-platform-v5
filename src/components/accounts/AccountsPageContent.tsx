'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calculator, Building2, Wallet, CreditCard, TrendingUp, DollarSign, PiggyBank, Building } from 'lucide-react'
import { api } from '@/lib/client/api'
import { AccountForm } from './AccountForm'
import ReconcileAccountModal, { ReconcileFormData } from './ReconcileAccountModal'
import { formatDateForDisplay } from '@/lib/utils/date-utils'

interface Account {
  id: number
  name: string
  type: string
  net_worth_category: string
  balance: number
  balance_date: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
  latest_anchor_date?: string | null
}

export function AccountsPageContent() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'active' | 'inactive'>('active')
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [showReconcileModal, setShowReconcileModal] = useState(false)
  const [reconcilingAccount, setReconcilingAccount] = useState<Account | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      const response = await api.getAccounts()
      if (response.success && response.data) {
        // Handle both array format and paginated format
        const accountsData = Array.isArray(response.data)
          ? response.data
          : (response.data as { items?: unknown[] }).items || response.data
        setAccounts(accountsData as Account[])
      } else {
        throw new Error(response.error || 'Failed to fetch accounts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts')
    }
  }

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchAccounts()
      setIsLoading(false)
    }

    loadData()
  }, [])

  // Handle form submission
  const handleFormSubmit = async () => {
    await fetchAccounts()
    setShowForm(false)
    setEditingAccount(null)
  }

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false)
    setEditingAccount(null)
  }

  // Handle add account
  const handleAddAccount = () => {
    setEditingAccount(null)
    setShowForm(true)
  }

  // Handle edit account
  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setShowForm(true)
  }

  // Handle delete account
  const handleDeleteAccount = async (accountId: number) => {
    const account = accounts.find(acc => acc.id === accountId)
    if (!account) return

    let confirmMessage: string
    if (account.is_active) {
      confirmMessage = 'Are you sure you want to inactivate this account? The account will be hidden and its transactions will not appear in reports, but the data will be preserved.'
    } else {
      confirmMessage = 'Are you sure you want to permanently delete this account? This will also permanently delete all associated transactions and cannot be undone.'
    }

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      if (account.is_active) {
        // For active accounts, always set to inactive (don't actually delete)
        const updateResponse = await api.updateAccount(accountId, { is_active: false })
        if (!updateResponse.success) {
          throw new Error(updateResponse.error || 'Failed to inactivate account')
        }
      } else {
        // For inactive accounts, try to permanently delete
        const response = await api.deleteAccount(accountId)
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete account')
        }
      }

      await fetchAccounts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete account')
    }
  }

  // Handle reconcile account
  const handleReconcileAccount = (account: Account) => {
    setReconcilingAccount(account)
    setShowReconcileModal(true)
    setError(null)
    setSuccessMessage(null)
  }

  // Handle reconcile submission
  const handleReconcileSubmit = async (accountId: number, data: ReconcileFormData) => {
    try {
      const response = await api.reconcileAccount(accountId, data)

      if (response.success) {
        setSuccessMessage(response.data.message)
        // Refresh accounts to show updated balance
        await fetchAccounts()
        setShowReconcileModal(false)
        setReconcilingAccount(null)

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        throw new Error(response.error || 'Failed to reconcile account')
      }
    } catch (err) {
      console.error('Reconcile error:', err)
      throw err // Re-throw to let modal handle the error display
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Get account type icon and color
  const getAccountTypeInfo = (type: string) => {
    const typeMap = {
      'CHECKING': { icon: Building2, color: '#3B82F6', label: 'Checking' },
      'SAVINGS': { icon: PiggyBank, color: '#10B981', label: 'Savings' },
      'CREDIT_CARD': { icon: CreditCard, color: '#F59E0B', label: 'Credit Card' },
      'INVESTMENT': { icon: TrendingUp, color: '#8B5CF6', label: 'Investment' },
      'LOAN': { icon: DollarSign, color: '#EF4444', label: 'Loan' },
      'TRADITIONAL_RETIREMENT': { icon: Wallet, color: '#6366F1', label: 'Traditional Retirement' },
      'ROTH_RETIREMENT': { icon: Wallet, color: '#EC4899', label: 'Roth Retirement' }
    }
    return typeMap[type as keyof typeof typeMap] || { icon: Building, color: '#6B7280', label: type }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Filter accounts
  const filteredAccounts = accounts.filter(account =>
    filter === 'active' ? account.is_active : !account.is_active
  )

  const activeCount = accounts.filter(account => account.is_active).length
  const inactiveCount = accounts.filter(account => !account.is_active).length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Header - matching v4.1 */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account List</h1>
            <p className="mt-2 text-gray-600">
              Manage your financial accounts
            </p>
          </div>

          <button
            onClick={handleAddAccount}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Account
          </button>
        </div>

        {/* Filter tabs - matching v4.1 */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 text-base font-medium border-b-2 transition-colors ${
                filter === 'active'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setFilter('active')}
            >
              Active ({activeCount})
            </button>
            <button
              className={`px-4 py-2 text-base font-medium border-b-2 transition-colors ${
                filter === 'inactive'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setFilter('inactive')}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
        </div>

        {/* Account cards grid - matching v4.1 */}
        {filteredAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map(account => {
              const typeInfo = getAccountTypeInfo(account.type)
              return (
                <div
                  key={account.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 transition-all duration-200 hover:border-blue-500 hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: account.color || typeInfo.color }}
                      >
                        <typeInfo.icon className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{account.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-medium">{typeInfo.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReconcileAccount(account)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Reconcile Account"
                      >
                        <Calculator size={16} />
                      </button>
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit Account"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end items-center">
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</div>
                      <div className={`text-lg font-semibold ${account.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(account.balance)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {account.latest_anchor_date
                          ? `as of ${formatDateForDisplay(account.latest_anchor_date)}`
                          : `as of ${formatDateForDisplay(account.balance_date)}`}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building className="text-gray-400 w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {filter} accounts found</h3>
            <p className="text-gray-500">Get started by adding your first account using the button above.</p>
          </div>
        )}

        {/* Account Form Modal */}
        {showForm && (
          <AccountForm
            account={editingAccount}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {/* Reconcile Account Modal */}
        <ReconcileAccountModal
          account={reconcilingAccount}
          isOpen={showReconcileModal}
          onClose={() => {
            setShowReconcileModal(false)
            setReconcilingAccount(null)
          }}
          onReconcile={handleReconcileSubmit}
        />
      </div>
    </div>
  )
}
