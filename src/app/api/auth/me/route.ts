import { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'
import { UserService } from '@/lib/services/user.service'

/**
 * GET /api/auth/me - Get current user information
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return handleApiError(new Error('Authentication required'), 401)
    }

    // Get full user data with membership
    const user = await UserService.getUserByEmail(auth.email)
    if (!user) {
      return handleApiError(new Error('User not found'), 404)
    }

    // Find the active membership for this tenant
    const membership = user.memberships.find(m => m.tenant_id === auth.tenantId)
    if (!membership) {
      return handleApiError(new Error('No active membership found'), 404)
    }

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified
      },
      tenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        type: membership.tenant.type,
        role: membership.role
      }
    }, 'User information retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
