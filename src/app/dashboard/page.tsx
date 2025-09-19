'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client/api'
import SummaryCards from '@/components/ui/SummaryCards'

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
  latest_anchor_date?: string | null
  balance_date?: string
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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
          : (response.data as { items?: unknown[] }).items || response.data

        // Map API response to Dashboard interface
        const mappedAccounts = (accountsData as Array<Record<string, unknown>>).map((account) => ({
          ...account,
          current_balance: account.balance, // Map balance to current_balance
          subtype: account.type, // Map type to subtype for display
          currency: 'USD', // Default currency
          icon: 'building' // Default icon
        })) as Account[]

        setAccounts(mappedAccounts)
      } else {
        setError(response.error || 'Failed to load accounts')
      }
    } catch {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }


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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your financial position</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message mb-6">
          <p className="error-text">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <SummaryCards accounts={accounts} />
    </div>
  )
}
