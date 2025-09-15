// Mock the dependencies first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    tenant: {
      create: jest.fn(),
    },
    membership: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(),
}))

import { UserService } from '../user.service'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// Get the mocked dependencies
const mockPrisma = prisma as any
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createUser', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      tenantName: 'Test Tenant'
    }

    it('should create user with tenant and membership successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        created_at: new Date(),
        updated_at: new Date(),
      }

      const mockTenant = {
        id: 'tenant-456',
        name: 'Test Tenant',
        created_at: new Date(),
        updated_at: new Date(),
      }

      const mockMembership = {
        id: 'membership-789',
        user_id: 'user-123',
        tenant_id: 'tenant-456',
        role: 'OWNER',
        created_at: new Date(),
        updated_at: new Date(),
      }

      // Mock dependencies
      mockPrisma.user.findUnique.mockResolvedValue(null) // User doesn't exist
      mockHashPassword.mockResolvedValue('hashed-password')
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: { create: jest.fn().mockResolvedValue(mockUser) },
          tenant: { create: jest.fn().mockResolvedValue(mockTenant) },
          membership: { create: jest.fn().mockResolvedValue(mockMembership) },
        })
      })

      const result = await UserService.createUser(validUserData)

      expect(result).toEqual({
        user: mockUser,
        tenant: mockTenant,
        membership: mockMembership,
      })

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      })
      expect(mockHashPassword).toHaveBeenCalledWith('password123')
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should throw error if user already exists', async () => {
      const existingUser = {
        id: 'existing-user',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Existing User',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(existingUser)

      await expect(UserService.createUser(validUserData)).rejects.toThrow(
        'User already exists with this email'
      )

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      })
      expect(mockHashPassword).not.toHaveBeenCalled()
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('should use default tenant name when not provided', async () => {
      const userDataWithoutTenant = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockHashPassword.mockResolvedValue('hashed-password')

      const mockTxUser = { create: jest.fn().mockResolvedValue({ id: 'user-123' }) }
      const mockTxTenant = { create: jest.fn().mockResolvedValue({ id: 'tenant-456' }) }
      const mockTxMembership = { create: jest.fn().mockResolvedValue({ id: 'membership-789' }) }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: mockTxUser,
          tenant: mockTxTenant,
          membership: mockTxMembership,
        })
      })

      await UserService.createUser(userDataWithoutTenant)

      expect(mockTxTenant.create).toHaveBeenCalledWith({
        data: {
          name: "Test User's Finances" // Default tenant name
        }
      })
    })
  })

  describe('getUserByEmail', () => {
    it('should return user with memberships when found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        memberships: [
          {
            id: 'membership-1',
            user_id: 'user-123',
            tenant_id: 'tenant-456',
            role: 'OWNER',
            tenant: {
              id: 'tenant-456',
              name: 'Test Tenant',
            }
          }
        ]
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await UserService.getUserByEmail('test@example.com')

      expect(result).toEqual(mockUser)
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          memberships: {
            include: {
              tenant: true
            }
          }
        }
      })
    })

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await UserService.getUserByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('getUserById', () => {
    it('should return user with memberships when found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        memberships: [
          {
            id: 'membership-1',
            user_id: 'user-123',
            tenant_id: 'tenant-456',
            role: 'OWNER',
            tenant: {
              id: 'tenant-456',
              name: 'Test Tenant',
            }
          }
        ]
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await UserService.getUserById('user-123')

      expect(result).toEqual(mockUser)
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: {
          memberships: {
            include: {
              tenant: true
            }
          }
        }
      })
    })

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await UserService.getUserById('nonexistent-user')

      expect(result).toBeNull()
    })
  })

  describe('getUserMembership', () => {
    it('should return membership when user has access to tenant', async () => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-123',
        tenant_id: 'tenant-456',
        role: 'OWNER',
        tenant: {
          id: 'tenant-456',
          name: 'Test Tenant',
        }
      }

      mockPrisma.membership.findFirst.mockResolvedValue(mockMembership)

      const result = await UserService.getUserMembership('user-123', 'tenant-456')

      expect(result).toEqual(mockMembership)
      expect(mockPrisma.membership.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: 'user-123',
          tenant_id: 'tenant-456',
        },
        include: {
          tenant: true
        }
      })
    })

    it('should return null when user does not have access to tenant', async () => {
      mockPrisma.membership.findFirst.mockResolvedValue(null)

      const result = await UserService.getUserMembership('user-123', 'tenant-456')

      expect(result).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle database errors in createUser', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(UserService.createUser({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow('Database connection failed')
    })

    it('should handle database errors in getUserByEmail', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(UserService.getUserByEmail('test@example.com')).rejects.toThrow('Database connection failed')
    })
  })
})
