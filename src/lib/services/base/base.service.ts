import { prisma } from '@/lib/prisma'

/**
 * Base service class providing common functionality for all services
 * Includes tenant isolation, error handling, and common patterns
 */
export abstract class BaseService {
  protected static prisma = prisma

  /**
   * Validate that a tenant ID is provided and valid
   */
  protected static validateTenantId(tenantId: string): void {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Valid tenant ID is required')
    }
  }

  /**
   * Validate that a user has access to a specific tenant
   */
  protected static async validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        tenant_id: tenantId
      }
    })

    return !!membership
  }

  /**
   * Get tenant-scoped query base for any model
   */
  protected static getTenantScope(tenantId: string) {
    this.validateTenantId(tenantId)
    return { tenant_id: tenantId }
  }

  /**
   * Handle service errors consistently
   */
  protected static handleError(error: unknown, context: string): never {
    console.error(`Service Error in ${context}:`, error)

    if (error instanceof Error) {
      throw error
    }

    throw new Error(`Unknown error in ${context}`)
  }
}
