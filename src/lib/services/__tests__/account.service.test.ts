// Mock the dependencies first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { AccountService } from '../account.service'
import { prisma } from '@/lib/prisma'

// Get the mocked prisma
const mockPrisma = prisma as any

describe('AccountService', () => {
  const mockTenantId = 'tenant-123'
  const mockAccount = {
    id: 1,
    tenant_id: mockTenantId,
    name: 'Test Account',
    type: 'CHECKING',
    balance: 1000.50,
    balance_date: new Date('2025-01-01'),
    color: '#blue',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAccounts', () => {
    it('should return accounts for a tenant', async () => {
      mockPrisma.account.findMany.mockResolvedValue([mockAccount])

      const result = await AccountService.getAccounts(mockTenantId)

      expect(result).toEqual([mockAccount])
      expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
        where: { tenant_id: mockTenantId },
        orderBy: { name: 'asc' }
      })
    })

    it('should apply filters correctly', async () => {
      const filters = {
        type: 'CHECKING',
        is_active: true,
        search: 'test'
      }

      mockPrisma.account.findMany.mockResolvedValue([])

      await AccountService.getAccounts(mockTenantId, filters)

      expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          type: 'CHECKING',
          is_active: true,
          name: {
            contains: 'test',
            mode: 'insensitive'
          }
        },
        orderBy: { name: 'asc' }
      })
    })

    it('should throw error for invalid tenant ID', async () => {
      await expect(AccountService.getAccounts('')).rejects.toThrow('Valid tenant ID is required')
    })
  })

  describe('getAccountById', () => {
    it('should return account when found', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)

      const result = await AccountService.getAccountById(1, mockTenantId)

      expect(result).toEqual(mockAccount)
      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          tenant_id: mockTenantId
        }
      })
    })

    it('should return null when account not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null)

      const result = await AccountService.getAccountById(999, mockTenantId)

      expect(result).toBeNull()
    })
  })

  describe('createAccount', () => {
    const validAccountData = {
      name: 'New Account',
      type: 'SAVINGS',
      balance: 500.25,
      balance_date: new Date('2025-01-01'),
      color: '#green',
      is_active: true
    }

    it('should create account successfully', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null) // No duplicate
      mockPrisma.account.create.mockResolvedValue({
        ...mockAccount,
        ...validAccountData,
        id: 2
      })

      const result = await AccountService.createAccount(mockTenantId, validAccountData)

      expect(mockPrisma.account.create).toHaveBeenCalledWith({
        data: {
          tenant_id: mockTenantId,
          name: 'New Account',
          type: 'SAVINGS',
          balance: 500.25,
          balance_date: new Date('2025-01-01'),
          color: '#green',
          is_active: true
        }
      })
    })

    it('should throw error if account name already exists', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)

      await expect(AccountService.createAccount(mockTenantId, validAccountData))
        .rejects.toThrow('Account with this name already exists')
    })

    it('should default is_active to true when not provided', async () => {
      const dataWithoutActive = { ...validAccountData }
      delete (dataWithoutActive as any).is_active

      mockPrisma.account.findFirst.mockResolvedValue(null)
      mockPrisma.account.create.mockResolvedValue(mockAccount)

      await AccountService.createAccount(mockTenantId, dataWithoutActive)

      expect(mockPrisma.account.create).toHaveBeenCalledWith({
        data: {
          tenant_id: mockTenantId,
          name: 'New Account',
          type: 'SAVINGS',
          balance: 500.25,
          balance_date: new Date('2025-01-01'),
          color: '#green',
          is_active: true // Should default to true
        }
      })
    })
  })

  describe('updateAccount', () => {
    const updateData = {
      name: 'Updated Account',
      balance: 1500.75,
      is_active: false
    }

    it('should update account successfully', async () => {
      // First call: get existing account
      mockPrisma.account.findFirst.mockResolvedValueOnce(mockAccount)
      // Second call: check for duplicate name (should return null since name is different)
      mockPrisma.account.findFirst.mockResolvedValueOnce(null)

      mockPrisma.account.update.mockResolvedValue({
        ...mockAccount,
        ...updateData,
        updated_at: new Date()
      })

      const result = await AccountService.updateAccount(1, mockTenantId, updateData)

      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...updateData,
          updated_at: expect.any(Date)
        }
      })
    })

    it('should throw error if account does not exist', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null)

      await expect(AccountService.updateAccount(999, mockTenantId, updateData))
        .rejects.toThrow('Account not found or does not belong to tenant')
    })

    it('should check for duplicate name when updating name', async () => {
      const updateWithName = { name: 'Duplicate Name' }

      mockPrisma.account.findFirst
        .mockResolvedValueOnce(mockAccount) // First call: existing account
        .mockResolvedValueOnce({ id: 2, name: 'Duplicate Name', tenant_id: mockTenantId } as any) // Second call: duplicate check

      await expect(AccountService.updateAccount(1, mockTenantId, updateWithName))
        .rejects.toThrow('Account with this name already exists')
    })

    it('should allow updating to same name', async () => {
      const updateWithSameName = { name: 'Test Account' } // Same as mockAccount.name

      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)
      mockPrisma.account.update.mockResolvedValue(mockAccount)

      await AccountService.updateAccount(1, mockTenantId, updateWithSameName)

      // Should not check for duplicates since name is the same
      expect(mockPrisma.account.findFirst).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteAccount', () => {
    it('should delete account successfully when no transactions exist', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)
      mockPrisma.transaction.count.mockResolvedValue(0)
      mockPrisma.account.delete.mockResolvedValue(mockAccount)

      await AccountService.deleteAccount(1, mockTenantId)

      expect(mockPrisma.account.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })

    it('should throw error if account does not exist', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null)

      await expect(AccountService.deleteAccount(999, mockTenantId))
        .rejects.toThrow('Account not found or does not belong to tenant')
    })

    it('should throw error if account has transactions', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount)
      mockPrisma.transaction.count.mockResolvedValue(5) // Has transactions

      await expect(AccountService.deleteAccount(1, mockTenantId))
        .rejects.toThrow('Cannot delete account with existing transactions')
    })
  })

  describe('getAccountsByType', () => {
    it('should return accounts of specific type', async () => {
      mockPrisma.account.findMany.mockResolvedValue([mockAccount])

      const result = await AccountService.getAccountsByType('CHECKING', mockTenantId)

      expect(result).toEqual([mockAccount])
      expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          type: 'CHECKING'
        },
        orderBy: { name: 'asc' }
      })
    })
  })

  describe('getActiveAccounts', () => {
    it('should return only active accounts', async () => {
      mockPrisma.account.findMany.mockResolvedValue([mockAccount])

      const result = await AccountService.getActiveAccounts(mockTenantId)

      expect(result).toEqual([mockAccount])
      expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          is_active: true
        },
        orderBy: { name: 'asc' }
      })
    })
  })

  describe('getTotalBalanceByType', () => {
    it('should return total balance for account type', async () => {
      mockPrisma.account.aggregate.mockResolvedValue({
        _sum: { balance: 2500.75 }
      })

      const result = await AccountService.getTotalBalanceByType('CHECKING', mockTenantId)

      expect(result).toBe(2500.75)
      expect(mockPrisma.account.aggregate).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          type: 'CHECKING',
          is_active: true
        },
        _sum: {
          balance: true
        }
      })
    })

    it('should return 0 when no accounts found', async () => {
      mockPrisma.account.aggregate.mockResolvedValue({
        _sum: { balance: null }
      })

      const result = await AccountService.getTotalBalanceByType('INVESTMENT', mockTenantId)

      expect(result).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should handle database errors in getAccounts', async () => {
      mockPrisma.account.findMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(AccountService.getAccounts(mockTenantId))
        .rejects.toThrow('Database connection failed')
    })

    it('should handle database errors in createAccount', async () => {
      mockPrisma.account.findFirst.mockRejectedValue(new Error('Database connection failed'))

      await expect(AccountService.createAccount(mockTenantId, {
        name: 'Test',
        type: 'CHECKING',
        balance: 100,
        balance_date: new Date(),
        color: '#blue'
      })).rejects.toThrow('Database connection failed')
    })

    it('should handle database errors in deleteAccount', async () => {
      mockPrisma.account.findFirst.mockRejectedValue(new Error('Database connection failed'))

      await expect(AccountService.deleteAccount(1, mockTenantId))
        .rejects.toThrow('Database connection failed')
    })
  })
})
