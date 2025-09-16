'use client'

import { useState } from 'react'
import { Building, Edit, Trash2, MoreHorizontal, Eye, EyeOff } from 'lucide-react'
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
}

interface AccountsListProps {
  accounts: Account[]
  onEdit: (account: Account) => void
  onDelete: (accountId: number) => void
}

export function AccountsList({ accounts, onEdit, onDelete }: AccountsListProps) {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Format date - use date utils instead of direct Date usage
  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString)
  }

  // Get account type badge color
  const getAccountTypeBadge = (type: string) => {
    const colors = {
      'CHECKING': 'bg-blue-100 text-blue-800',
      'SAVINGS': 'bg-green-100 text-green-800',
      'CREDIT_CARD': 'bg-red-100 text-red-800',
      'INVESTMENT': 'bg-purple-100 text-purple-800',
      'LOAN': 'bg-orange-100 text-orange-800',
      'TRADITIONAL_RETIREMENT': 'bg-indigo-100 text-indigo-800',
      'ROTH_RETIREMENT': 'bg-pink-100 text-pink-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Get net worth category badge
  const getNetWorthBadge = (category: string) => {
    const colors = {
      'ASSET': 'bg-green-100 text-green-800',
      'LIABILITY': 'bg-red-100 text-red-800',
      'EXCLUDED': 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Toggle dropdown
  const toggleDropdown = (accountId: number) => {
    setActiveDropdown(activeDropdown === accountId ? null : accountId)
  }

  // Close dropdown when clicking outside
  const closeDropdown = () => {
    setActiveDropdown(null)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Your Accounts</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: account.color + '20' }}
                  >
                    <Building
                      className="h-5 w-5"
                      style={{ color: account.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      {account.name}
                      {!account.is_active && (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getAccountTypeBadge(account.type)}`}>
                        {account.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Menu */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(account.id)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {activeDropdown === account.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={closeDropdown}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              onEdit(account)
                              closeDropdown()
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Account
                          </button>
                          <button
                            onClick={() => {
                              onDelete(account.id)
                              closeDropdown()
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Balance */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Current Balance</p>
                <p className={`text-xl font-semibold ${
                  account.balance >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}>
                  {formatCurrency(account.balance)}
                </p>
                <p className="text-xs text-gray-500">
                  as of {formatDate(account.balance_date)}
                </p>
              </div>

              {/* Net Worth Category */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Net Worth Impact</p>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getNetWorthBadge(account.net_worth_category)}`}>
                    {account.net_worth_category}
                  </span>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-1">
                  {account.is_active ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Eye className="h-4 w-4" />
                      <span className="text-xs font-medium">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400">
                      <EyeOff className="h-4 w-4" />
                      <span className="text-xs font-medium">Inactive</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
