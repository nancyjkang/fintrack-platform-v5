import { NextRequest } from 'next/server'
import { z } from 'zod'
import { invalidateSession } from '@/lib/auth'
import { createSuccessResponse, handleApiError } from '@/lib/api-response'

// Validation schema
const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const { refreshToken } = logoutSchema.parse(body)

    // Invalidate session
    await invalidateSession(refreshToken)

    return createSuccessResponse(
      { message: 'Logged out successfully' },
      'Session terminated'
    )

  } catch (error) {
    return handleApiError(error)
  }
}
