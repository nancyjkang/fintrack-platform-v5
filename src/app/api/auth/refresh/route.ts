import { NextRequest } from 'next/server'
import { z } from 'zod'
import { verifyToken, generateTokens, createUserSession, invalidateSession } from '@/lib/auth'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'
import { UserService } from '@/lib/services/user'

// Validation schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const { refreshToken } = refreshSchema.parse(body)

    // Verify refresh token
    const payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET!)
    if (!payload) {
      return handleApiError(new Error('Invalid refresh token'))
    }

    // Get user from token payload using service
    const user = await UserService.getUserById(payload.userId)

    if (!user || user.memberships.length === 0) {
      return handleApiError(new Error('Invalid or expired session'))
    }

    const membership = user.memberships[0]

    // Generate new tokens
    const newTokens = generateTokens({
      userId: user.id,
      email: user.email,
      tenantId: membership.tenant_id,
      role: membership.role
    })

    // Invalidate old session and create new one
    await invalidateSession(refreshToken)

    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     undefined

    await createUserSession(
      user.id,
      newTokens.refreshToken,
      userAgent,
      ipAddress
    )

    return createSuccessResponse({
      tokens: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      }
    }, 'Token refreshed successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
