import { BaseService } from './base.service'
import type { Category } from '@prisma/client'

export interface CreateCategoryData {
  name: string
  type: string // INCOME, EXPENSE, TRANSFER
  color: string
}

export interface UpdateCategoryData {
  name?: string
  type?: string
  color?: string
}

export interface CategoryFilters {
  type?: string
  search?: string
}

/**
 * Category service for managing transaction categories
 */
export class CategoryService extends BaseService {

  /**
   * Get all categories for a tenant with optional filters
   */
  static async getCategories(
    tenantId: string,
    filters?: CategoryFilters
  ): Promise<Category[]> {
    try {
      this.validateTenantId(tenantId)

      const where: any = {
        tenant_id: tenantId
      }

      // Apply filters
      if (filters) {
        if (filters.type) where.type = filters.type

        if (filters.search) {
          where.name = {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      }

      const categories = await this.prisma.category.findMany({
        where,
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ]
      })

      return categories
    } catch (error) {
      return this.handleError(error, 'CategoryService.getCategories')
    }
  }

  /**
   * Get a single category by ID (with tenant validation)
   */
  static async getCategoryById(
    id: number,
    tenantId: string
  ): Promise<Category | null> {
    try {
      this.validateTenantId(tenantId)

      const category = await this.prisma.category.findFirst({
        where: {
          id,
          tenant_id: tenantId
        }
      })

      return category
    } catch (error) {
      return this.handleError(error, 'CategoryService.getCategoryById')
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(
    tenantId: string,
    data: CreateCategoryData
  ): Promise<Category> {
    try {
      this.validateTenantId(tenantId)

      // Check for duplicate category name and type within tenant
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          tenant_id: tenantId,
          name: data.name,
          type: data.type
        }
      })

      if (existingCategory) {
        throw new Error('Category with this name and type already exists')
      }

      const category = await this.prisma.category.create({
        data: {
          tenant_id: tenantId,
          name: data.name,
          type: data.type,
          color: data.color
        }
      })

      return category
    } catch (error) {
      return this.handleError(error, 'CategoryService.createCategory')
    }
  }

  /**
   * Update a category
   */
  static async updateCategory(
    id: number,
    tenantId: string,
    data: UpdateCategoryData
  ): Promise<Category> {
    try {
      this.validateTenantId(tenantId)

      // Check if category exists and belongs to tenant
      const existingCategory = await this.getCategoryById(id, tenantId)
      if (!existingCategory) {
        throw new Error('Category not found or does not belong to tenant')
      }

      // Check for duplicate name and type if either is being updated
      const newName = data.name || existingCategory.name
      const newType = data.type || existingCategory.type

      if ((data.name && data.name !== existingCategory.name) ||
          (data.type && data.type !== existingCategory.type)) {
        const duplicateCategory = await this.prisma.category.findFirst({
          where: {
            tenant_id: tenantId,
            name: newName,
            type: newType,
            id: { not: id } // Exclude current category
          }
        })

        if (duplicateCategory) {
          throw new Error('Category with this name and type already exists')
        }
      }

      const category = await this.prisma.category.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date()
        }
      })

      return category
    } catch (error) {
      return this.handleError(error, 'CategoryService.updateCategory')
    }
  }

  /**
   * Delete a category
   */
  static async deleteCategory(id: number, tenantId: string): Promise<void> {
    try {
      this.validateTenantId(tenantId)

      // Check if category exists and belongs to tenant
      const existingCategory = await this.getCategoryById(id, tenantId)
      if (!existingCategory) {
        throw new Error('Category not found or does not belong to tenant')
      }

      // Check if category has transactions
      const transactionCount = await this.prisma.transaction.count({
        where: {
          category_id: id,
          tenant_id: tenantId
        }
      })

      if (transactionCount > 0) {
        throw new Error('Cannot delete category with existing transactions')
      }

      await this.prisma.category.delete({
        where: { id }
      })
    } catch (error) {
      return this.handleError(error, 'CategoryService.deleteCategory')
    }
  }

  /**
   * Get categories by type
   */
  static async getCategoriesByType(
    type: string,
    tenantId: string
  ): Promise<Category[]> {
    try {
      return this.getCategories(tenantId, { type })
    } catch (error) {
      return this.handleError(error, 'CategoryService.getCategoriesByType')
    }
  }

  /**
   * Get expense categories (most common use case)
   */
  static async getExpenseCategories(tenantId: string): Promise<Category[]> {
    try {
      return this.getCategoriesByType('EXPENSE', tenantId)
    } catch (error) {
      return this.handleError(error, 'CategoryService.getExpenseCategories')
    }
  }

  /**
   * Get income categories
   */
  static async getIncomeCategories(tenantId: string): Promise<Category[]> {
    try {
      return this.getCategoriesByType('INCOME', tenantId)
    } catch (error) {
      return this.handleError(error, 'CategoryService.getIncomeCategories')
    }
  }
}
