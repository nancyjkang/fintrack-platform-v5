import { NextRequest } from 'next/server'
import { authenticateRequest, type AuthenticatedUser } from '@/lib/auth'

/**
 * Get current user from request
 * This is a compatibility wrapper for the cube API routes
 */
export async function getCurrentUser(request?: NextRequest): Promise<AuthenticatedUser | null> {
  if (!request) {
    // If no request provided, we can't authenticate
    return null
  }

  return authenticateRequest(request)
}

/**
 * Alternative function name for compatibility
 */
export { getCurrentUser as getCurrentUserFromRequest }
