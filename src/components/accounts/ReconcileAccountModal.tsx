'use client'

import { useState, useEffect } from 'react'
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
import { formatCurrency } from '@/lib/utils/currency'
import { toUTCDateString, getCurrentDate } from '@/lib/utils/date-utils'

interface ReconcileAccountModalProps {
  account: Account | null
  isOpen: boolean
  onClose: () => void
  onReconcile: (accountId: number, data: ReconcileFormData) => Promise<void>
}

export interface ReconcileFormData {
  newBalance: number
  reconcileDate: string
}

export default function ReconcileAccountModal({
  account,
  isOpen,
  onClose,
  onReconcile
}: ReconcileAccountModalProps) {
  const [formData, setFormData] = useState<ReconcileFormData>({
    newBalance: 0,
    reconcileDate: getCurrentDate()
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens/closes or account changes
  useEffect(() => {
    if (isOpen && account) {
      setFormData({
        newBalance: Number(account.balance) || 0,
        reconcileDate: getCurrentDate()
      })
      setError(null)
    }
  }, [isOpen, account])

  if (!isOpen || !account) return null

  const currentBalance = Number(account.balance) || 0
  const difference = formData.newBalance - currentBalance
  const needsAdjustment = Math.abs(difference) > 0.01

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onReconcile(account.id, formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reconcile account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof ReconcileFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Reconcile Account
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {account.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Current Balance (Read-only) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Calculated Balance
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
              {formatCurrency(currentBalance)}
              {account.latest_anchor_date && (
                <span className="text-xs text-gray-500 ml-2">
                  (as of {account.latest_anchor_date})
                </span>
              )}
            </div>
          </div>

          {/* New Balance */}
          <div className="mb-4">
            <label htmlFor="newBalance" className="block text-sm font-medium text-gray-700 mb-2">
              Actual Balance <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="newBalance"
              step="0.01"
              value={formData.newBalance}
              onChange={(e) => handleInputChange('newBalance', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter actual balance"
              required
            />
          </div>

          {/* Reconciliation Date */}
          <div className="mb-4">
            <label htmlFor="reconcileDate" className="block text-sm font-medium text-gray-700 mb-2">
              Reconciliation Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="reconcileDate"
              value={formData.reconcileDate}
              onChange={(e) => handleInputChange('reconcileDate', e.target.value)}
              max={getCurrentDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Adjustment Preview */}
          {needsAdjustment && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Adjustment needed:</strong> {formatCurrency(Math.abs(difference))}
                <span className="ml-1">
                  ({difference > 0 ? 'increase' : 'decrease'})
                </span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                A system transfer adjustment will be created to reconcile the difference.
              </p>
            </div>
          )}


          {/* No Adjustment Message */}
          {!needsAdjustment && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ No adjustment needed - balances match!
              </p>
              <p className="text-xs text-green-600 mt-1">
                A balance anchor will be created to mark this reconciliation point.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Reconciling...' : 'Reconcile Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
