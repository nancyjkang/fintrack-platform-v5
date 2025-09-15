import { NextRequest } from 'next/server'
import { z } from 'zod'
import { verifyPassword, generateTokens, createUserSession } from '@/lib/auth'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'
import { UserService } from '@/lib/services/user.service'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const { email, password } = loginSchema.parse(body)

    // Find user with membership using service
    const user = await UserService.getUserByEmail(email)

    if (!user) {
      return handleApiError(new Error('Invalid email or password'))
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return handleApiError(new Error('Invalid email or password'))
    }

    // Check if user has active membership
    if (user.memberships.length === 0) {
      return handleApiError(new Error('No active tenant found for user'))
    }

    const membership = user.memberships[0]

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      tenantId: membership.tenant_id,
      role: membership.role
    })

    // Create session
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     undefined

    await createUserSession(
      user.id,
      tokens.refreshToken,
      userAgent,
      ipAddress
    )

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      tenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        role: membership.role
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    }, 'Login successful')

  } catch (error) {
    return handleApiError(error)
  }
}
