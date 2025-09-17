// Mock Prisma first
const mockPrisma = {
  financialCube: {
    count: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    createMany: jest.fn(),
    groupBy: jest.fn()
  },
  transaction: {
    findFirst: jest.fn(),
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
        type: 'EXPENSE',
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
        type: 'EXPENSE',
        is_recurring: false
      }
      const newValues: CubeRelevantFields = {
        account_id: 1,
        category_id: 3,
        amount: new Decimal('150.00'),
        date: new Date('2024-01-16'),
        type: 'EXPENSE',
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
        type: 'INCOME',
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
})
