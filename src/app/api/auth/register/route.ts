import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateTokens, createUserSession } from '@/lib/auth'
import { createSuccessResponse, handleApiError, validateRequestBody } from '@/lib/api-response'

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return handleApiError(new Error('User already exists with this email'))
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user and tenant in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password_hash: passwordHash,
          email_verified: false // In production, require email verification
        }
      })

      // Create tenant (personal finance space)
      const tenantName = validatedData.tenantName || `${validatedData.name || 'User'}'s Finances`
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          type: 'PERSONAL',
          currency: 'USD',
          timezone: 'UTC',
          locale: 'en-US'
        }
      })

      // Create membership (user-tenant relationship)
      await tx.membership.create({
        data: {
          user_id: user.id,
          tenant_id: tenant.id,
          role: 'ADMIN',
          is_active: true
        }
      })

      return { user, tenant }
    })

    // Generate tokens
    const tokens = generateTokens({
      userId: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: 'ADMIN'
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
        emailVerified: result.user.email_verified
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        type: result.tenant.type
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
