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
      return handleApiError(new Error('Authentication required'))
    }

    // Get full user data with membership
    const user = await UserService.getUserByEmail(auth.email)
    if (!user) {
      return handleApiError(new Error('User not found'))
    }

    // Find the active membership for this tenant
    const membership = user.memberships.find(m => m.tenant_id === auth.tenantId)
    if (!membership) {
      return handleApiError(new Error('No active membership found'))
    }

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true // Default to true since we don't have this field yet
      },
      tenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        type: 'PERSONAL', // Default type since we don't have this field yet
        role: membership.role
      }
    }, 'User information retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
