import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user'
import { verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Find user
    const user = await UserService.getUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 })
    }

    // Check memberships
    if (user.memberships.length === 0) {
      return NextResponse.json({ error: 'No memberships' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      tenant: {
        id: user.memberships[0].tenant.id,
        name: user.memberships[0].tenant.name
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}



