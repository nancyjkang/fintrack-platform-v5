import { BaseService } from '../base'
import type { Category } from '@prisma/client'

export interface CreateCategoryData {
  name: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  color: string
}

export interface UpdateCategoryData {
  name?: string
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  color?: string
}

export interface CategoryFilters {
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  search?: string
}

export interface CategoryUsageStats {
  categoryId: number
  transactionCount: number
}

/**
 * Category service for managing transaction categories
 */
export class CategoryService extends BaseService {
  protected prisma = CategoryService.prisma

  /**
   * Get all categories for a tenant with optional filters
   */
  async getCategories(
    tenantId: string,
    filters?: CategoryFilters
  ): Promise<Category[]> {
    const whereClause: Record<string, unknown> = {
      tenant_id: tenantId
    }

    // Apply filters
    if (filters?.type) {
      whereClause.type = filters.type
    }

    if (filters?.search) {
      whereClause.name = {
        contains: filters.search,
        mode: 'insensitive'
      }
    }

    return this.prisma.category.findMany({
      where: whereClause,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(
    tenantId: string,
    categoryId: number
  ): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        id: categoryId,
        tenant_id: tenantId
      }
    })
  }

  /**
   * Create a new category
   */
  async createCategory(
    tenantId: string,
    data: CreateCategoryData
  ): Promise<Category> {
    // Validate category name is unique within tenant and type
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        tenant_id: tenantId,
        name: data.name,
        type: data.type
      }
    })

    if (existingCategory) {
      throw new Error(`A ${data.type.toLowerCase()} category named "${data.name}" already exists`)
    }

    return this.prisma.category.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        color: data.color,
        tenant_id: tenantId
      }
    })
  }

  /**
   * Update an existing category
   */
  async updateCategory(
    tenantId: string,
    categoryId: number,
    data: UpdateCategoryData
  ): Promise<Category> {
    // Verify category exists and belongs to tenant
    const existingCategory = await this.getCategoryById(tenantId, categoryId)
    if (!existingCategory) {
      throw new Error('Category not found')
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== existingCategory.name) {
      const duplicateCategory = await this.prisma.category.findFirst({
        where: {
          tenant_id: tenantId,
          name: data.name,
          type: data.type || existingCategory.type,
          id: { not: categoryId }
        }
      })

      if (duplicateCategory) {
        const categoryType = data.type || existingCategory.type
        throw new Error(`A ${categoryType.toLowerCase()} category named "${data.name}" already exists`)
      }
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.type && { type: data.type }),
        ...(data.color && { color: data.color })
      }
    })
  }

  /**
   * Delete a category (only if no transactions use it)
   */
  async deleteCategory(
    tenantId: string,
    categoryId: number
  ): Promise<void> {
    // Verify category exists and belongs to tenant
    const existingCategory = await this.getCategoryById(tenantId, categoryId)
    if (!existingCategory) {
      throw new Error('Category not found')
    }

    // Check if category is used by any transactions
    const transactionCount = await this.prisma.transaction.count({
      where: {
        category_id: categoryId,
        account: {
          tenant_id: tenantId
        }
      }
    })

    if (transactionCount > 0) {
      throw new Error(`Cannot delete category "${existingCategory.name}" because it is used by ${transactionCount} transaction(s)`)
    }

    await this.prisma.category.delete({
      where: { id: categoryId }
    })
  }

  /**
   * Get category usage statistics (transaction counts)
   */
  async getCategoryUsageStats(
    userId: string,
    tenantId: string,
    categoryIds?: number[]
  ): Promise<CategoryUsageStats[]> {
    const whereClause: Record<string, unknown> = {
      account: {
        tenant_id: tenantId
      }
    }

    if (categoryIds && categoryIds.length > 0) {
      whereClause.category_id = {
        in: categoryIds
      }
    }

    const results = await this.prisma.transaction.groupBy({
      by: ['category_id'],
      where: whereClause,
      _count: {
        id: true
      }
    })

    return results
      .filter(result => result.category_id !== null)
      .map(result => ({
        categoryId: result.category_id!,
        transactionCount: result._count.id
      }))
  }

  /**
   * Merge categories (move all transactions from source to target, then delete source)
   */
  async mergeCategories(
    tenantId: string,
    sourceCategoryId: number,
    targetCategoryId: number
  ): Promise<{
    success: boolean
    transactionsUpdated: number
    sourceCategoryDeleted: boolean
    error?: string
  }> {
    try {
      // Verify both categories exist and belong to tenant
      const [sourceCategory, targetCategory] = await Promise.all([
        this.getCategoryById(tenantId, sourceCategoryId),
        this.getCategoryById(tenantId, targetCategoryId)
      ])

      if (!sourceCategory) {
        throw new Error('Source category not found')
      }
      if (!targetCategory) {
        throw new Error('Target category not found')
      }

      // Verify categories are the same type
      if (sourceCategory.type !== targetCategory.type) {
        throw new Error(`Cannot merge ${sourceCategory.type.toLowerCase()} category into ${targetCategory.type.toLowerCase()} category`)
      }

      // Cannot merge category into itself
      if (sourceCategoryId === targetCategoryId) {
        throw new Error('Cannot merge a category into itself')
      }

      // Use transaction to ensure atomicity
      const result = await this.prisma.$transaction(async (tx) => {
        // Update all transactions to use target category
        const updateResult = await tx.transaction.updateMany({
          where: {
            category_id: sourceCategoryId,
            account: {
              tenant_id: tenantId
            }
          },
          data: {
            category_id: targetCategoryId
          }
        })

        // Delete source category
        await tx.category.delete({
          where: { id: sourceCategoryId }
        })

        return {
          success: true,
          transactionsUpdated: updateResult.count,
          sourceCategoryDeleted: true
        }
      })

      return result
    } catch (error) {
      return {
        success: false,
        transactionsUpdated: 0,
        sourceCategoryDeleted: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Create default categories for a new tenant
   */
  async createDefaultCategories(
    tenantId: string
  ): Promise<Category[]> {
    const defaultCategories = [
      // Income categories
      { name: 'Salary', type: 'INCOME' as const, color: '#10B981' },
      { name: 'Freelance', type: 'INCOME' as const, color: '#059669' },
      { name: 'Investment', type: 'INCOME' as const, color: '#047857' },
      { name: 'Other Income', type: 'INCOME' as const, color: '#065f46' },

      // Expense categories
      { name: 'Food & Dining', type: 'EXPENSE' as const, color: '#EF4444' },
      { name: 'Transportation', type: 'EXPENSE' as const, color: '#DC2626' },
      { name: 'Shopping', type: 'EXPENSE' as const, color: '#B91C1C' },
      { name: 'Entertainment', type: 'EXPENSE' as const, color: '#991B1B' },
      { name: 'Bills & Utilities', type: 'EXPENSE' as const, color: '#7F1D1D' },
      { name: 'Healthcare', type: 'EXPENSE' as const, color: '#EF4444' },
      { name: 'Education', type: 'EXPENSE' as const, color: '#DC2626' },
      { name: 'Other Expenses', type: 'EXPENSE' as const, color: '#B91C1C' },

      // Transfer categories
      { name: 'Account Transfer', type: 'TRANSFER' as const, color: '#8B5CF6' },
      { name: 'Savings', type: 'TRANSFER' as const, color: '#7C3AED' },
      { name: 'Investment Transfer', type: 'TRANSFER' as const, color: '#6D28D9' }
    ]

    const createdCategories: Category[] = []

    for (const categoryData of defaultCategories) {
      try {
        const category = await this.createCategory(tenantId, categoryData)
        createdCategories.push(category)
      } catch (error) {
        // Skip if category already exists
        console.warn(`Skipping default category "${categoryData.name}": ${error}`)
      }
    }

    return createdCategories
  }
}

// Export singleton instance
export const categoryService = new CategoryService()
