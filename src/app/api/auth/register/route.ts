import { NextRequest } from 'next/server'
import { z } from 'zod'
import { generateTokens, createUserSession } from '@/lib/auth'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'
import { UserService } from '@/lib/services/user'

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
  tenantName: z.string().min(1, 'Tenant name is required').optional()
})

type RegisterRequest = z.infer<typeof registerSchema>

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = registerSchema.parse(body)

    // Create user using service
    const result = await UserService.createUser({
      email: validatedData.email,
      password: validatedData.password,
      name: validatedData.name,
      tenantName: validatedData.tenantName
    })

    // Generate tokens
    const tokens = generateTokens({
      userId: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: result.membership.role
    })

    // Create session
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     undefined

    await createUserSession(
      result.user.id,
      tokens.refreshToken,
      userAgent,
      ipAddress
    )

    return createSuccessResponse({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    }, 'Registration successful')

  } catch (error) {
    return handleApiError(error)
  }
}
