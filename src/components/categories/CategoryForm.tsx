'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { api } from '@/lib/client/api'

interface Category {
  id: number
  name: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  color: string
  tenant_id: string
  created_at: string
  updated_at: string
}

interface CategoryFormProps {
  category?: Category | null
  defaultType?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  onSubmit: () => void
  onClose: () => void
}


export function CategoryForm({ category, defaultType, onSubmit, onClose }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: (defaultType || 'EXPENSE') as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    color: '#3B82F6'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!category

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color
      })
    } else {
      // Reset form for new category with default type
      setFormData({
        name: '',
        type: (defaultType || 'EXPENSE') as 'INCOME' | 'EXPENSE' | 'TRANSFER',
        color: '#3B82F6'
      })
    }
  }, [category, defaultType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (isEditing && category) {
        const response = await api.updateCategory(category.id, formData)
        if (!response.success) {
          throw new Error(response.error || 'Failed to update category')
        }
      } else {
        const response = await api.createCategory(formData)
        if (!response.success) {
          throw new Error(response.error || 'Failed to create category')
        }
      }

      onSubmit()
    } catch (err) {
      console.error('Error saving category:', err)
      setError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter category name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Category Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'INCOME', label: 'Income', color: 'text-green-700 bg-green-50 border-green-200' },
                  { key: 'EXPENSE', label: 'Expense', color: 'text-red-700 bg-red-50 border-red-200' },
                  { key: 'TRANSFER', label: 'Transfer', color: 'text-blue-700 bg-blue-50 border-blue-200' }
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleInputChange('type', option.key)}
                    className={`px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                      formData.type === option.key
                        ? option.color
                        : 'text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">Selected Color</div>
                  <div className="text-sm text-gray-500">{formData.color}</div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: formData.color }}
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {formData.name || 'Category Name'}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {formData.type.toLowerCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Category' : 'Create Category')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
