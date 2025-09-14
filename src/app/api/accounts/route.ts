import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createSuccessResponse, handleApiError, parsePaginationParams, createPaginatedResponse } from '@/lib/api-response'

/**
 * GET /api/accounts - Get user's accounts
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Parse pagination parameters
    const { searchParams } = new URL(request.url)
    const pagination = parsePaginationParams(searchParams)

    // Get accounts for the user's tenant
    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where: {
          tenant_id: user.tenantId,
          is_active: true
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ],
        skip: pagination.offset,
        take: pagination.limit,
        select: {
          id: true,
          name: true,
          type: true,
          subtype: true,
          current_balance: true,
          currency: true,
          account_number_last4: true,
          institution_name: true,
          color: true,
          icon: true,
          created_at: true,
          updated_at: true
        }
      }),
      prisma.account.count({
        where: {
          tenant_id: user.tenantId,
          is_active: true
        }
      })
    ])

    return createPaginatedResponse(accounts, total, pagination)

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/accounts - Create a new account
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'type', 'currency']
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Field '${field}' is required`)
      }
    }

    // Create account
    const account = await prisma.account.create({
      data: {
        tenant_id: user.tenantId,
        name: body.name,
        type: body.type,
        subtype: body.subtype || body.type,
        current_balance: body.initialBalance || 0,
        currency: body.currency,
        account_number_last4: body.accountNumberLast4,
        institution_name: body.institutionName,
        color: body.color || '#3B82F6',
        icon: body.icon || '🏦',
        is_active: true
      },
      select: {
        id: true,
        name: true,
        type: true,
        subtype: true,
        current_balance: true,
        currency: true,
        account_number_last4: true,
        institution_name: true,
        color: true,
        icon: true,
        created_at: true
      }
    })

    return createSuccessResponse(account, 'Account created successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
