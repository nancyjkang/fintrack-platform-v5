// Mock the prisma import
jest.mock('@/lib/prisma', () => ({
  prisma: {
    membership: {
      findFirst: jest.fn(),
    },
  },
}))

import { BaseService } from '../base.service'
import { prisma } from '@/lib/prisma'

// Get the mocked prisma
const mockPrisma = prisma as any

// Create a concrete test class that extends BaseService
class TestService extends BaseService {
  static get testPrisma() {
    return this.prisma
  }

  static testValidateTenantId(tenantId: string) {
    return this.validateTenantId(tenantId)
  }

  static testValidateTenantAccess(userId: string, tenantId: string) {
    return this.validateTenantAccess(userId, tenantId)
  }

  static testGetTenantScope(tenantId: string) {
    return this.getTenantScope(tenantId)
  }

  static testHandleError(error: unknown, context: string) {
    return this.handleError(error, context)
  }
}

describe('BaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateTenantId', () => {
    it('should pass validation for valid tenant ID', () => {
      expect(() => TestService.testValidateTenantId('tenant-123')).not.toThrow()
    })

    it('should throw error for empty tenant ID', () => {
      expect(() => TestService.testValidateTenantId('')).toThrow('Valid tenant ID is required')
    })

    it('should throw error for null tenant ID', () => {
      expect(() => TestService.testValidateTenantId(null as any)).toThrow('Valid tenant ID is required')
    })

    it('should throw error for undefined tenant ID', () => {
      expect(() => TestService.testValidateTenantId(undefined as any)).toThrow('Valid tenant ID is required')
    })

    it('should throw error for non-string tenant ID', () => {
      expect(() => TestService.testValidateTenantId(123 as any)).toThrow('Valid tenant ID is required')
    })
  })

  describe('validateTenantAccess', () => {
    it('should return true when user has access to tenant', async () => {
      mockPrisma.membership.findFirst.mockResolvedValue({
        id: 'membership-1',
        user_id: 'user-123',
        tenant_id: 'tenant-456',
        role: 'OWNER',
      })

      const result = await TestService.testValidateTenantAccess('user-123', 'tenant-456')

      expect(result).toBe(true)
      expect(mockPrisma.membership.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: 'user-123',
          tenant_id: 'tenant-456',
        },
      })
    })

    it('should return false when user does not have access to tenant', async () => {
      mockPrisma.membership.findFirst.mockResolvedValue(null)

      const result = await TestService.testValidateTenantAccess('user-123', 'tenant-456')

      expect(result).toBe(false)
      expect(mockPrisma.membership.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: 'user-123',
          tenant_id: 'tenant-456',
        },
      })
    })
  })

  describe('getTenantScope', () => {
    it('should return tenant scope object for valid tenant ID', () => {
      const result = TestService.testGetTenantScope('tenant-123')

      expect(result).toEqual({ tenant_id: 'tenant-123' })
    })

    it('should throw error for invalid tenant ID', () => {
      expect(() => TestService.testGetTenantScope('')).toThrow('Valid tenant ID is required')
    })
  })

  describe('handleError', () => {
    it('should throw the original Error object', () => {
      const originalError = new Error('Test error')

      expect(() => TestService.testHandleError(originalError, 'TestContext')).toThrow('Test error')
    })

    it('should throw generic error for unknown error types', () => {
      const unknownError = 'string error'

      expect(() => TestService.testHandleError(unknownError, 'TestContext')).toThrow('Unknown error in TestContext')
    })

    it('should log error to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const testError = new Error('Test error')

      try {
        TestService.testHandleError(testError, 'TestContext')
      } catch (e) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('Service Error in TestContext:', testError)

      consoleSpy.mockRestore()
    })
  })

  describe('prisma access', () => {
    it('should have access to prisma client', () => {
      expect(TestService.testPrisma).toBeDefined()
      expect(TestService.testPrisma).toBe(mockPrisma)
    })
  })
})
