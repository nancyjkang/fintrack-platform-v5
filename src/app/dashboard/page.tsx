'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client/api'
import { Plus, Building, Search, Filter } from 'lucide-react'
import AccountCard from '@/components/ui/AccountCard'
import SummaryCards from '@/components/ui/SummaryCards'
import EmptyState from '@/components/ui/EmptyState'

interface Account {
  id: string
  name: string
  type: string
  subtype: string
  current_balance: number
  currency: string
  account_number_last4?: string
  institution_name?: string
  color: string
  icon: string
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await api.getAccounts()

      if (response.success && response.data) {
        // Handle both array format and paginated format
        const accountsData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).items || response.data
        setAccounts(accountsData as any)
      } else {
        setError(response.error || 'Failed to load accounts')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAccount = () => {
    // TODO: Open add account modal
    console.log('Add account clicked')
  }

  const handleEditAccount = (accountId: string) => {
    // TODO: Open edit account modal
    console.log('Edit account:', accountId)
  }

  const handleDeleteAccount = (accountId: string) => {
    // TODO: Open delete confirmation
    console.log('Delete account:', accountId)
  }

  // Filter accounts based on search and type
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.institution_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || account.type === filterType
    return matchesSearch && matchesType
  })

  // Get unique account types for filter
  const accountTypes = ['all', ...new Set(accounts.map(a => a.type))]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
          <p className="text-gray-600">
            {accounts.length === 0
              ? 'Manage your financial accounts'
              : `${accounts.length} account${accounts.length !== 1 ? 's' : ''} total`
            }
          </p>
        </div>
        <button
          onClick={handleAddAccount}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message mb-6">
          <p className="error-text">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <SummaryCards accounts={accounts} />

      {/* Search and Filter */}
      {accounts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select-field pl-10 pr-8 min-w-32"
            >
              {accountTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Accounts Grid or Empty State */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No accounts yet"
          description="Get started by adding your first financial account to track your money and transactions."
          action={{
            label: "Add Your First Account",
            onClick: handleAddAccount
          }}
        />
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEditAccount}
              onDelete={handleDeleteAccount}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {accounts.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="card-body text-center py-4">
              <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
              <p className="text-sm text-gray-500">Total Accounts</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center py-4">
              <p className="text-2xl font-bold text-green-600">
                {accounts.filter(a => a.current_balance > 0).length}
              </p>
              <p className="text-sm text-gray-500">Positive Balance</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center py-4">
              <p className="text-2xl font-bold text-red-600">
                {accounts.filter(a => a.current_balance < 0).length}
              </p>
              <p className="text-sm text-gray-500">Negative Balance</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center py-4">
              <p className="text-2xl font-bold text-blue-600">
                {new Set(accounts.map(a => a.type)).size}
              </p>
              <p className="text-sm text-gray-500">Account Types</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
