import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserService } from '@/lib/services/user'
import { verifyPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Test Prisma import and connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`

    // Test UserService
    const user = await UserService.getUserByEmail('nancyjkang@gmail.com')

    // Test password verification
    let passwordValid = false
    if (user) {
      passwordValid = await verifyPassword('demo123456', user.password)
    }

    return NextResponse.json({
      success: true,
      message: 'Full auth flow works',
      databaseUrl: process.env.DATABASE_URL,
      dbTest: dbTest,
      userFound: !!user,
      userEmail: user?.email,
      passwordValid: passwordValid,
      membershipsCount: user?.memberships.length || 0
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'full-auth-test'
    }, { status: 500 })
  }
}
