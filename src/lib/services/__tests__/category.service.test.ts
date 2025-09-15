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

// Get the mocked prisma
const mockPrisma = prisma as any

describe('CategoryService', () => {
  const mockTenantId = 'tenant-123'
  const mockCategory = {
    id: 1,
    tenant_id: mockTenantId,
    name: 'Test Category',
    type: 'EXPENSE',
    color: '#red',
    created_at: new Date(),
    updated_at: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCategories', () => {
    it('should return categories for a tenant', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory])

      const result = await CategoryService.getCategories(mockTenantId)

      expect(result).toEqual([mockCategory])
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { tenant_id: mockTenantId },
        orderBy: [{ type: 'asc' }, { name: 'asc' }]
      })
    })

    it('should apply filters correctly', async () => {
      const filters = {
        type: 'INCOME',
        search: 'salary'
      }

      mockPrisma.category.findMany.mockResolvedValue([])

      await CategoryService.getCategories(mockTenantId, filters)

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

    it('should throw error for invalid tenant ID', async () => {
      await expect(CategoryService.getCategories('')).rejects.toThrow('Valid tenant ID is required')
    })
  })

  describe('getCategoryById', () => {
    it('should return category when found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory)

      const result = await CategoryService.getCategoryById(1, mockTenantId)

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

      const result = await CategoryService.getCategoryById(999, mockTenantId)

      expect(result).toBeNull()
    })
  })

  describe('createCategory', () => {
    const validCategoryData = {
      name: 'New Category',
      type: 'EXPENSE',
      color: '#blue'
    }

    it('should create category successfully', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null) // No duplicate
      mockPrisma.category.create.mockResolvedValue({
        ...mockCategory,
        ...validCategoryData,
        id: 2
      })

      const result = await CategoryService.createCategory(mockTenantId, validCategoryData)

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

      await expect(CategoryService.createCategory(mockTenantId, validCategoryData))
        .rejects.toThrow('Category with this name and type already exists')
    })

    it('should allow same name with different type', async () => {
      const incomeCategory = { ...validCategoryData, type: 'INCOME' }
      
      mockPrisma.category.findFirst.mockResolvedValue(null) // No duplicate for INCOME type
      mockPrisma.category.create.mockResolvedValue({
        ...mockCategory,
        ...incomeCategory,
        id: 3
      })

      await CategoryService.createCategory(mockTenantId, incomeCategory)

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
        updated_at: new Date()
      })

      const result = await CategoryService.updateCategory(1, mockTenantId, updateData)

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...updateData,
          updated_at: expect.any(Date)
        }
      })
    })

    it('should throw error if category does not exist', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null)

      await expect(CategoryService.updateCategory(999, mockTenantId, updateData))
        .rejects.toThrow('Category not found or does not belong to tenant')
    })

    it('should check for duplicate name/type when updating', async () => {
      const updateWithNameAndType = { name: 'Duplicate Name', type: 'EXPENSE' }
      
      mockPrisma.category.findFirst
        .mockResolvedValueOnce(mockCategory) // First call: existing category
        .mockResolvedValueOnce({ id: 2, name: 'Duplicate Name', type: 'EXPENSE', tenant_id: mockTenantId } as any) // Second call: duplicate check

      await expect(CategoryService.updateCategory(1, mockTenantId, updateWithNameAndType))
        .rejects.toThrow('Category with this name and type already exists')
    })

    it('should allow updating to same name and type', async () => {
      const updateWithSameNameAndType = { name: 'Test Category', type: 'EXPENSE' } // Same as mockCategory
      
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory)
      mockPrisma.category.update.mockResolvedValue(mockCategory)

      await CategoryService.updateCategory(1, mockTenantId, updateWithSameNameAndType)

      // Should not check for duplicates since name and type are the same
      expect(mockPrisma.category.findFirst).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteCategory', () => {
    it('should delete category successfully when no transactions exist', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory)
      mockPrisma.transaction.count.mockResolvedValue(0)
      mockPrisma.category.delete.mockResolvedValue(mockCategory)

      await CategoryService.deleteCategory(1, mockTenantId)

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })

    it('should throw error if category does not exist', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null)

      await expect(CategoryService.deleteCategory(999, mockTenantId))
        .rejects.toThrow('Category not found or does not belong to tenant')
    })

    it('should throw error if category has transactions', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory)
      mockPrisma.transaction.count.mockResolvedValue(3) // Has transactions

      await expect(CategoryService.deleteCategory(1, mockTenantId))
        .rejects.toThrow('Cannot delete category with existing transactions')
    })
  })

  describe('getCategoriesByType', () => {
    it('should return categories of specific type', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory])

      const result = await CategoryService.getCategoriesByType('EXPENSE', mockTenantId)

      expect(result).toEqual([mockCategory])
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          type: 'EXPENSE'
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }]
      })
    })
  })

  describe('getExpenseCategories', () => {
    it('should return only expense categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory])

      const result = await CategoryService.getExpenseCategories(mockTenantId)

      expect(result).toEqual([mockCategory])
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          type: 'EXPENSE'
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }]
      })
    })
  })

  describe('getIncomeCategories', () => {
    it('should return only income categories', async () => {
      const incomeCategory = { ...mockCategory, type: 'INCOME' }
      mockPrisma.category.findMany.mockResolvedValue([incomeCategory])

      const result = await CategoryService.getIncomeCategories(mockTenantId)

      expect(result).toEqual([incomeCategory])
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          type: 'INCOME'
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }]
      })
    })
  })

  describe('error handling', () => {
    it('should handle database errors in getCategories', async () => {
      mockPrisma.category.findMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(CategoryService.getCategories(mockTenantId))
        .rejects.toThrow('Database connection failed')
    })

    it('should handle database errors in createCategory', async () => {
      mockPrisma.category.findFirst.mockRejectedValue(new Error('Database connection failed'))

      await expect(CategoryService.createCategory(mockTenantId, {
        name: 'Test',
        type: 'EXPENSE',
        color: '#blue'
      })).rejects.toThrow('Database connection failed')
    })

    it('should handle database errors in deleteCategory', async () => {
      mockPrisma.category.findFirst.mockRejectedValue(new Error('Database connection failed'))

      await expect(CategoryService.deleteCategory(1, mockTenantId))
        .rejects.toThrow('Database connection failed')
    })
  })
})
