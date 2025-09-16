// Mock the dependencies first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    account: {
      findFirst: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

import { AccountBalanceHistoryService } from '../account-balance-history.service'
import { prisma } from '@/lib/prisma'
import { createUTCDate } from '@/lib/utils/date-utils'

// Get the mocked prisma
const mockPrisma = prisma as any

describe('AccountBalanceHistoryService - MVP Accounting Compliance', () => {
  let service: AccountBalanceHistoryService
  const mockTenantId = 123
  const mockAccountId = 456

  const mockAccount = {
    id: mockAccountId,
    tenant_id: mockTenantId,
    name: 'Test Account',
    type: 'CHECKING',
    balance: 1000,
    created_at: new Date(),
    updated_at: new Date(),
  }

  beforeEach(() => {
    service = new AccountBalanceHistoryService()
    jest.clearAllMocks()
  })

  describe('Balance Calculation Methods', () => {
    it('should use direct transaction sum when no balance anchors exist', async () => {
      // Mock account validation
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)

      // Mock transactions with proper accounting signs
      const mockTransactions = [
        {
          id: 1,
          tenant_id: mockTenantId,
          account_id: mockAccountId,
          amount: 5000,
          type: 'INCOME',
          date: '2024-01-01',
          description: 'Salary',
          created_at: new Date(),
        },
        {
          id: 2,
          tenant_id: mockTenantId,
          account_id: mockAccountId,
          amount: 1200,
          type: 'EXPENSE',
          date: '2024-01-02',
          description: 'Rent',
          created_at: new Date(),
        },
        {
          id: 3,
          tenant_id: mockTenantId,
          account_id: mockAccountId,
          amount: -500,
          type: 'TRANSFER',
          date: '2024-01-03',
          description: 'Transfer out',
          created_at: new Date(),
        },
      ]

      // Mock the transaction queries
      mockPrisma.transaction.findMany
        .mockResolvedValueOnce(mockTransactions) // For date range query
        .mockResolvedValueOnce(mockTransactions.slice(0, 1)) // For balance at 2024-01-01
        .mockResolvedValueOnce(mockTransactions.slice(0, 2)) // For balance at 2024-01-02
        .mockResolvedValueOnce(mockTransactions) // For balance at 2024-01-03

      mockPrisma.transaction.count.mockResolvedValue(3)

      const result = await service.getAccountBalanceHistory(
        mockTenantId,
        mockAccountId,
        '2024-01-01',
        '2024-01-03'
      )

      expect(result).toHaveLength(3)

      // Verify balance calculations follow MVP accounting rules
      expect(result[0]).toEqual({
        date: '2024-01-01',
        balance: 5000, // +5000 (INCOME)
        netAmount: 5000,
        calculationMethod: 'direct',
        anchorUsed: undefined,
      })

      expect(result[1]).toEqual({
        date: '2024-01-02',
        balance: 3800, // +5000 (INCOME) - 1200 (EXPENSE)
        netAmount: -1200,
        calculationMethod: 'direct',
        anchorUsed: undefined,
      })

      expect(result[2]).toEqual({
        date: '2024-01-03',
        balance: 3300, // +5000 - 1200 - 500 (TRANSFER already signed)
        netAmount: -500,
        calculationMethod: 'direct',
        anchorUsed: undefined,
      })
    })

    it('should maintain data integrity: sum(transactions) = account_balance', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)

      const mockTransactions = [
        { id: 1, tenant_id: mockTenantId, account_id: mockAccountId, amount: 1000, type: 'INCOME', date: '2024-01-01', description: 'Income', created_at: new Date() },
        { id: 2, tenant_id: mockTenantId, account_id: mockAccountId, amount: 300, type: 'EXPENSE', date: '2024-01-02', description: 'Expense', created_at: new Date() },
        { id: 3, tenant_id: mockTenantId, account_id: mockAccountId, amount: 200, type: 'TRANSFER', date: '2024-01-03', description: 'Transfer in', created_at: new Date() },
      ]

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce(mockTransactions)
        .mockResolvedValueOnce([mockTransactions[0]])
        .mockResolvedValueOnce(mockTransactions.slice(0, 2))
        .mockResolvedValueOnce(mockTransactions)

      mockPrisma.transaction.count.mockResolvedValue(3)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-03')

      // Calculate expected balance: +1000 (INCOME) - 300 (EXPENSE) + 200 (TRANSFER) = 900
      const expectedFinalBalance = 1000 - 300 + 200
      expect(result[result.length - 1].balance).toBe(expectedFinalBalance)
    })
  })

  describe('Transaction Impact Calculations', () => {
    beforeEach(() => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)
    })

    it('should handle INCOME transactions: +transaction.amount', async () => {
      const incomeTransaction = {
        id: 1,
        tenant_id: mockTenantId,
        account_id: mockAccountId,
        amount: 2500,
        type: 'INCOME',
        date: '2024-01-01',
        description: 'Salary',
        created_at: new Date(),
      }

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([incomeTransaction])
        .mockResolvedValueOnce([incomeTransaction])

      mockPrisma.transaction.count.mockResolvedValue(1)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-01')

      expect(result[0].balance).toBe(2500) // Positive impact
      expect(result[0].netAmount).toBe(2500)
    })

    it('should handle EXPENSE transactions: -transaction.amount', async () => {
      const expenseTransaction = {
        id: 1,
        tenant_id: mockTenantId,
        account_id: mockAccountId,
        amount: 800,
        type: 'EXPENSE',
        date: '2024-01-01',
        description: 'Groceries',
        created_at: new Date(),
      }

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([expenseTransaction])
        .mockResolvedValueOnce([expenseTransaction])

      mockPrisma.transaction.count.mockResolvedValue(1)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-01')

      expect(result[0].balance).toBe(-800) // Negative impact
      expect(result[0].netAmount).toBe(-800)
    })

    it('should handle TRANSFER transactions: transaction.amount (already signed)', async () => {
      const transferTransactions = [
        {
          id: 1,
          tenant_id: mockTenantId,
          account_id: mockAccountId,
          amount: -500, // Outgoing transfer (negative)
          type: 'TRANSFER',
          date: '2024-01-01',
          description: 'Transfer out',
          created_at: new Date(),
        },
        {
          id: 2,
          tenant_id: mockTenantId,
          account_id: mockAccountId,
          amount: 300, // Incoming transfer (positive)
          type: 'TRANSFER',
          date: '2024-01-02',
          description: 'Transfer in',
          created_at: new Date(),
        },
      ]

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce(transferTransactions)
        .mockResolvedValueOnce([transferTransactions[0]])
        .mockResolvedValueOnce(transferTransactions)

      mockPrisma.transaction.count.mockResolvedValue(2)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-02')

      expect(result[0].balance).toBe(-500) // Outgoing transfer
      expect(result[0].netAmount).toBe(-500)
      expect(result[1].balance).toBe(-200) // -500 + 300
      expect(result[1].netAmount).toBe(300)
    })

    it('should never use Math.abs() in calculations (display only)', async () => {
      const negativeTransactions = [
        { id: 1, tenant_id: mockTenantId, account_id: mockAccountId, amount: 1000, type: 'EXPENSE', date: '2024-01-01', description: 'Large expense', created_at: new Date() },
        { id: 2, tenant_id: mockTenantId, account_id: mockAccountId, amount: -500, type: 'TRANSFER', date: '2024-01-02', description: 'Transfer out', created_at: new Date() },
      ]

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce(negativeTransactions)
        .mockResolvedValueOnce([negativeTransactions[0]])
        .mockResolvedValueOnce(negativeTransactions)

      mockPrisma.transaction.count.mockResolvedValue(2)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-02')

      // Balance should be negative and preserved
      expect(result[0].balance).toBe(-1000) // -1000 (EXPENSE)
      expect(result[1].balance).toBe(-1500) // -1000 - 500 (TRANSFER)

      // Verify no Math.abs() was used (negative values preserved)
      expect(result[0].balance).toBeLessThan(0)
      expect(result[1].balance).toBeLessThan(0)
    })

    it('should preserve transaction signs throughout calculations', async () => {
      const mixedTransactions = [
        { id: 1, tenant_id: mockTenantId, account_id: mockAccountId, amount: 5000, type: 'INCOME', date: '2024-01-01', description: 'Salary', created_at: new Date() },
        { id: 2, tenant_id: mockTenantId, account_id: mockAccountId, amount: 2000, type: 'EXPENSE', date: '2024-01-01', description: 'Rent', created_at: new Date() },
        { id: 3, tenant_id: mockTenantId, account_id: mockAccountId, amount: -300, type: 'TRANSFER', date: '2024-01-01', description: 'Transfer out', created_at: new Date() },
        { id: 4, tenant_id: mockTenantId, account_id: mockAccountId, amount: 150, type: 'TRANSFER', date: '2024-01-01', description: 'Transfer in', created_at: new Date() },
      ]

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce(mixedTransactions)
        .mockResolvedValueOnce(mixedTransactions)

      mockPrisma.transaction.count.mockResolvedValue(4)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-01')

      // Expected calculation: +5000 (INCOME) - 2000 (EXPENSE) - 300 (TRANSFER out) + 150 (TRANSFER in) = 2850
      expect(result[0].balance).toBe(2850)
      expect(result[0].netAmount).toBe(2850) // All transactions on same day
    })
  })

  describe('Date Range Processing', () => {
    beforeEach(() => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)
    })

    it('should filter transactions by date range correctly', async () => {
      const allTransactions = [
        { id: 1, tenant_id: mockTenantId, account_id: mockAccountId, amount: 1000, type: 'INCOME', date: '2023-12-31', description: 'Before range', created_at: new Date() },
        { id: 2, tenant_id: mockTenantId, account_id: mockAccountId, amount: 500, type: 'INCOME', date: '2024-01-01', description: 'Start date', created_at: new Date() },
        { id: 3, tenant_id: mockTenantId, account_id: mockAccountId, amount: 200, type: 'EXPENSE', date: '2024-01-02', description: 'In range', created_at: new Date() },
        { id: 4, tenant_id: mockTenantId, account_id: mockAccountId, amount: 300, type: 'INCOME', date: '2024-01-03', description: 'End date', created_at: new Date() },
        { id: 5, tenant_id: mockTenantId, account_id: mockAccountId, amount: 100, type: 'EXPENSE', date: '2024-01-04', description: 'After range', created_at: new Date() },
      ]

      const inRangeTransactions = allTransactions.slice(1, 4) // 2024-01-01 to 2024-01-03

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce(inRangeTransactions) // For date range query
        .mockResolvedValueOnce([inRangeTransactions[0]]) // For 2024-01-01
        .mockResolvedValueOnce(inRangeTransactions.slice(0, 2)) // For 2024-01-02
        .mockResolvedValueOnce(inRangeTransactions) // For 2024-01-03

      mockPrisma.transaction.count.mockResolvedValue(3)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-03')

      expect(result).toHaveLength(3)
      expect(result[0].date).toBe('2024-01-01')
      expect(result[1].date).toBe('2024-01-02')
      expect(result[2].date).toBe('2024-01-03')
    })

    it('should handle edge cases: same start/end date, empty ranges', async () => {
      const singleDayTransaction = {
        id: 1,
        tenant_id: mockTenantId,
        account_id: mockAccountId,
        amount: 1000,
        type: 'INCOME',
        date: '2024-01-01',
        description: 'Single day',
        created_at: new Date(),
      }

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([singleDayTransaction])
        .mockResolvedValueOnce([singleDayTransaction])

      mockPrisma.transaction.count.mockResolvedValue(1)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-01')

      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2024-01-01')
      expect(result[0].balance).toBe(1000)
    })

    it('should use default date range (last 30 days) when no dates provided', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([])
      mockPrisma.transaction.count.mockResolvedValue(0)

      await service.getAccountBalanceHistory(mockTenantId, mockAccountId)

      // Verify that findMany was called with a date range
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(String),
              lte: expect.any(String),
            })
          })
        })
      )
    })
  })

  describe('Data Integrity Validation', () => {
    beforeEach(() => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)
    })

    it('should handle accounts with no transactions', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([])
      mockPrisma.transaction.count.mockResolvedValue(0)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-31')

      expect(result).toEqual([])
    })

    it('should maintain precision for currency calculations (2 decimal places)', async () => {
      const precisionTransactions = [
        { id: 1, tenant_id: mockTenantId, account_id: mockAccountId, amount: 100.33, type: 'INCOME', date: '2024-01-01', description: 'Precise income', created_at: new Date() },
        { id: 2, tenant_id: mockTenantId, account_id: mockAccountId, amount: 50.67, type: 'EXPENSE', date: '2024-01-01', description: 'Precise expense', created_at: new Date() },
      ]

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce(precisionTransactions)
        .mockResolvedValueOnce(precisionTransactions)

      mockPrisma.transaction.count.mockResolvedValue(2)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-01')

      // Expected: 100.33 - 50.67 = 49.66
      expect(result[0].balance).toBe(49.66)
      expect(result[0].netAmount).toBe(49.66)
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent account IDs gracefully', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null)

      await expect(
        service.getAccountBalanceHistory(mockTenantId, 999, '2024-01-01', '2024-01-31')
      ).rejects.toThrow('Account 999 not found or access denied')
    })

    it('should validate tenant access permissions', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null) // Simulates wrong tenant

      await expect(
        service.getAccountBalanceHistory(999, mockAccountId, '2024-01-01', '2024-01-31')
      ).rejects.toThrow('Account 456 not found or access denied')
    })

    it('should handle database connection failures', async () => {
      mockPrisma.account.findFirst.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-31')
      ).rejects.toThrow()
    })
  })

  describe('Service Method Tests', () => {
    beforeEach(() => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)
    })

    it('should return chronologically sorted balance history', async () => {
      const unorderedTransactions = [
        { id: 3, tenant_id: mockTenantId, account_id: mockAccountId, amount: 300, type: 'INCOME', date: '2024-01-03', description: 'Third', created_at: new Date() },
        { id: 1, tenant_id: mockTenantId, account_id: mockAccountId, amount: 100, type: 'INCOME', date: '2024-01-01', description: 'First', created_at: new Date() },
        { id: 2, tenant_id: mockTenantId, account_id: mockAccountId, amount: 200, type: 'INCOME', date: '2024-01-02', description: 'Second', created_at: new Date() },
      ]

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce(unorderedTransactions)
        .mockResolvedValueOnce([unorderedTransactions[1]]) // 2024-01-01
        .mockResolvedValueOnce(unorderedTransactions.slice(1)) // 2024-01-02
        .mockResolvedValueOnce(unorderedTransactions) // 2024-01-03

      mockPrisma.transaction.count.mockResolvedValue(3)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-03')

      expect(result).toHaveLength(3)
      expect(result[0].date).toBe('2024-01-01')
      expect(result[1].date).toBe('2024-01-02')
      expect(result[2].date).toBe('2024-01-03')
    })

    it('should calculate daily net amounts correctly', async () => {
      const multiTransactionDay = [
        { id: 1, tenant_id: mockTenantId, account_id: mockAccountId, amount: 1000, type: 'INCOME', date: '2024-01-01', description: 'Income 1', created_at: new Date() },
        { id: 2, tenant_id: mockTenantId, account_id: mockAccountId, amount: 500, type: 'INCOME', date: '2024-01-01', description: 'Income 2', created_at: new Date() },
        { id: 3, tenant_id: mockTenantId, account_id: mockAccountId, amount: 200, type: 'EXPENSE', date: '2024-01-01', description: 'Expense 1', created_at: new Date() },
        { id: 4, tenant_id: mockTenantId, account_id: mockAccountId, amount: -100, type: 'TRANSFER', date: '2024-01-01', description: 'Transfer out', created_at: new Date() },
      ]

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce(multiTransactionDay)
        .mockResolvedValueOnce(multiTransactionDay)

      mockPrisma.transaction.count.mockResolvedValue(4)

      const result = await service.getAccountBalanceHistory(mockTenantId, mockAccountId, '2024-01-01', '2024-01-01')

      // Expected net: +1000 + 500 - 200 - 100 = 1200
      expect(result[0].netAmount).toBe(1200)
      expect(result[0].balance).toBe(1200)
    })
  })

  describe('getAccountBalanceSummary', () => {
    beforeEach(() => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)
    })

    it('should calculate starting/ending balances accurately', async () => {
      const transactions = [
        { id: 1, tenant_id: mockTenantId, account_id: mockAccountId, amount: 1000, type: 'INCOME', date: '2024-01-01', description: 'Start', created_at: new Date() },
        { id: 2, tenant_id: mockTenantId, account_id: mockAccountId, amount: 500, type: 'EXPENSE', date: '2024-01-02', description: 'Middle', created_at: new Date() },
        { id: 3, tenant_id: mockTenantId, account_id: mockAccountId, amount: 200, type: 'INCOME', date: '2024-01-03', description: 'End', created_at: new Date() },
      ]

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce(transactions) // For balance history
        .mockResolvedValueOnce([transactions[0]]) // For 2024-01-01 balance
        .mockResolvedValueOnce(transactions.slice(0, 2)) // For 2024-01-02 balance
        .mockResolvedValueOnce(transactions) // For 2024-01-03 balance

      mockPrisma.transaction.count.mockResolvedValue(3)

      const summary = await service.getAccountBalanceSummary(mockTenantId, mockAccountId, '2024-01-01', '2024-01-03')

      expect(summary.startingBalance).toBe(1000) // First day balance
      expect(summary.endingBalance).toBe(700) // Final balance: 1000 - 500 + 200
      expect(summary.netChange).toBe(-300) // 700 - 1000
      expect(summary.totalTransactions).toBe(3)
    })

    it('should track calculation methods used', async () => {
      // This test will be more relevant when balance anchors are implemented
      // For now, all calculations use 'direct' method
      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValue([])

      mockPrisma.transaction.count.mockResolvedValue(0)

      const summary = await service.getAccountBalanceSummary(mockTenantId, mockAccountId, '2024-01-01', '2024-01-03')

      expect(summary.calculationMethods.direct).toBe(0)
      expect(summary.calculationMethods.anchorBased).toBe(0)
    })
  })
})
