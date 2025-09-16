'use client'

import { useState } from 'react'
import { Edit2, Trash2, DollarSign, TrendingUp, ArrowRightLeft, Merge } from 'lucide-react'
import { api } from '@/lib/client/api'
import ConfirmDialog from '@/components/common/ConfirmDialog'

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

interface CategoriesListProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: () => void
  onMerge: (category: Category) => void
  loading: boolean
}

export function CategoriesList({ categories, onEdit, onDelete, onMerge, loading }: CategoriesListProps) {
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'EXPENSE':
        return <DollarSign className="w-5 h-5 text-red-600" />
      case 'TRANSFER':
        return <ArrowRightLeft className="w-5 h-5 text-blue-600" />
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />
    }
  }


  const handleDeleteClick = (category: Category) => {
    // Prevent deletion if category has transactions
    if (category.transactionCount && category.transactionCount > 0) {
      return
    }

    setDeletingCategory(category)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return

    try {
      setDeleteLoading(true)
      const response = await api.deleteCategory(deletingCategory.id)

      if (response.success) {
        onDelete()
        setShowDeleteDialog(false)
        setDeletingCategory(null)
      } else {
        console.error('Failed to delete category:', response.error)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      // TODO: Show error toast
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setDeletingCategory(null)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
        <p className="text-gray-500 mb-4">
          Create your first category to start organizing your transactions.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Color indicator and icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    {getTypeIcon(category.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {category.transactionCount === 1
                        ? '1 transaction'
                        : `${category.transactionCount || 0} transactions`}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(category)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onMerge(category)}
                    disabled={!category.transactionCount || category.transactionCount === 0}
                    className={`p-2 rounded transition-colors ${
                      !category.transactionCount || category.transactionCount === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                    title={
                      !category.transactionCount || category.transactionCount === 0
                        ? 'Cannot merge category with no transactions'
                        : `Merge category with ${category.transactionCount} transaction${category.transactionCount === 1 ? '' : 's'}`
                    }
                  >
                    <Merge className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(category)}
                    disabled={category.transactionCount && category.transactionCount > 0}
                    className={`p-2 rounded transition-colors ${
                      category.transactionCount && category.transactionCount > 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title={
                      category.transactionCount && category.transactionCount > 0
                        ? `Cannot delete category with ${category.transactionCount} transaction${category.transactionCount === 1 ? '' : 's'}`
                        : 'Delete category'
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Category"
        message={`Are you sure you want to delete "${deletingCategory?.name}"? This action cannot be undone.${
          deletingCategory?.transactionCount === 0
            ? ' This category has no transactions.'
            : ''
        }`}
        confirmText={deleteLoading ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </>
  )
}
