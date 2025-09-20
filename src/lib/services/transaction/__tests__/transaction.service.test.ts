// Mock the dependencies first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      createMany: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { TransactionService } from '../transaction.service'
import { prisma } from '@/lib/prisma'
import { createUTCDate } from '@/lib/utils/date-utils'

// Get the mocked prisma
const mockPrisma = prisma as any

describe('TransactionService', () => {
  const mockTenantId = 'tenant-123'
  const mockTransactionWithRelations = {
    id: 1,
    tenant_id: mockTenantId,
    account_id: 1,
    category_id: 1,
    amount: 100.50,
    description: 'Test transaction',
    merchant: null,
    date: createUTCDate(2025, 0, 1),
    type: 'EXPENSE' as const,
    is_recurring: false,
    created_at: createUTCDate(2025, 0, 1),
    updated_at: createUTCDate(2025, 0, 1),
    account: {
      id: 1,
      name: 'Test Account',
      type: 'CHECKING',
      balance: 1000,
      balance_date: createUTCDate(2025, 0, 1),
      color: '#blue',
      is_active: true,
      tenant_id: mockTenantId,
      created_at: createUTCDate(2025, 0, 1),
      updated_at: createUTCDate(2025, 0, 1),
    },
    category: {
      id: 1,
      name: 'Test Category',
      type: 'EXPENSE',
      color: '#red',
      tenant_id: mockTenantId,
      created_at: createUTCDate(2025, 0, 1),
      updated_at: createUTCDate(2025, 0, 1),
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTransactions', () => {
    it('should return transactions for a tenant', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([mockTransactionWithRelations])
      mockPrisma.transaction.count.mockResolvedValue(1)

      const result = await TransactionService.getTransactions(mockTenantId)

      expect(result).toEqual({
        transactions: [mockTransactionWithRelations],
        total: 1,
        page: 1,
        totalPages: 1
      })
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { tenant_id: mockTenantId },
        include: {
          account: true,
          category: true
        },
        orderBy: { date: 'desc' },
        skip: 0,
        take: 50
      })
    })

    it('should apply filters correctly', async () => {
      const filters = {
        account_id: 1,
        category_id: 2,
        type: 'INCOME' as const,
        is_recurring: true,
        date_from: createUTCDate(2025, 0, 1),
        date_to: createUTCDate(2025, 0, 31),
        search: 'salary'
      }

      mockPrisma.transaction.findMany.mockResolvedValue([])

      await TransactionService.getTransactions(mockTenantId, filters)

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          account_id: 1,
          category_id: 2,
          type: 'INCOME',
          is_recurring: true,
          date: {
            gte: filters.date_from,
            lte: filters.date_to
          },
          description: {
            contains: 'salary',
            mode: 'insensitive'
          }
        },
        include: {
          account: true,
          category: true
        },
        orderBy: { date: 'desc' },
        skip: 0,
        take: 50
      })
    })

    it('should throw error for invalid tenant ID', async () => {
      await expect(TransactionService.getTransactions('')).rejects.toThrow('Valid tenant ID is required')
    })
  })

  describe('getTransactionById', () => {
    it('should return transaction when found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransactionWithRelations)

      const result = await TransactionService.getTransactionById(1, mockTenantId)

      expect(result).toEqual(mockTransactionWithRelations)
      expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          tenant_id: mockTenantId
        },
        include: {
          account: true,
          category: true
        }
      })
    })

    it('should return null when transaction not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null)

      const result = await TransactionService.getTransactionById(999, mockTenantId)

      expect(result).toBeNull()
    })
  })

  describe('createTransaction', () => {
    const validTransactionData = {
      account_id: 1,
      category_id: 1,
      amount: 100.50,
      description: 'Test transaction',
      date: createUTCDate(2025, 0, 1),
      type: 'EXPENSE' as const,
      is_recurring: false
    }

    it('should create transaction successfully', async () => {
      // Mock account validation
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 1,
        tenant_id: mockTenantId,
        name: 'Test Account',
        type: 'CHECKING',
        balance: 1000,
        balance_date: createUTCDate(2025, 0, 1),
        color: '#blue',
        is_active: true,
        created_at: createUTCDate(2025, 0, 1),
        updated_at: createUTCDate(2025, 0, 1),
      })

      // Mock category validation
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 1,
        tenant_id: mockTenantId,
        name: 'Test Category',
        type: 'EXPENSE',
        color: '#red',
        created_at: createUTCDate(2025, 0, 1),
        updated_at: createUTCDate(2025, 0, 1),
      })

      mockPrisma.transaction.create.mockResolvedValue(mockTransactionWithRelations)

      const result = await TransactionService.createTransaction(mockTenantId, validTransactionData)

      expect(result).toEqual(mockTransactionWithRelations)
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: {
          tenant_id: mockTenantId,
          account_id: 1,
          category_id: 1,
          amount: 100.50,
          description: 'Test transaction',
          merchant: 'Test Transaction',
          date: createUTCDate(2025, 0, 1),
          type: 'EXPENSE',
          is_recurring: false
        },
        include: {
          account: true,
          category: true
        }
      })
    })

    it('should throw error if account does not belong to tenant', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null)

      await expect(TransactionService.createTransaction(mockTenantId, validTransactionData))
        .rejects.toThrow('Account not found or does not belong to tenant')
    })

    it('should throw error if category does not belong to tenant', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({ id: 1, tenant_id: mockTenantId } as any)
      mockPrisma.category.findFirst.mockResolvedValue(null)

      await expect(TransactionService.createTransaction(mockTenantId, validTransactionData))
        .rejects.toThrow('Category not found or does not belong to tenant')
    })

    it('should create transaction without category', async () => {
      const dataWithoutCategory = { ...validTransactionData, category_id: undefined }
      const mockDefaultCategory = { id: 999, name: 'Uncategorized Expense', type: 'EXPENSE', tenant_id: mockTenantId }

      mockPrisma.account.findFirst.mockResolvedValue({ id: 1, tenant_id: mockTenantId } as any)
      // Mock the getDefaultCategoryId flow: findUnique returns null, then create returns the category
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.create.mockResolvedValue(mockDefaultCategory)
      mockPrisma.transaction.create.mockResolvedValue({
        ...mockTransactionWithRelations,
        category_id: 999
      })

      await TransactionService.createTransaction(mockTenantId, dataWithoutCategory)

      // Should call findUnique to check if default category exists
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: {
          tenant_id_name_type: {
            tenant_id: mockTenantId,
            name: 'Uncategorized Expense',
            type: 'EXPENSE'
          }
        }
      })

      // Should call create to make the default category
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          tenant_id: mockTenantId,
          name: 'Uncategorized Expense',
          type: 'EXPENSE',
          color: '#6B7280'
        }
      })

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: {
          tenant_id: mockTenantId,
          account_id: 1,
          category_id: 999, // Should use default category ID
          amount: 100.50,
          description: 'Test transaction',
          merchant: 'Test Transaction',
          date: createUTCDate(2025, 0, 1),
          type: 'EXPENSE',
          is_recurring: false
        },
        include: {
          account: true,
          category: true
        }
      })
    })
  })

  describe('updateTransaction', () => {
    const updateData = {
      amount: 200.75,
      description: 'Updated transaction',
      is_recurring: true
    }

    it('should update transaction successfully', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransactionWithRelations)
      mockPrisma.transaction.update.mockResolvedValue({
        ...mockTransactionWithRelations,
        ...updateData,
        updated_at: createUTCDate(2025, 0, 1)
      })

      const result = await TransactionService.updateTransaction(1, mockTenantId, updateData)

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...updateData,
          merchant: 'Updated Transaction',
          updated_at: createUTCDate(2025, 8, 20)
        },
        include: {
          account: true,
          category: true
        }
      })
    })

    it('should throw error if transaction does not exist', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null)

      await expect(TransactionService.updateTransaction(999, mockTenantId, updateData))
        .rejects.toThrow('Transaction not found or does not belong to tenant')
    })

    it('should validate account when updating account_id', async () => {
      const updateWithAccount = { account_id: 2 }

      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransactionWithRelations)
      mockPrisma.account.findFirst.mockResolvedValue(null)

      await expect(TransactionService.updateTransaction(1, mockTenantId, updateWithAccount))
        .rejects.toThrow('Account not found or does not belong to tenant')
    })
  })

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransactionWithRelations)
      mockPrisma.transaction.delete.mockResolvedValue(mockTransactionWithRelations)

      await TransactionService.deleteTransaction(1, mockTenantId)

      expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })

    it('should throw error if transaction does not exist', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null)

      await expect(TransactionService.deleteTransaction(999, mockTenantId))
        .rejects.toThrow('Transaction not found or does not belong to tenant')
    })
  })

  describe('getTransactionsByAccount', () => {
    it('should return transactions for specific account', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([mockTransactionWithRelations])
      mockPrisma.transaction.count.mockResolvedValue(1)

      const result = await TransactionService.getTransactionsByAccount(1, mockTenantId)

      expect(result).toEqual([mockTransactionWithRelations])
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          account_id: 1
        },
        include: {
          account: true,
          category: true
        },
        orderBy: { date: 'desc' },
        skip: 0,
        take: 50
      })
    })
  })

  describe('getRecurringTransactions', () => {
    it('should return only recurring transactions', async () => {
      const recurringTransaction = { ...mockTransactionWithRelations, is_recurring: true }
      mockPrisma.transaction.findMany.mockResolvedValue([recurringTransaction])
      mockPrisma.transaction.count.mockResolvedValue(1)

      const result = await TransactionService.getRecurringTransactions(mockTenantId)

      expect(result).toEqual([recurringTransaction])
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          is_recurring: true
        },
        include: {
          account: true,
          category: true
        },
        orderBy: { date: 'desc' },
        skip: 0,
        take: 50
      })
    })
  })

  describe('error handling', () => {
    it('should handle database errors in getTransactions', async () => {
      mockPrisma.transaction.findMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(TransactionService.getTransactions(mockTenantId))
        .rejects.toThrow('Database connection failed')
    })

    it('should handle database errors in createTransaction', async () => {
      mockPrisma.account.findFirst.mockRejectedValue(new Error('Database connection failed'))

      await expect(TransactionService.createTransaction(mockTenantId, {
        account_id: 1,
        amount: 100,
        description: 'Test',
        date: createUTCDate(2025, 0, 1),
        type: 'EXPENSE'
      })).rejects.toThrow('Database connection failed')
    })
  })
})
