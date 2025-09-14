/**
 * Health Check API Tests
 * Basic tests to ensure the health endpoint works correctly
 */

import { GET } from '@/app/api/health/route'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }])
  }
}))

describe('/api/health', () => {
  it('should return healthy status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('healthy')
    expect(data.data.version).toBeDefined()
    expect(data.data.database.status).toBe('connected')
  })

  it('should include system information', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(data.data.timestamp).toBeDefined()
    expect(data.data.uptime).toBeDefined()
    expect(data.data.memory).toBeDefined()
    expect(data.data.memory.used).toBeGreaterThan(0)
    expect(data.data.memory.total).toBeGreaterThan(0)
  })
})
