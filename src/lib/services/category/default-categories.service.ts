import { BaseService } from '../base'
import type { Category } from '@prisma/client'
import { getCurrentUTCDate } from '@/lib/utils/date-utils'
import { prisma } from '@/lib/prisma'

/**
 * Default Categories Service
 *
 * Manages the creation and retrieval of default "Uncategorized" categories
 * for each tenant. Eliminates NULL category handling complexity.
 */
export class DefaultCategoriesService extends BaseService {
  protected get prisma() {
    return prisma
  }

  /**
   * Ensure default "Uncategorized" categories exist for a tenant
   * Creates one category per transaction type (INCOME, EXPENSE, TRANSFER)
   */
  async ensureDefaultCategories(tenantId: string): Promise<{
    income: Category
    expense: Category
    transfer: Category
  }> {
    const defaultCategories = [
      { name: 'Uncategorized', type: 'INCOME', color: '#6B7280' },
      { name: 'Uncategorized', type: 'EXPENSE', color: '#6B7280' },
      { name: 'Uncategorized', type: 'TRANSFER', color: '#6B7280' }
    ]

    const results = await Promise.all(
      defaultCategories.map(async (cat) => {
        return await this.prisma.category.upsert({
          where: {
            tenant_id_name_type: {
              tenant_id: tenantId,
              name: cat.name,
              type: cat.type
            }
          },
          create: { 
            tenant_id: tenantId, 
            ...cat,
            created_at: getCurrentUTCDate(),
            updated_at: getCurrentUTCDate()
          },
          update: {} // Don't overwrite if exists
        })
      })
    )

    return {
      income: results.find(r => r.type === 'INCOME')!,
      expense: results.find(r => r.type === 'EXPENSE')!,
      transfer: results.find(r => r.type === 'TRANSFER')!
    }
  }

  /**
   * Get the default category ID for a specific transaction type
   * Creates the category if it doesn't exist
   */
  async getDefaultCategoryId(
    tenantId: string,
    transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  ): Promise<number> {
    let category = await this.prisma.category.findUnique({
      where: {
        tenant_id_name_type: {
          tenant_id: tenantId,
          name: 'Uncategorized',
          type: transactionType
        }
      }
    })

    if (!category) {
      category = await this.prisma.category.create({
        data: {
          tenant_id: tenantId,
          name: 'Uncategorized',
          type: transactionType,
          color: '#6B7280'
        }
      })
    }

    return category.id
  }

  /**
   * Get all default categories for a tenant
   */
  async getDefaultCategories(tenantId: string): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: {
        tenant_id: tenantId,
        name: 'Uncategorized'
      },
      orderBy: {
        type: 'asc'
      }
    })
  }

  /**
   * Check if a category is a default "Uncategorized" category
   */
  static isDefaultCategory(category: Category): boolean {
    return category.name === 'Uncategorized'
  }

  /**
   * Create default categories for a new tenant
   * Called during tenant registration
   */
  async createDefaultCategoriesForNewTenant(tenantId: string): Promise<Category[]> {
    const defaultCategories = [
      { name: 'Uncategorized', type: 'INCOME', color: '#6B7280' },
      { name: 'Uncategorized', type: 'EXPENSE', color: '#6B7280' },
      { name: 'Uncategorized', type: 'TRANSFER', color: '#6B7280' }
    ]

    return await this.prisma.category.createMany({
      data: defaultCategories.map(cat => ({
        tenant_id: tenantId,
        ...cat
      })),
      skipDuplicates: true
    }).then(() => this.getDefaultCategories(tenantId))
  }
}

export const defaultCategoriesService = new DefaultCategoriesService()
