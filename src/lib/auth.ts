import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { addDays, getCurrentUTCDate, toUTCMidnight } from '@/lib/utils/date-utils'

// JWT Configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

export interface JWTPayload {
  userId: string
  email: string
  tenantId?: string
  role?: string
}

export interface AuthenticatedUser {
  id: string
  email: string
  tenantId: string
  role: string
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT access and refresh tokens
 */
export function generateTokens(payload: JWTPayload) {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'fintrack-v5',
    audience: 'fintrack-users'
  })

  const refreshToken = jwt.sign(
    { userId: payload.userId, email: payload.email },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'fintrack-v5',
      audience: 'fintrack-users'
    }
  )

  return { accessToken, refreshToken }
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string, secret: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'fintrack-v5',
      audience: 'fintrack-users'
    }) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * Authenticate user from request and return user info with tenant context
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = extractBearerToken(request)
  if (!token) {
    return null
  }

  const payload = verifyToken(token, JWT_ACCESS_SECRET)
  if (!payload) {
    return null
  }

  // Get user with membership (tenant context)
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      memberships: {
        include: {
          tenant: true
        },
        take: 1 // For now, assume users have one active tenant
      }
    }
  })

  if (!user || user.memberships.length === 0) {
    return null
  }

  const membership = user.memberships[0]

  return {
    id: user.id,
    email: user.email,
    tenantId: membership.tenant_id,
    role: membership.role
  }
}

/**
 * Verify authentication and return user or null
 */
export async function verifyAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  return authenticateRequest(request)
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await authenticateRequest(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Middleware to require specific role
 */
export async function requireRole(request: NextRequest, requiredRole: 'ADMIN' | 'VIEWER'): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)

  if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }

  return user
}

/**
 * Create a new user session (simplified - no database storage)
 * In v4.1 approach, we rely on JWT tokens only
 */
export async function createUserSession(userId: string, refreshToken: string, userAgent?: string, ipAddress?: string) {
  // In the simplified approach, we just return the refresh token
  // Session management is handled via JWT tokens only
  return {
    refresh_token: refreshToken,
    expires_at: toUTCMidnight(addDays(getCurrentUTCDate(), 7)) // 7 days
  }
}

/**
 * Invalidate user session (simplified)
 */
export async function invalidateSession(refreshToken: string) {
  // In simplified approach, we rely on token expiration
  // Could implement a token blacklist in the future if needed
  return { success: true }
}

/**
 * Clean up expired sessions (simplified)
 */
export async function cleanupExpiredSessions() {
  // In simplified approach, expired tokens are automatically invalid
  return { success: true }
}
