'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/client/api'

interface Category {
  id: number
  name: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  color: string
  tenant_id: string
  created_at: string
  updated_at: string
  transactionCount?: number
}

interface CategoryMergeModalProps {
  sourceCategory: Category
  categories: Category[]
  onSubmit: () => void
  onClose: () => void
}

export function CategoryMergeModal({ sourceCategory, categories, onSubmit, onClose }: CategoryMergeModalProps) {
  const [targetCategoryId, setTargetCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Filter categories to only show same type (excluding source category)
  const availableTargets = categories.filter(
    cat => cat.type === sourceCategory.type && cat.id !== sourceCategory.id
  )

  const selectedTarget = availableTargets.find(cat => cat.id === targetCategoryId)

  const handleMerge = async () => {
    if (!targetCategoryId) return

    try {
      setLoading(true)
      setResult(null)

      const response = await api.mergeCategories(sourceCategory.id, targetCategoryId)

      if (response.success) {
        setResult({
          success: true,
          message: `Successfully merged "${sourceCategory.name}" into "${selectedTarget?.name}". ${response.data?.transactionsUpdated || 0} transactions were moved.`
        })

        // Auto-close after 2 seconds and refresh
        setTimeout(() => {
          onSubmit()
        }, 2000)
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to merge categories'
        })
      }
    } catch (error) {
      console.error('Error merging categories:', error)
      setResult({
        success: false,
        message: 'An error occurred while merging categories'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Merge Categories
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">What will happen:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• All {sourceCategory.transactionCount || 0} transactions from "{sourceCategory.name}" will be moved to the target category</li>
                  <li>• The "{sourceCategory.name}" category will be permanently deleted</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Source Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Category (will be deleted)
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: sourceCategory.color }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{sourceCategory.name}</div>
                    <div className="text-sm text-gray-500">
                      {sourceCategory.transactionCount || 0} transactions
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Category (will receive transactions)
              </label>
              <select
                value={targetCategoryId || ''}
                onChange={(e) => setTargetCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">Select target category...</option>
                {availableTargets.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.transactionCount || 0} transactions)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview Section */}
          {selectedTarget && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Preview:</h3>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-lg mx-auto mb-2"
                    style={{ backgroundColor: sourceCategory.color }}
                  />
                  <div className="font-medium text-gray-900">{sourceCategory.name}</div>
                  <div className="text-sm text-gray-500">{sourceCategory.transactionCount || 0} transactions</div>
                </div>

                <ArrowRight className="w-6 h-6 text-gray-400" />

                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-lg mx-auto mb-2"
                    style={{ backgroundColor: selectedTarget.color }}
                  />
                  <div className="font-medium text-gray-900">{selectedTarget.name}</div>
                  <div className="text-sm text-gray-500">
                    {(selectedTarget.transactionCount || 0) + (sourceCategory.transactionCount || 0)} transactions (after merge)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result Section */}
          {result && (
            <div className={`border rounded-lg p-4 mb-6 ${
              result.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </div>
              </div>
            </div>
          )}

          {/* No available targets message */}
          {availableTargets.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  No other {sourceCategory.type.toLowerCase()} categories available for merging.
                  You need at least one other category of the same type to perform a merge.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={!targetCategoryId || loading || availableTargets.length === 0 || result?.success}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Merging...' : 'Merge Categories'}
          </button>
        </div>
      </div>
    </div>
  )
}
