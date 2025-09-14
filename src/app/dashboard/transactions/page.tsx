'use client'

import { ArrowLeftRight, Plus, Search, Filter } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

export default function TransactionsPage() {
  const handleAddTransaction = () => {
    console.log('Add transaction clicked')
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Track your income, expenses, and transfers</p>
        </div>
        <button
          onClick={handleAddTransaction}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      {/* Empty State */}
      <EmptyState
        icon={ArrowLeftRight}
        title="No transactions yet"
        description="Start tracking your financial activity by adding your first transaction."
        actionLabel="Add Your First Transaction"
        onAction={handleAddTransaction}
      />
    </div>
  )
}
