import { BaseService } from './base.service'
import { hashPassword } from '@/lib/auth'
import type { User, Tenant, Membership } from '@prisma/client'

export interface CreateUserData {
  email: string
  password: string
  name?: string
  tenantName?: string
}

export interface UserWithMembership extends User {
  memberships: (Membership & {
    tenant: Tenant
  })[]
}

/**
 * User service for managing user accounts and authentication
 */
export class UserService extends BaseService {

  /**
   * Create a new user with tenant and membership
   */
  static async createUser(data: CreateUserData): Promise<{
    user: User
    tenant: Tenant
    membership: Membership
  }> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email }
      })

      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Hash password
      const passwordHash = await hashPassword(data.password)

      // Create user and tenant in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: data.email,
            password: passwordHash,
            name: data.name
          }
        })

        // Create tenant (personal finance space)
        const tenantName = data.tenantName || `${data.name || 'User'}'s Finances`
        const tenant = await tx.tenant.create({
          data: {
            name: tenantName
          }
        })

        // Create membership (user-tenant relationship)
        const membership = await tx.membership.create({
          data: {
            user_id: user.id,
            tenant_id: tenant.id,
            role: 'OWNER'
          }
        })

        return { user, tenant, membership }
      })

      return result
    } catch (error) {
      return this.handleError(error, 'UserService.createUser')
    }
  }

  /**
   * Get user by email with memberships
   */
  static async getUserByEmail(email: string): Promise<UserWithMembership | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: {
              tenant: true
            }
          }
        }
      })

      return user
    } catch (error) {
      return this.handleError(error, 'UserService.getUserByEmail')
    }
  }

  /**
   * Get user by ID with memberships
   */
  static async getUserById(id: string): Promise<UserWithMembership | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          memberships: {
            include: {
              tenant: true
            }
          }
        }
      })

      return user
    } catch (error) {
      return this.handleError(error, 'UserService.getUserById')
    }
  }

  /**
   * Get user's active membership for a tenant
   */
  static async getUserMembership(userId: string, tenantId: string): Promise<Membership & { tenant: Tenant } | null> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          user_id: userId,
          tenant_id: tenantId
        },
        include: {
          tenant: true
        }
      })

      return membership
    } catch (error) {
      return this.handleError(error, 'UserService.getUserMembership')
    }
  }
}
