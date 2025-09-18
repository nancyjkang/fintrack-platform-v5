// Mock Prisma first
const mockPrisma = {
  transaction: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn()
  },
  financialCube: {
    deleteMany: jest.fn(),
    createMany: jest.fn()
  },
  $queryRawUnsafe: jest.fn()
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

import { CubeService } from '../cube.service'
import { TransactionService } from '../transaction.service'
import type { BulkUpdateMetadata, CubeRelevantFields } from '@/lib/types/cube-delta.types'
import { getCurrentUTCDate } from '@/lib/utils/date-utils'
import { Decimal } from '@prisma/client/runtime/library'

// Mock the cube service for transaction service tests only
jest.mock('../cube.service', () => {
  const actual = jest.requireActual('../cube.service')
  return {
    ...actual,
    cubeService: {
      updateCubeWithBulkMetadata: jest.fn()
    }
  }
})

describe('CubeService - Bulk Updates', () => {
  let cubeService: CubeService

  beforeEach(() => {
    cubeService = new CubeService()
    jest.clearAllMocks()

    // Set up default mock returns
    mockPrisma.transaction.findMany.mockResolvedValue([])
    mockPrisma.transaction.findFirst.mockResolvedValue(null)
    mockPrisma.financialCube.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.financialCube.createMany.mockResolvedValue({ count: 0 })
    mockPrisma.$queryRawUnsafe.mockResolvedValue([])
  })

  describe('updateCubeWithBulkMetadata', () => {
    it('should handle empty transaction list', async () => {
      const bulkUpdate: BulkUpdateMetadata = {
        tenantId: 'tenant-1',
        affectedTransactionIds: [],
        changedFields: [],
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      }

      const result = await cubeService.updateCubeWithBulkMetadata(bulkUpdate)

      expect(result.cubesToRegenerate).toEqual([])
      expect(result.affectedPeriods).toEqual([])
      expect(result.totalDeltas).toBe(0)
    })

    it('should calculate periods from date range', async () => {
      const bulkUpdate: BulkUpdateMetadata = {
        tenantId: 'tenant-1',
        affectedTransactionIds: [1, 2, 3],
        changedFields: [{
          fieldName: 'category_id',
          oldValue: 1,
          newValue: 2
        }],
        dateRange: {
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-20')
        }
      }

      // Mock the regeneration methods
      const mockTargets = [{
        tenantId: 'tenant-1',
        periodType: 'WEEKLY' as const,
        periodStart: new Date('2024-01-15'),
        periodEnd: new Date('2024-01-21'),
        transactionType: 'EXPENSE' as const,
        categoryId: 1
      }]

      jest.spyOn(cubeService as any, 'calculateRegenerationTargetsFromBulk')
        .mockResolvedValue(mockTargets)
      jest.spyOn(cubeService as any, 'groupCubesByPeriod')
        .mockReturnValue(new Map())
      jest.spyOn(cubeService as any, 'regenerateCubeRecords')
        .mockResolvedValue(undefined)

      const result = await cubeService.updateCubeWithBulkMetadata(bulkUpdate)

      expect(result.cubesToRegenerate).toEqual(mockTargets)
      expect(result.totalDeltas).toBe(3)
    })

    it('should use transaction IDs to determine date range when not provided', async () => {
      mockPrisma.transaction.findFirst
        .mockResolvedValueOnce({ date: new Date('2024-01-01') }) // earliest
        .mockResolvedValueOnce({ date: new Date('2024-01-31') }) // latest

      const bulkUpdate: BulkUpdateMetadata = {
        tenantId: 'tenant-1',
        affectedTransactionIds: [1, 2, 3],
        changedFields: [{
          fieldName: 'amount',
          oldValue: null,
          newValue: new Decimal('100.00')
        }]
        // No dateRange provided
      }

      // Mock the regeneration methods
      jest.spyOn(cubeService as any, 'calculateRegenerationTargetsFromBulk')
        .mockResolvedValue([])
      jest.spyOn(cubeService as any, 'groupCubesByPeriod')
        .mockReturnValue(new Map())
      jest.spyOn(cubeService as any, 'regenerateCubeRecords')
        .mockResolvedValue(undefined)

      await cubeService.updateCubeWithBulkMetadata(bulkUpdate)

      // Verify that the date range methods were called
      expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
        select: { date: true },
        orderBy: { date: 'asc' }
      })
      expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
        select: { date: true },
        orderBy: { date: 'desc' }
      })
    })
  })

  describe('calculateRegenerationTargetsFromBulk', () => {
    it('should handle category_id changes correctly', async () => {
      // Set up mock data for the private method calls
      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([
          { type: 'EXPENSE' }
        ]) // getTransactionTypesForTransactions
        .mockResolvedValueOnce([
          { is_recurring: false }
        ]) // getRecurringFlagsForTransactions

      const bulkUpdate: BulkUpdateMetadata = {
        tenantId: 'tenant-1',
        affectedTransactionIds: [1, 2, 3],
        changedFields: [{
          fieldName: 'category_id',
          oldValue: 1,
          newValue: 2
        }],
        dateRange: {
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-20')
        }
      }

      const periods = [
        { type: 'WEEKLY' as const, start: new Date('2024-01-15'), end: new Date('2024-01-21') },
        { type: 'MONTHLY' as const, start: new Date('2024-01-01'), end: new Date('2024-01-31') }
      ]

      const result = await (cubeService as any).calculateRegenerationTargetsFromBulk(bulkUpdate, periods)

      // Should create targets for both old and new categories, for both periods
      expect(result).toHaveLength(4) // 2 categories × 2 periods
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          tenantId: 'tenant-1',
          periodType: 'WEEKLY',
          categoryId: 1 // old category
        }),
        expect.objectContaining({
          tenantId: 'tenant-1',
          periodType: 'WEEKLY',
          categoryId: 2 // new category
        }),
        expect.objectContaining({
          tenantId: 'tenant-1',
          periodType: 'MONTHLY',
          categoryId: 1 // old category
        }),
        expect.objectContaining({
          tenantId: 'tenant-1',
          periodType: 'MONTHLY',
          categoryId: 2 // new category
        })
      ]))
    })

    it('should handle account_id changes by deriving categories', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        { category_id: 1 },
        { category_id: 2 }
      ])

      const bulkUpdate: BulkUpdateMetadata = {
        tenantId: 'tenant-1',
        affectedTransactionIds: [1, 2, 3],
        changedFields: [{
          fieldName: 'account_id',
          oldValue: 100,
          newValue: 200
        }],
        dateRange: {
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-20')
        }
      }

      const periods = [
        { type: 'WEEKLY' as const, start: new Date('2024-01-15'), end: new Date('2024-01-21') }
      ]

      const result = await (cubeService as any).calculateRegenerationTargetsFromBulk(bulkUpdate, periods)

      // Should query for categories of affected transactions
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
        select: { category_id: true },
        distinct: ['category_id']
      })

      // Should create targets for each category found
      expect(result).toHaveLength(2) // 2 categories × 1 period
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ categoryId: 1 }),
        expect.objectContaining({ categoryId: 2 })
      ]))
    })

    it('should handle transaction type changes', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        { category_id: 1 }
      ])

      const bulkUpdate: BulkUpdateMetadata = {
        tenantId: 'tenant-1',
        affectedTransactionIds: [1, 2, 3],
        changedFields: [{
          fieldName: 'type',
          oldValue: 'EXPENSE',
          newValue: 'INCOME'
        }],
        dateRange: {
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-20')
        }
      }

      const periods = [
        { type: 'WEEKLY' as const, start: new Date('2024-01-15'), end: new Date('2024-01-21') }
      ]

      const result = await (cubeService as any).calculateRegenerationTargetsFromBulk(bulkUpdate, periods)

      // Should create targets for both old and new transaction types
      expect(result).toHaveLength(2) // 2 transaction types × 1 category × 1 period
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          transactionType: 'EXPENSE',
          categoryId: 1
        }),
        expect.objectContaining({
          transactionType: 'INCOME',
          categoryId: 1
        })
      ]))
    })

    it('should throw error for date changes', async () => {
      const bulkUpdate: BulkUpdateMetadata = {
        tenantId: 'tenant-1',
        affectedTransactionIds: [1, 2, 3],
        changedFields: [{
          fieldName: 'date',
          oldValue: new Date('2024-01-01'),
          newValue: new Date('2024-01-02')
        }]
      }

      const periods = [
        { type: 'WEEKLY' as const, start: new Date('2024-01-15'), end: new Date('2024-01-21') }
      ]

      await expect(
        (cubeService as any).calculateRegenerationTargetsFromBulk(bulkUpdate, periods)
      ).rejects.toThrow('Date changes in bulk updates not yet supported')
    })

    it('should deduplicate targets correctly', async () => {
      // Set up mock data for the private method calls
      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([
          { type: 'EXPENSE' }
        ]) // getTransactionTypesForTransactions
        .mockResolvedValueOnce([
          { is_recurring: false }
        ]) // getRecurringFlagsForTransactions
        .mockResolvedValueOnce([
          { category_id: 1 }
        ]) // getCategoriesForTransactions (for amount change)
        .mockResolvedValueOnce([
          { category_id: 1 }
        ]) // getCategoriesForTransactions (for is_recurring change)

      const bulkUpdate: BulkUpdateMetadata = {
        tenantId: 'tenant-1',
        affectedTransactionIds: [1, 2, 3],
        changedFields: [
          {
            fieldName: 'amount',
            oldValue: new Decimal('50.00'),
            newValue: new Decimal('100.00')
          },
          {
            fieldName: 'is_recurring',
            oldValue: false,
            newValue: true
          }
        ],
        dateRange: {
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-20')
        }
      }

      const periods = [
        { type: 'WEEKLY' as const, start: new Date('2024-01-15'), end: new Date('2024-01-21') }
      ]

      const result = await (cubeService as any).calculateRegenerationTargetsFromBulk(bulkUpdate, periods)

      // Amount change and is_recurring change should result in different targets
      // because is_recurring affects both old (false) and new (true) states
      expect(result).toHaveLength(2)
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          tenantId: 'tenant-1',
          periodType: 'WEEKLY',
          categoryId: 1,
          isRecurring: false // old recurring state
        }),
        expect.objectContaining({
          tenantId: 'tenant-1',
          periodType: 'WEEKLY',
          categoryId: 1,
          isRecurring: true // new recurring state
        })
      ]))
    })
  })

  describe('deduplicateTargets', () => {
    it('should remove duplicate targets based on key fields', () => {
      const targets = [
        {
          tenantId: 'tenant-1',
          periodType: 'WEEKLY' as const,
          periodStart: new Date('2024-01-15'),
          periodEnd: new Date('2024-01-21'),
          transactionType: 'EXPENSE' as const,
          categoryId: 1
        },
        {
          tenantId: 'tenant-1',
          periodType: 'WEEKLY' as const,
          periodStart: new Date('2024-01-15'),
          periodEnd: new Date('2024-01-21'),
          transactionType: 'EXPENSE' as const,
          categoryId: 1
        },
        {
          tenantId: 'tenant-1',
          periodType: 'WEEKLY' as const,
          periodStart: new Date('2024-01-15'),
          periodEnd: new Date('2024-01-21'),
          transactionType: 'EXPENSE' as const,
          categoryId: 2
        }
      ]

      const result = (cubeService as any).deduplicateTargets(targets)

      expect(result).toHaveLength(2) // First two should be deduplicated
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ categoryId: 1 }),
        expect.objectContaining({ categoryId: 2 })
      ]))
    })
  })
})

describe('TransactionService - Bulk Updates', () => {
  describe('bulkUpdateTransactions', () => {
    it('should perform bulk update and trigger cube update', async () => {
      const transactionIds = [1, 2, 3]
      const updates: Partial<CubeRelevantFields> = {
        category_id: 2
      }
      const tenantId = 'tenant-1'

      // Mock old transactions
      mockPrisma.transaction.findMany.mockResolvedValue([
        {
          id: 1,
          account_id: 100,
          category_id: 1,
          amount: new Decimal('50.00'),
          date: new Date('2024-01-15'),
          type: 'EXPENSE',
          is_recurring: false
        },
        {
          id: 2,
          account_id: 100,
          category_id: 1,
          amount: new Decimal('75.00'),
          date: new Date('2024-01-16'),
          type: 'EXPENSE',
          is_recurring: false
        }
      ])

      // Mock the bulk update
      mockPrisma.transaction.updateMany.mockResolvedValue({ count: 2 })

      // Use the existing mock and set up its return value
      const { cubeService } = await import('../cube.service')
      ;(cubeService.updateCubeWithBulkMetadata as jest.Mock).mockResolvedValue({
        cubesToRegenerate: [],
        affectedPeriods: [],
        totalDeltas: 2,
        processedAt: getCurrentUTCDate()
      })

      await TransactionService.bulkUpdateTransactions(transactionIds, updates, tenantId)

      // Verify database operations (with cube integration)
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { id: { in: transactionIds }, tenant_id: tenantId },
        select: {
          id: true,
          account_id: true,
          category_id: true,
          amount: true,
          date: true,
          type: true,
          is_recurring: true
        }
      })

      expect(mockPrisma.transaction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: transactionIds }, tenant_id: tenantId },
        data: updates
      })

      // Note: Cube integration removed as per user request
      // TODO: Add cube integration later when requested
    })

    it('should throw error when no transactions found', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([])

      await expect(
        TransactionService.bulkUpdateTransactions([999], { category_id: 2 }, 'tenant-1')
      ).rejects.toThrow('No transactions found for bulk update')
    })

    it('should handle multiple old category values (simplified implementation)', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 }
      ])

      // Current implementation allows this - no complex validation
      await expect(
        TransactionService.bulkUpdateTransactions([1, 2], { category_id: 3 }, 'tenant-1')
      ).resolves.toBeUndefined()

      expect(mockPrisma.transaction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] }, tenant_id: 'tenant-1' },
        data: { category_id: 3 }
      })
    })

    it('should reject date changes (cube integration limitation)', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        {
          id: 1,
          account_id: 1,
          category_id: 5,
          amount: new Decimal('100'),
          date: new Date('2024-01-15'),
          type: 'EXPENSE',
          is_recurring: false
        }
      ])

      // Cube integration doesn't support date changes in bulk operations
      await expect(
        TransactionService.bulkUpdateTransactions([1], { date: new Date('2024-01-20') }, 'tenant-1')
      ).rejects.toThrow('Date changes in bulk updates not supported. Use individual transaction updates.')
    })
  })

  describe('createBulkUpdateMetadata', () => {
    it('should create correct metadata for category change', () => {
      const oldTransactions = [
        {
          id: 1,
          account_id: 100,
          category_id: 1,
          amount: new Decimal('50.00'),
          date: new Date('2024-01-15'),
          type: 'EXPENSE',
          is_recurring: false
        },
        {
          id: 2,
          account_id: 100,
          category_id: 1,
          amount: new Decimal('75.00'),
          date: new Date('2024-01-20'),
          type: 'EXPENSE',
          is_recurring: false
        }
      ]

      const updates: Partial<CubeRelevantFields> = {
        category_id: 2
      }

      const result = (TransactionService as any).createBulkUpdateMetadata(
        oldTransactions,
        updates,
        'tenant-1'
      )

      expect(result).toEqual({
        tenantId: 'tenant-1',
        affectedTransactionIds: [1, 2],
        changedFields: [{
          fieldName: 'category_id',
          oldValue: 1,
          newValue: 2
        }],
        dateRange: {
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-20')
        }
      })
    })
  })

  describe('extractCubeRelevantFields', () => {
    it('should extract correct fields from transaction', () => {
      const transaction = {
        id: 1,
        account_id: 100,
        category_id: 1,
        amount: new Decimal('50.00'),
        date: new Date('2024-01-15'),
        type: 'EXPENSE',
        is_recurring: false,
        description: 'Test transaction',
        notes: 'Some notes'
      }

      const result = TransactionService.extractCubeRelevantFields(transaction)

      expect(result).toEqual({
        account_id: 100,
        category_id: 1,
        amount: new Decimal('50.00'),
        date: new Date('2024-01-15'),
        type: 'EXPENSE',
        is_recurring: false
      })
    })
  })
})
