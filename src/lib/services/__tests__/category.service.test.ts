// Mock the dependencies first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { CategoryService } from '../category.service'
import { prisma } from '@/lib/prisma'
import { createUTCDate } from '@/lib/utils/date-utils'

// Get the mocked prisma
const mockPrisma = prisma as any

describe('CategoryService', () => {
  const mockTenantId = 'tenant-123'
  const mockUserId = 'user-123'
  let categoryService: CategoryService
  const mockCategory = {
    id: 1,
    tenant_id: mockTenantId,
    name: 'Test Category',
    type: 'EXPENSE',
    color: '#red',
    created_at: createUTCDate(2025, 0, 1),
    updated_at: createUTCDate(2025, 0, 1),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    categoryService = new CategoryService()
  })

  describe('getCategories', () => {
    it('should return categories for a tenant', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory])

      const result = await categoryService.getCategories(mockTenantId)

      expect(result).toEqual([mockCategory])
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { tenant_id: mockTenantId },
        orderBy: [{ type: 'asc' }, { name: 'asc' }]
      })
    })

    it('should apply filters correctly', async () => {
      const filters = {
        type: 'INCOME' as const,
        search: 'salary'
      }

      mockPrisma.category.findMany.mockResolvedValue([])

      await categoryService.getCategories(mockTenantId, filters)

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          type: 'INCOME',
          name: {
            contains: 'salary',
            mode: 'insensitive'
          }
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }]
      })
    })

    it('should handle empty tenant ID', async () => {
      mockPrisma.category.findMany.mockResolvedValue([])
      const result = await categoryService.getCategories('')
      expect(result).toEqual([])
    })
  })

  describe('getCategoryById', () => {
    it('should return category when found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory)

      const result = await categoryService.getCategoryById(mockTenantId, 1)

      expect(result).toEqual(mockCategory)
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          tenant_id: mockTenantId
        }
      })
    })

    it('should return null when category not found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null)

      const result = await categoryService.getCategoryById(mockTenantId, 999)

      expect(result).toBeNull()
    })
  })

  describe('createCategory', () => {
    const validCategoryData = {
      name: 'New Category',
      type: 'EXPENSE' as const,
      color: '#blue'
    }

    it('should create category successfully', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null) // No duplicate
      mockPrisma.category.create.mockResolvedValue({
        ...mockCategory,
        ...validCategoryData,
        id: 2
      })

      const result = await categoryService.createCategory(mockTenantId, validCategoryData)

      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          tenant_id: mockTenantId,
          name: 'New Category',
          type: 'EXPENSE',
          color: '#blue'
        }
      })
    })

    it('should throw error if category name and type combination already exists', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory)

      await expect(categoryService.createCategory(mockTenantId, validCategoryData))
        .rejects.toThrow('A expense category named "New Category" already exists')
    })

    it('should allow same name with different type', async () => {
      const incomeCategory = { ...validCategoryData, type: 'INCOME' as const }

      mockPrisma.category.findFirst.mockResolvedValue(null) // No duplicate for INCOME type
      mockPrisma.category.create.mockResolvedValue({
        ...mockCategory,
        ...incomeCategory,
        id: 3
      })

      await categoryService.createCategory(mockTenantId, incomeCategory)

      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: { tenant_id: mockTenantId, name: 'New Category', type: 'INCOME' }
      })
      expect(mockPrisma.category.create).toHaveBeenCalled()
    })
  })

  describe('updateCategory', () => {
    const updateData = {
      name: 'Updated Category',
      color: '#green'
    }

    it('should update category successfully', async () => {
      // First call: get existing category
      mockPrisma.category.findFirst.mockResolvedValueOnce(mockCategory)
      // Second call: check for duplicate name/type (should return null since name is different)
      mockPrisma.category.findFirst.mockResolvedValueOnce(null)

      mockPrisma.category.update.mockResolvedValue({
        ...mockCategory,
        ...updateData,
        updated_at: createUTCDate(2025, 0, 1)
      })

      const result = await categoryService.updateCategory(mockTenantId, 1, updateData)

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData
      })
    })

    it('should throw error if category does not exist', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null)

      await expect(categoryService.updateCategory(mockTenantId, 999, updateData))
        .rejects.toThrow('Category not found')
    })

    it('should check for duplicate name/type when updating', async () => {
      const updateWithNameAndType = { name: 'Duplicate Name', type: 'EXPENSE' as const }

      mockPrisma.category.findFirst
        .mockResolvedValueOnce(mockCategory) // First call: existing category
        .mockResolvedValueOnce({ id: 2, name: 'Duplicate Name', type: 'EXPENSE', tenant_id: mockTenantId } as any) // Second call: duplicate check

      await expect(categoryService.updateCategory(mockTenantId, 1, updateWithNameAndType))
        .rejects.toThrow('A expense category named "Duplicate Name" already exists')
    })

    it('should allow updating to same name and type', async () => {
      const updateWithSameNameAndType = { name: 'Test Category', type: 'EXPENSE' as const } // Same as mockCategory

      mockPrisma.category.findFirst.mockResolvedValue(mockCategory)
      mockPrisma.category.update.mockResolvedValue(mockCategory)

      await categoryService.updateCategory(mockTenantId, 1, updateWithSameNameAndType)

      // Should not check for duplicates since name and type are the same
      expect(mockPrisma.category.findFirst).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteCategory', () => {
    it('should delete category successfully when no transactions exist', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory)
      mockPrisma.transaction.count.mockResolvedValue(0)
      mockPrisma.category.delete.mockResolvedValue(mockCategory)

      await categoryService.deleteCategory(mockTenantId, 1)

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })

    it('should throw error if category does not exist', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null)

      await expect(categoryService.deleteCategory(mockTenantId, 999))
        .rejects.toThrow('Category not found')
    })

    it('should throw error if category has transactions', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory)
      mockPrisma.transaction.count.mockResolvedValue(3) // Has transactions

      await expect(categoryService.deleteCategory(mockTenantId, 1))
        .rejects.toThrow('Cannot delete category "Test Category" because it is used by 3 transaction(s)')
    })
  })

  // Note: getCategoriesByType, getExpenseCategories, and getIncomeCategories
  // are not implemented as separate methods. Use getCategories with filters instead.

  describe('error handling', () => {
    it('should handle database errors in getCategories', async () => {
      mockPrisma.category.findMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(categoryService.getCategories(mockTenantId))
        .rejects.toThrow('Database connection failed')
    })

    it('should handle database errors in createCategory', async () => {
      mockPrisma.category.findFirst.mockRejectedValue(new Error('Database connection failed'))

      await expect(categoryService.createCategory(mockTenantId, {
        name: 'Test',
        type: 'EXPENSE',
        color: '#blue'
      })).rejects.toThrow('Database connection failed')
    })

    it('should handle database errors in deleteCategory', async () => {
      mockPrisma.category.findFirst.mockRejectedValue(new Error('Database connection failed'))

      await expect(categoryService.deleteCategory(mockTenantId, 1))
        .rejects.toThrow('Database connection failed')
    })
  })
})
