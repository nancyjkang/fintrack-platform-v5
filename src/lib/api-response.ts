import { NextResponse } from 'next/server'
import { toISOString, getCurrentUTCDate } from '@/lib/utils/date-utils'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: toISOString(getCurrentUTCDate())
  })
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string | ApiError,
  status: number = 400
): NextResponse<ApiResponse> {
  const errorObj = typeof error === 'string' ? { code: 'ERROR', message: error } : error

  return NextResponse.json(
    {
      success: false,
      error: errorObj.message,
      timestamp: toISOString(getCurrentUTCDate())
    },
    { status }
  )
}

/**
 * Handle API errors with proper status codes
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error)

  if (error instanceof Error) {
    // Authentication errors
    if (error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401)
    }

    if (error.message === 'Admin access required') {
      return createErrorResponse('Insufficient permissions', 403)
    }

    // Validation errors
    if (error.message.includes('validation')) {
      return createErrorResponse(error.message, 400)
    }

    // Database errors
    if (error.message.includes('Unique constraint')) {
      return createErrorResponse('Resource already exists', 409)
    }

    if (error.message.includes('Record to update not found')) {
      return createErrorResponse('Resource not found', 404)
    }

    // Generic error
    return createErrorResponse(error.message, 500)
  }

  return createErrorResponse('Internal server error', 500)
}

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(body: unknown, requiredFields: (keyof T)[]): T {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required')
  }

  const typedBody = body as Record<string, unknown>
  for (const field of requiredFields) {
    const fieldKey = String(field)
    if (!(fieldKey in typedBody) || typedBody[fieldKey] === undefined || typedBody[fieldKey] === null) {
      throw new Error(`Field '${String(field)}' is required`)
    }
  }

  return body as T
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams,
  requiredParams: string[] = []
): Record<string, string> {
  const params: Record<string, string> = {}

  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }

  for (const param of requiredParams) {
    if (!params[param]) {
      throw new Error(`Query parameter '${param}' is required`)
    }
  }

  return params
}

/**
 * Parse pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Create paginated response
 */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  params: PaginationParams
): NextResponse<ApiResponse<PaginatedResponse<T>>> {
  const totalPages = Math.ceil(total / params.limit)

  return createSuccessResponse({
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1
    }
  })
}
