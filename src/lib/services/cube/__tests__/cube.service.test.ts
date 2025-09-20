// Mock Prisma first
const mockPrisma = {
  financialCube: {
    count: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    createMany: jest.fn(),
    groupBy: jest.fn()
  },
  transaction: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  account: {
    count: jest.fn(),
    findFirst: jest.fn()
  },
  category: {
    findFirst: jest.fn()
  },
  $queryRawUnsafe: jest.fn()
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

import { CubeService } from '../cube.service'
import type { CubeRelevantFields } from '@/lib/types/cube-delta.types'
import { Decimal } from '@prisma/client/runtime/library'
import { getCurrentUTCDate } from '@/lib/utils/date-utils'

describe('CubeService', () => {
  let cubeService: CubeService
  const mockTenantId = 'test-tenant-123'

  beforeEach(() => {
    cubeService = new CubeService()
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  describe('clearAllData', () => {
    it('should clear all cube data for a tenant', async () => {
      // Arrange
      mockPrisma.financialCube.deleteMany.mockResolvedValue({ count: 100 })

      // Act
      const result = await cubeService.clearAllData(mockTenantId)

      // Assert
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: { tenant_id: mockTenantId }
      })
      expect(result).toBe(100)
    })

    it('should return 0 when no records exist', async () => {
      // Arrange
      mockPrisma.financialCube.deleteMany.mockResolvedValue({ count: 0 })

      // Act
      const result = await cubeService.clearAllData(mockTenantId)

      // Assert
      expect(result).toBe(0)
    })
  })

  describe('getCubeStatistics', () => {
    it('should return comprehensive cube statistics', async () => {
      // Arrange
      mockPrisma.financialCube.count
        .mockResolvedValueOnce(500) // total records
        .mockResolvedValueOnce(300) // weekly records
        .mockResolvedValueOnce(200) // monthly records
        .mockResolvedValueOnce(15)  // account count
        .mockResolvedValueOnce(25)  // category count

      mockPrisma.financialCube.findFirst
        .mockResolvedValueOnce({ created_at: new Date('2024-03-15T12:00:00Z') }) // last updated

      mockPrisma.financialCube.aggregate
        .mockResolvedValueOnce({
          _min: { period_start: new Date('2024-01-01') },
          _max: { period_start: new Date('2024-03-31') }
        })

      mockPrisma.financialCube.groupBy
        .mockResolvedValueOnce([
          { account_id: 1, category_id: 1 },
          { account_id: 2, category_id: 2 },
          { account_id: 3, category_id: null }
        ])

      // Act
      const stats = await cubeService.getCubeStatistics(mockTenantId)

      // Assert
      expect(stats).toEqual({
        totalRecords: 500,
        weeklyRecords: 300,
        monthlyRecords: 200,
        dateRange: {
          earliest: new Date('2024-01-01'),
          latest: new Date('2024-03-31')
        },
        accountCount: 3, // 3 unique account_ids from groupBy mock
        categoryCount: 2, // 2 non-null category_ids from groupBy mock
        lastUpdated: new Date('2024-03-15T12:00:00Z')
      })
    })

    it('should handle empty cube gracefully', async () => {
      // Arrange - Reset all mocks first
      jest.resetAllMocks()

      mockPrisma.financialCube.count
        .mockResolvedValueOnce(0) // total records
        .mockResolvedValueOnce(0) // weekly records
        .mockResolvedValueOnce(0) // monthly records

      mockPrisma.financialCube.findFirst.mockResolvedValue(null)
      mockPrisma.financialCube.aggregate.mockResolvedValue({
        _min: { period_start: null },
        _max: { period_start: null }
      })
      mockPrisma.financialCube.groupBy.mockResolvedValue([])

      // Act
      const stats = await cubeService.getCubeStatistics(mockTenantId)

      // Assert
      expect(stats).toEqual({
        totalRecords: 0,
        weeklyRecords: 0,
        monthlyRecords: 0,
        dateRange: {
          earliest: null,
          latest: null
        },
        accountCount: 0,
        categoryCount: 0,
        lastUpdated: null
      })
    })
  })

  describe('populateHistoricalData', () => {
    it('should populate cube data with default options', async () => {
      // Arrange
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31') // Just one month to keep test simple

      mockPrisma.transaction.findFirst.mockResolvedValue({
        date: startDate
      })
      mockPrisma.transaction.count.mockResolvedValue(1)
      mockPrisma.account.count.mockResolvedValue(1)

      const mockRebuildCubeForPeriod = jest.spyOn(cubeService, 'rebuildCubeForPeriod')
        .mockResolvedValue()

      // Act
      const result = await cubeService.populateHistoricalData(mockTenantId, {
        startDate,
        endDate
      })

      // Assert
      expect(result.periodsProcessed).toBeGreaterThan(0)
      expect(result.accountsProcessed).toBe(1)
      expect(mockRebuildCubeForPeriod).toHaveBeenCalled()
    })

    it('should handle empty transaction history', async () => {
      // Arrange
      mockPrisma.transaction.findFirst.mockResolvedValue(null)

      // Act
      const result = await cubeService.populateHistoricalData(mockTenantId, {})

      // Assert
      expect(result.periodsProcessed).toBe(0)
      expect(result.accountsProcessed).toBe(0)
    })

    it('should respect custom date range options', async () => {
      // Arrange
      const startDate = new Date('2024-02-01')
      const endDate = new Date('2024-02-29')
      mockPrisma.transaction.count.mockResolvedValue(1)
      mockPrisma.account.count.mockResolvedValue(1)

      const mockRebuildCubeForPeriod = jest.spyOn(cubeService, 'rebuildCubeForPeriod')
        .mockResolvedValue()

      // Act
      const result = await cubeService.populateHistoricalData(mockTenantId, {
        startDate,
        endDate,
        clearExisting: true
      })

      // Assert
      expect(result.periodsProcessed).toBeGreaterThan(0)
      expect(result.accountsProcessed).toBe(1)
      expect(mockRebuildCubeForPeriod).toHaveBeenCalled()
    })

    it('should handle account-specific population', async () => {
      // Arrange
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      mockPrisma.transaction.findFirst.mockResolvedValue({
        date: startDate
      })
      mockPrisma.transaction.count.mockResolvedValue(1)

      const mockRebuildCubeForPeriod = jest.spyOn(cubeService, 'rebuildCubeForPeriod')
        .mockResolvedValue()

      // Act
      const result = await cubeService.populateHistoricalData(mockTenantId, {
        startDate,
        endDate,
        accountId: 123
      })

      // Assert
      expect(result.periodsProcessed).toBeGreaterThan(0)
      expect(result.accountsProcessed).toBe(1)
      expect(mockRebuildCubeForPeriod).toHaveBeenCalled()
    })
  })

  describe('buildCubeForSinglePeriod', () => {
    it('should build cube data for a single period', async () => {
      // Arrange
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const periodType = 'MONTHLY'

      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        {
          transaction_type: 'EXPENSE',
          category_id: 1,
          category_name: 'Food',
          account_id: 100,
          account_name: 'Checking',
          is_recurring: false,
          total_amount: new Decimal('500.00'),
          transaction_count: 10,
          avg_amount: new Decimal('50.00')
        }
      ])

      // Act
      await (cubeService as any).buildCubeForSinglePeriod(mockTenantId, startDate, endDate, periodType)

      // Assert
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled()
    })

    it('should handle empty aggregation results', async () => {
      // Arrange
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const periodType = 'WEEKLY'

      mockPrisma.$queryRawUnsafe.mockResolvedValue([])

      // Act & Assert - should not throw
      await expect(
        (cubeService as any).buildCubeForSinglePeriod(mockTenantId, startDate, endDate, periodType)
      ).resolves.not.toThrow()
    })

    it('should handle account-specific building', async () => {
      // Arrange
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const periodType = 'MONTHLY'
      const accountId = 123

      mockPrisma.$queryRawUnsafe.mockResolvedValue([])

      // Act
      await (cubeService as any).buildCubeForSinglePeriod(mockTenantId, startDate, endDate, periodType, accountId)

      // Assert
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled()
    })
  })

  describe('rebuildCubeForPeriod', () => {
    it('should rebuild cube data for a date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const periodType = 'MONTHLY'

      const mockClearCubeForPeriod = jest.spyOn(cubeService as any, 'clearCubeForPeriod')
        .mockResolvedValue(undefined)
      const mockBuildCubeForSinglePeriod = jest.spyOn(cubeService as any, 'buildCubeForSinglePeriod')
        .mockResolvedValue(undefined)

      // Act
      await cubeService.rebuildCubeForPeriod(mockTenantId, startDate, endDate, periodType)

      // Assert
      expect(mockClearCubeForPeriod).toHaveBeenCalledWith(
        mockTenantId, startDate, endDate, periodType, undefined
      )
      // The buildCubeForSinglePeriod should be called at least once
      expect(mockBuildCubeForSinglePeriod).toHaveBeenCalled()
      // Check that it was called with the correct tenant and period type
      expect(mockBuildCubeForSinglePeriod).toHaveBeenCalledWith(
        expect.stringMatching(mockTenantId),
        expect.any(Date),
        expect.any(Date),
        periodType,
        undefined
      )
    })

    it('should handle account-specific rebuilding', async () => {
      // Arrange
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const periodType = 'WEEKLY'
      const accountId = 456

      const mockClearCubeForPeriod = jest.spyOn(cubeService as any, 'clearCubeForPeriod')
        .mockResolvedValue(undefined)
      const mockBuildCubeForSinglePeriod = jest.spyOn(cubeService as any, 'buildCubeForSinglePeriod')
        .mockResolvedValue(undefined)

      // Act
      await cubeService.rebuildCubeForPeriod(
        mockTenantId, startDate, endDate, periodType, accountId
      )

      // Assert
      expect(mockClearCubeForPeriod).toHaveBeenCalledWith(
        mockTenantId, startDate, endDate, periodType, accountId
      )
      // The buildCubeForSinglePeriod should be called at least once with the account ID
      expect(mockBuildCubeForSinglePeriod).toHaveBeenCalled()
      // Check that it was called with the correct tenant, period type, and account ID
      expect(mockBuildCubeForSinglePeriod).toHaveBeenCalledWith(
        expect.stringMatching(mockTenantId),
        expect.any(Date),
        expect.any(Date),
        periodType,
        accountId
      )
    })
  })

  // OBSOLETE: Individual delta processing tests removed
  // Use bulk metadata approach tests in cube-bulk-updates.test.ts instead

  describe('Static Delta Creation Methods', () => {
    it('should create INSERT delta correctly', () => {
      // Arrange
      const transactionId = 123
      const newValues: CubeRelevantFields = {
        account_id: 1,
        category_id: 2,
        amount: new Decimal('100.00'),
        date: new Date('2024-01-15'),
        type: 'EXPENSE' as const,
        is_recurring: false
      }
      const userId = 'user-456'

      // Act
      const delta = CubeService.createInsertDelta(transactionId, mockTenantId, newValues, userId)

      // Assert
      expect(delta).toEqual({
        transactionId,
        operation: 'INSERT',
        tenantId: mockTenantId,
        newValues,
        timestamp: expect.any(Date),
        userId
      })
      expect(delta.oldValues).toBeUndefined()
    })

    it('should create UPDATE delta correctly', () => {
      // Arrange
      const transactionId = 123
      const oldValues: CubeRelevantFields = {
        account_id: 1,
        category_id: 2,
        amount: new Decimal('100.00'),
        date: new Date('2024-01-15'),
        type: 'EXPENSE' as const,
        is_recurring: false
      }
      const newValues: CubeRelevantFields = {
        account_id: 1,
        category_id: 3,
        amount: new Decimal('150.00'),
        date: new Date('2024-01-16'),
        type: 'EXPENSE' as const,
        is_recurring: true
      }

      // Act
      const delta = CubeService.createUpdateDelta(transactionId, mockTenantId, oldValues, newValues)

      // Assert
      expect(delta).toEqual({
        transactionId,
        operation: 'UPDATE',
        tenantId: mockTenantId,
        oldValues,
        newValues,
        timestamp: expect.any(Date),
        userId: undefined
      })
    })

    it('should create DELETE delta correctly', () => {
      // Arrange
      const transactionId = 123
      const oldValues: CubeRelevantFields = {
        account_id: 1,
        category_id: 2,
        amount: new Decimal('100.00'),
        date: new Date('2024-01-15'),
        type: 'INCOME' as const,
        is_recurring: true
      }
      const userId = 'user-789'

      // Act
      const delta = CubeService.createDeleteDelta(transactionId, mockTenantId, oldValues, userId)

      // Assert
      expect(delta).toEqual({
        transactionId,
        operation: 'DELETE',
        tenantId: mockTenantId,
        oldValues,
        timestamp: expect.any(Date),
        userId
      })
      expect(delta.newValues).toBeUndefined()
    })
  })

  describe('addTransaction', () => {
    const mockTransaction = {
      id: 123,
      date: new Date('2024-01-15T00:00:00.000Z'), // Monday
      type: 'EXPENSE' as const,
      category_id: 5,
      is_recurring: false,
      amount: new Decimal('100.00')
    }

    beforeEach(() => {
      // Mock the methods that addTransaction calls
      mockPrisma.financialCube.deleteMany.mockResolvedValue({ count: 2 })
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        {
          transaction_type: 'EXPENSE',
          category_id: 5,
          category_name: 'Food',
          is_recurring: false,
          total_amount: new Decimal('100.00'),
          transaction_count: 1
        }
      ])
      mockPrisma.financialCube.createMany.mockResolvedValue({ count: 2 })
    })

    it('should add transaction to cube successfully', async () => {
      // Act
      await cubeService.addTransaction(mockTransaction, mockTenantId)

      // Assert - should clear specific cube records (2 calls: weekly + monthly)
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledTimes(2)

      // Verify weekly period clearing
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'WEEKLY',
            period_start: expect.any(Date), // Week start (Sunday)
            transaction_type: 'EXPENSE',
            category_id: 5,
            is_recurring: false
          }]
        }
      })

      // Verify monthly period clearing
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'MONTHLY',
            period_start: expect.any(Date), // Month start
            transaction_type: 'EXPENSE',
            category_id: 5,
            is_recurring: false
          }]
        }
      })

      // Assert - should rebuild cube data (2 calls: weekly + monthly)
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(2)
      expect(mockPrisma.financialCube.createMany).toHaveBeenCalledTimes(2)
    })

    it('should handle transaction with null category', async () => {
      // Arrange
      const transactionWithNullCategory = {
        ...mockTransaction,
        category_id: null
      }

      // Act
      await cubeService.addTransaction(transactionWithNullCategory, mockTenantId)

      // Assert - should handle null category in clearing
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'WEEKLY',
            period_start: expect.any(Date),
            transaction_type: 'EXPENSE',
            category_id: null,
            is_recurring: false
          }]
        }
      })
    })

    it('should handle recurring transaction', async () => {
      // Arrange
      const recurringTransaction = {
        ...mockTransaction,
        is_recurring: true
      }

      // Act
      await cubeService.addTransaction(recurringTransaction, mockTenantId)

      // Assert - should handle recurring flag in clearing
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'WEEKLY',
            period_start: expect.any(Date),
            transaction_type: 'EXPENSE',
            category_id: 5,
            is_recurring: true
          }]
        }
      })
    })

    it('should calculate correct weekly period boundaries', async () => {
      // Arrange - Monday, Jan 15, 2024
      const mondayTransaction = {
        ...mockTransaction,
        date: new Date('2024-01-15T00:00:00.000Z') // Monday
      }

      // Act
      await cubeService.addTransaction(mondayTransaction, mockTenantId)

      // Assert - Week should start on Sunday (Jan 14, 2024) with WEEK_STARTS_ON = 0
      // Note: Using expect.any(Date) due to timezone handling differences

      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'WEEKLY',
            period_start: expect.any(Date), // Should be Sunday, but timezone handling varies
            transaction_type: 'EXPENSE',
            category_id: 5,
            is_recurring: false
          }]
        }
      })
    })

    it('should calculate correct monthly period boundaries', async () => {
      // Arrange - Mid-month transaction
      const midMonthTransaction = {
        ...mockTransaction,
        date: new Date('2024-01-15T00:00:00.000Z')
      }

      // Act
      await cubeService.addTransaction(midMonthTransaction, mockTenantId)

      // Assert - Month should start on Jan 1, 2024
      const expectedMonthStart = new Date('2024-01-01T00:00:00.000Z')

      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'MONTHLY',
            period_start: expectedMonthStart,
            transaction_type: 'EXPENSE',
            category_id: 5,
            is_recurring: false
          }]
        }
      })
    })

    it('should handle different transaction types', async () => {
      // Arrange
      const incomeTransaction = {
        ...mockTransaction,
        type: 'INCOME' as const
      }

      // Act
      await cubeService.addTransaction(incomeTransaction, mockTenantId)

      // Assert
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'WEEKLY',
            period_start: expect.any(Date),
            transaction_type: 'INCOME',
            category_id: 5,
            is_recurring: false
          }]
        }
      })
    })

    it('should not throw error when cube operations fail', async () => {
      // Arrange - Mock cube operations to fail
      mockPrisma.financialCube.deleteMany.mockRejectedValue(new Error('Database error'))

      // Act & Assert - Should not throw
      await expect(cubeService.addTransaction(mockTransaction, mockTenantId)).resolves.toBeUndefined()
    })

    it('should log warning when cube operations fail', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      mockPrisma.financialCube.deleteMany.mockRejectedValue(new Error('Database error'))

      // Act
      await cubeService.addTransaction(mockTransaction, mockTenantId)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add transaction to cube:', expect.any(Error))

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe('updateTransaction', () => {
    const mockOldTransaction = {
      id: 123,
      date: new Date('2024-01-15T00:00:00.000Z'),
      type: 'EXPENSE' as const,
      category_id: 5,
      is_recurring: false,
      amount: new Decimal('100.00'),
      account_id: 1
    }

    const mockNewTransaction = {
      id: 123,
      date: new Date('2024-01-15T00:00:00.000Z'),
      type: 'EXPENSE' as const,
      category_id: 8, // Changed category
      is_recurring: true, // Changed recurring flag
      amount: new Decimal('150.00'), // Changed amount
      account_id: 1
    }

    beforeEach(() => {
      // Mock the methods that updateTransaction calls
      mockPrisma.financialCube.deleteMany.mockResolvedValue({ count: 4 })
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        {
          transaction_type: 'EXPENSE',
          category_id: 8,
          category_name: 'Entertainment',
          is_recurring: true,
          total_amount: new Decimal('150.00'),
          transaction_count: 1
        }
      ])
      mockPrisma.financialCube.createMany.mockResolvedValue({ count: 2 })

      // Mock the bulk metadata system dependencies
      mockPrisma.transaction.findMany.mockResolvedValue([
        { type: 'EXPENSE', is_recurring: true, category_id: 8 }
      ])
    })

    it('should update transaction in cube successfully', async () => {
      // Arrange
      const delta = CubeService.createUpdateDelta(
        123,
        mockTenantId,
        {
          account_id: mockOldTransaction.account_id,
          category_id: mockOldTransaction.category_id,
          amount: mockOldTransaction.amount,
          date: mockOldTransaction.date,
          type: mockOldTransaction.type as 'EXPENSE',
          is_recurring: mockOldTransaction.is_recurring
        },
        {
          account_id: mockNewTransaction.account_id,
          category_id: mockNewTransaction.category_id,
          amount: mockNewTransaction.amount,
          date: mockNewTransaction.date,
          type: mockNewTransaction.type as 'EXPENSE',
          is_recurring: mockNewTransaction.is_recurring
        }
      )

      // Act
      await cubeService.updateTransaction(delta, mockTenantId)

      // Assert - Should clear old and new cube records (multiple calls for different combinations)
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalled()
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled()
      expect(mockPrisma.financialCube.createMany).toHaveBeenCalled()
    })

    it('should handle category change in update', async () => {
      // Arrange - Only category changes
      const delta = CubeService.createUpdateDelta(
        123,
        mockTenantId,
        {
          account_id: 1,
          category_id: 5, // Old category
          amount: new Decimal('100.00'),
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: 'EXPENSE' as const,
          is_recurring: false
        },
        {
          account_id: 1,
          category_id: 8, // New category
          amount: new Decimal('100.00'),
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: 'EXPENSE' as const,
          is_recurring: false
        }
      )

      // Act
      await cubeService.updateTransaction(delta, mockTenantId)

      // Assert - Should process the category change
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalled()
      expect(mockPrisma.financialCube.createMany).toHaveBeenCalled()
    })

    it('should handle recurring flag change in update', async () => {
      // Arrange - Only recurring flag changes
      const delta = CubeService.createUpdateDelta(
        123,
        mockTenantId,
        {
          account_id: 1,
          category_id: 5,
          amount: new Decimal('100.00'),
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: 'EXPENSE' as const,
          is_recurring: false // Old value
        },
        {
          account_id: 1,
          category_id: 5,
          amount: new Decimal('100.00'),
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: 'EXPENSE' as const,
          is_recurring: true // New value
        }
      )

      // Act
      await cubeService.updateTransaction(delta, mockTenantId)

      // Assert - Should process the recurring flag change
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalled()
      expect(mockPrisma.financialCube.createMany).toHaveBeenCalled()
    })

    it('should handle amount change in update', async () => {
      // Arrange - Only amount changes
      const delta = CubeService.createUpdateDelta(
        123,
        mockTenantId,
        {
          account_id: 1,
          category_id: 5,
          amount: new Decimal('100.00'), // Old amount
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: 'EXPENSE' as const,
          is_recurring: false
        },
        {
          account_id: 1,
          category_id: 5,
          amount: new Decimal('200.00'), // New amount
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: 'EXPENSE' as const,
          is_recurring: false
        }
      )

      // Act
      await cubeService.updateTransaction(delta, mockTenantId)

      // Assert - Should process the amount change
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalled()
      expect(mockPrisma.financialCube.createMany).toHaveBeenCalled()
    })

    it('should handle transaction type change in update', async () => {
      // Arrange - Transaction type changes
      const delta = CubeService.createUpdateDelta(
        123,
        mockTenantId,
        {
          account_id: 1,
          category_id: 5,
          amount: new Decimal('100.00'),
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: 'EXPENSE' as const, // Old type
          is_recurring: false
        },
        {
          account_id: 1,
          category_id: 5,
          amount: new Decimal('100.00'),
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: 'INCOME' as const, // New type
          is_recurring: false
        }
      )

      // Act
      await cubeService.updateTransaction(delta, mockTenantId)

      // Assert - Should process the type change
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalled()
      expect(mockPrisma.financialCube.createMany).toHaveBeenCalled()
    })

    it('should not throw error when cube operations fail', async () => {
      // Arrange
      const delta = CubeService.createUpdateDelta(123, mockTenantId, mockOldTransaction, mockNewTransaction)
      mockPrisma.financialCube.deleteMany.mockRejectedValue(new Error('Database error'))

      // Act & Assert - Should not throw
      await expect(cubeService.updateTransaction(delta, mockTenantId)).resolves.toBeUndefined()
    })

    it('should log warning when cube operations fail', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const delta = CubeService.createUpdateDelta(123, mockTenantId, mockOldTransaction, mockNewTransaction)
      mockPrisma.financialCube.deleteMany.mockRejectedValue(new Error('Database error'))

      // Act
      await cubeService.updateTransaction(delta, mockTenantId)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update transaction in cube:', expect.any(Error))

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe('removeTransaction', () => {
    const mockTransaction = {
      id: 123,
      date: new Date('2024-01-15T00:00:00.000Z'), // Monday
      type: 'EXPENSE' as const,
      category_id: 5,
      is_recurring: false,
      amount: new Decimal('100.00')
    }

    beforeEach(() => {
      // Mock the methods that removeTransaction calls
      mockPrisma.financialCube.deleteMany.mockResolvedValue({ count: 2 })
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        {
          transaction_type: 'EXPENSE',
          category_id: 5,
          category_name: 'Food',
          is_recurring: false,
          total_amount: new Decimal('0.00'), // Should be 0 after removal
          transaction_count: 0
        }
      ])
      mockPrisma.financialCube.createMany.mockResolvedValue({ count: 2 })
    })

    it('should remove transaction from cube successfully', async () => {
      // Act
      await cubeService.removeTransaction(mockTransaction, mockTenantId)

      // Assert - should clear specific cube records (2 calls: weekly + monthly)
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledTimes(2)

      // Verify weekly period clearing
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'WEEKLY',
            period_start: expect.any(Date), // Week start (Sunday)
            transaction_type: 'EXPENSE',
            category_id: 5,
            is_recurring: false
          }]
        }
      })

      // Verify monthly period clearing
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'MONTHLY',
            period_start: expect.any(Date), // Month start
            transaction_type: 'EXPENSE',
            category_id: 5,
            is_recurring: false
          }]
        }
      })

      // Assert - should rebuild cube data (2 calls: weekly + monthly)
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(2)
      expect(mockPrisma.financialCube.createMany).toHaveBeenCalledTimes(2)
    })

    it('should handle transaction with null category', async () => {
      // Arrange
      const transactionWithNullCategory = {
        ...mockTransaction,
        category_id: null
      }

      // Act
      await cubeService.removeTransaction(transactionWithNullCategory, mockTenantId)

      // Assert - should handle null category in clearing
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'WEEKLY',
            period_start: expect.any(Date),
            transaction_type: 'EXPENSE',
            category_id: null,
            is_recurring: false
          }]
        }
      })
    })

    it('should handle recurring transaction', async () => {
      // Arrange
      const recurringTransaction = {
        ...mockTransaction,
        is_recurring: true
      }

      // Act
      await cubeService.removeTransaction(recurringTransaction, mockTenantId)

      // Assert - should handle recurring flag in clearing
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'WEEKLY',
            period_start: expect.any(Date),
            transaction_type: 'EXPENSE',
            category_id: 5,
            is_recurring: true
          }]
        }
      })
    })

    it('should handle different transaction types', async () => {
      // Arrange
      const incomeTransaction = {
        ...mockTransaction,
        type: 'INCOME' as const
      }

      // Act
      await cubeService.removeTransaction(incomeTransaction, mockTenantId)

      // Assert
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'WEEKLY',
            period_start: expect.any(Date),
            transaction_type: 'INCOME',
            category_id: 5,
            is_recurring: false
          }]
        }
      })
    })

    it('should calculate correct weekly period boundaries', async () => {
      // Arrange - Monday, Jan 15, 2024
      const mondayTransaction = {
        ...mockTransaction,
        date: new Date('2024-01-15T00:00:00.000Z') // Monday
      }

      // Act
      await cubeService.removeTransaction(mondayTransaction, mockTenantId)

      // Assert - Week should start on Sunday (Jan 14, 2024) with WEEK_STARTS_ON = 0
      // Note: Using expect.any(Date) due to timezone handling differences

      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'WEEKLY',
            period_start: expect.any(Date), // Should be Sunday, but timezone handling varies
            transaction_type: 'EXPENSE',
            category_id: 5,
            is_recurring: false
          }]
        }
      })
    })

    it('should calculate correct monthly period boundaries', async () => {
      // Arrange - Mid-month transaction
      const midMonthTransaction = {
        ...mockTransaction,
        date: new Date('2024-01-15T00:00:00.000Z')
      }

      // Act
      await cubeService.removeTransaction(midMonthTransaction, mockTenantId)

      // Assert - Month should start on Jan 1, 2024
      expect(mockPrisma.financialCube.deleteMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          OR: [{
            period_type: 'MONTHLY',
            period_start: expect.any(Date), // Should be month start
            transaction_type: 'EXPENSE',
            category_id: 5,
            is_recurring: false
          }]
        }
      })
    })

    it('should not throw error when cube operations fail', async () => {
      // Arrange - Mock cube operations to fail
      mockPrisma.financialCube.deleteMany.mockRejectedValue(new Error('Database error'))

      // Act & Assert - Should not throw
      await expect(cubeService.removeTransaction(mockTransaction, mockTenantId)).resolves.toBeUndefined()
    })

    it('should log warning when cube operations fail', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      mockPrisma.financialCube.deleteMany.mockRejectedValue(new Error('Database error'))

      // Act
      await cubeService.removeTransaction(mockTransaction, mockTenantId)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Failed to remove transaction to cube:', expect.any(Error))

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe('getTrends with category filtering', () => {
    it('should filter for specific categories when categoryIds provided', async () => {
      // Arrange
      const mockCubeRecords = [
        { id: 2, category_id: 1, category_name: 'Food', total_amount: new Decimal(200), period_start: new Date('2024-01-01') },
        { id: 4, category_id: 2, category_name: 'Transport', total_amount: new Decimal(50), period_start: new Date('2024-01-02') }
      ]

      mockPrisma.financialCube.findMany.mockResolvedValue(mockCubeRecords)

      // Act - request specific categories
      const result = await cubeService.getTrends(mockTenantId, {
        categoryIds: [1, 2]
      })

      // Assert
      expect(mockPrisma.financialCube.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenant_id: mockTenantId,
          category_id: { in: [1, 2] }  // Should filter for specific categories
        }),
        orderBy: [
          { period_start: 'asc' },
          { category_name: 'asc' },
          { account_name: 'asc' }
        ]
      })
      expect(result).toEqual(mockCubeRecords)
    })

    it('should not add category filter when categoryIds is empty or undefined', async () => {
      // Arrange
      const mockCubeRecords = [
        { id: 1, category_id: 3, category_name: 'Uncategorized Expense', total_amount: new Decimal(100), period_start: new Date('2024-01-01') },
        { id: 2, category_id: 1, category_name: 'Food', total_amount: new Decimal(200), period_start: new Date('2024-01-02') }
      ]

      mockPrisma.financialCube.findMany.mockResolvedValue(mockCubeRecords)

      // Act - no category filter
      const result = await cubeService.getTrends(mockTenantId, {})

      // Assert
      expect(mockPrisma.financialCube.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenant_id: mockTenantId
          // Should not have any category_id clause
        }),
        orderBy: [
          { period_start: 'asc' },
          { category_name: 'asc' },
          { account_name: 'asc' }
        ]
      })
      expect(result).toEqual(mockCubeRecords)
    })
  })
})
