import { NextRequest } from 'next/server'
import { authenticateRequest, type AuthenticatedUser } from '@/lib/auth'

/**
 * Get current user from JWT token in request
 * This is a compatibility wrapper for the trends API routes
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  return authenticateRequest(request)
}

/**
 * Alternative function name for compatibility
 */
export { getCurrentUser as getCurrentUserFromJWT }
