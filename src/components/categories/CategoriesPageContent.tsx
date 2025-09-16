'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { api } from '@/lib/client/api'
import { CategoriesList } from './CategoriesList'
import { CategoryForm } from './CategoryForm'
import { CategoryMergeModal } from './CategoryMergeModal'

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

interface Filters {
  type: 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'
}

export function CategoriesPageContent() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [mergingCategory, setMergingCategory] = useState<Category | null>(null)
  const [filters, setFilters] = useState<Filters>({
    type: 'ALL'
  })

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch categories and usage stats in parallel
      const [categoriesResponse, usageResponse] = await Promise.all([
        api.getCategories(),
        api.getCategoryUsageStats()
      ])

      if (categoriesResponse.success && categoriesResponse.data?.categories) {
        const categories = categoriesResponse.data.categories as Category[]

        // Add transaction counts to categories
        if (usageResponse.success && usageResponse.data?.usageStats) {
          const usageMap = new Map(
            usageResponse.data.usageStats.map(stat => [stat.categoryId, stat.transactionCount])
          )

          categories.forEach(category => {
            category.transactionCount = usageMap.get(category.id) || 0
          })
        }

        setCategories(categories)
      } else {
        setError('Failed to fetch categories')
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Filter categories by type
  useEffect(() => {
    let filtered = categories

    // Filter by type
    if (filters.type !== 'ALL') {
      filtered = filtered.filter(category => category.type === filters.type)
    }

    setFilteredCategories(filtered)
  }, [categories, filters])

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setShowForm(true)
  }

  // Get default type for new categories based on current filter
  const getDefaultType = (): 'INCOME' | 'EXPENSE' | 'TRANSFER' => {
    if (filters.type === 'ALL') {
      return 'EXPENSE' // Default to EXPENSE when on "All Categories"
    }
    return filters.type as 'INCOME' | 'EXPENSE' | 'TRANSFER'
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCategory(null)
  }

  const handleCategorySubmit = async () => {
    await fetchCategories()
    handleCloseForm()
  }

  const handleDeleteCategory = async () => {
    await fetchCategories()
  }

  const handleMergeCategory = (category: Category) => {
    setMergingCategory(category)
    setShowMergeModal(true)
  }

  const handleCloseMergeModal = () => {
    setShowMergeModal(false)
    setMergingCategory(null)
  }

  const handleMergeSubmit = async () => {
    await fetchCategories()
    handleCloseMergeModal()
  }

  // Count categories by type
  const categoryCounts = {
    INCOME: categories.filter(c => c.type === 'INCOME').length,
    EXPENSE: categories.filter(c => c.type === 'EXPENSE').length,
    TRANSFER: categories.filter(c => c.type === 'TRANSFER').length
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchCategories}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Categories</h1>
          <p className="text-gray-600">
            Manage your income, expense, and transfer categories
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
        {[
          { key: 'ALL', label: 'All Categories', count: categories.length },
          { key: 'INCOME', label: 'Income', count: categoryCounts.INCOME },
          { key: 'EXPENSE', label: 'Expenses', count: categoryCounts.EXPENSE },
          { key: 'TRANSFER', label: 'Transfers', count: categoryCounts.TRANSFER }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange({ type: tab.key as Filters['type'] })}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${
              filters.type === tab.key
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Categories List */}
      <CategoriesList
        categories={filteredCategories}
        onEdit={handleEditCategory}
        onMerge={handleMergeCategory}
        onDelete={handleDeleteCategory}
        loading={loading}
      />

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          defaultType={!editingCategory ? getDefaultType() : undefined}
          onSubmit={handleCategorySubmit}
          onClose={handleCloseForm}
        />
      )}

      {/* Category Merge Modal */}
      {showMergeModal && mergingCategory && (
        <CategoryMergeModal
          sourceCategory={mergingCategory}
          categories={categories}
          onSubmit={handleMergeSubmit}
          onClose={handleCloseMergeModal}
        />
      )}
    </div>
  )
}
