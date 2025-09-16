/**
 * FinTrack v5 - Prisma Database Client
 *
 * Centralized database client configuration with connection pooling,
 * logging, and error handling for the multi-tenant architecture.
 */

import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn']  // Reduced logging to avoid connection issues
    : ['error'],

  errorFormat: 'pretty',

  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Graceful shutdown handler for database connections
 */
export async function disconnectDatabase() {
  await prisma.$disconnect()
}

/**
 * Health check for database connectivity
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

/**
 * Transaction wrapper with retry logic
 */
export async function withTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn)
    } catch (error) {
      lastError = error as Error

      // Do not retry on validation errors
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw error
      }

      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 100
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Tenant-scoped query helper
 * Ensures all queries are properly scoped to a tenant
 */
export function createTenantClient(tenantId: string) {
  return {
    // Accounts
    accounts: {
      findMany: (args?: any) => prisma.account.findMany({
        ...args,
        where: { ...args?.where, tenant_id: tenantId }
      }),

      findUnique: (args: any) => prisma.account.findUnique({
        ...args,
        where: { ...args.where, tenant_id: tenantId }
      }),

      create: (args: any) => prisma.account.create({
        ...args,
        data: { ...args.data, tenant_id: tenantId }
      } as any),

      update: (args: any) => prisma.account.update({
        ...args,
        where: { ...args.where, tenant_id: tenantId }
      }),

      delete: (args: any) => prisma.account.delete({
        ...args,
        where: { ...args.where, tenant_id: tenantId }
      })
    },

    // Transactions
    transactions: {
      findMany: (args?: any) => prisma.transaction.findMany({
        ...args,
        where: { ...args?.where, tenant_id: tenantId }
      }),

      findUnique: (args: any) => prisma.transaction.findUnique({
        ...args,
        where: { ...args.where, tenant_id: tenantId }
      }),

      create: (args: any) => prisma.transaction.create({
        ...args,
        data: { ...args.data, tenant_id: tenantId }
      } as any),

      update: (args: any) => prisma.transaction.update({
        ...args,
        where: { ...args.where, tenant_id: tenantId }
      }),

      delete: (args: any) => prisma.transaction.delete({
        ...args,
        where: { ...args.where, tenant_id: tenantId }
      })
    },

    // Categories
    categories: {
      findMany: (args?: any) => prisma.category.findMany({
        ...args,
        where: { ...args?.where, tenant_id: tenantId }
      }),

      findUnique: (args: any) => prisma.category.findUnique({
        ...args,
        where: { ...args.where, tenant_id: tenantId }
      }),

      create: (args: any) => prisma.category.create({
        ...args,
        data: { ...args.data, tenant_id: tenantId }
      } as any),

      update: (args: any) => prisma.category.update({
        ...args,
        where: { ...args.where, tenant_id: tenantId }
      }),

      delete: (args: any) => prisma.category.delete({
        ...args,
        where: { ...args.where, tenant_id: tenantId }
      })
    }
  }
}

export default prisma
