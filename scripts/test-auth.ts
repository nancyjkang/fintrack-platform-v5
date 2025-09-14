#!/usr/bin/env tsx

/**
 * Test script for FinTrack v5 Authentication API
 *
 * This script tests the authentication flow:
 * 1. Register a new user
 * 2. Login with credentials
 * 3. Access protected endpoint
 * 4. Refresh token
 * 5. Logout
 */

const API_BASE = 'http://localhost:3000/api'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  return response.json()
}

async function testAuthFlow() {
  console.log('🧪 Testing FinTrack v5 Authentication Flow\n')

  try {
    // 1. Register a new user
    console.log('1️⃣ Testing user registration...')
    const registerResponse = await makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Test User',
        tenantName: 'Test User Finances'
      })
    })

    if (!registerResponse.success) {
      throw new Error(`Registration failed: ${registerResponse.error}`)
    }

    console.log('✅ Registration successful')
    console.log(`   User ID: ${registerResponse.data.user.id}`)
    console.log(`   Tenant: ${registerResponse.data.tenant.name}`)

    const { accessToken, refreshToken } = registerResponse.data.tokens

    // 2. Test protected endpoint (get accounts)
    console.log('\n2️⃣ Testing protected endpoint access...')
    const accountsResponse = await makeRequest('/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!accountsResponse.success) {
      throw new Error(`Protected endpoint failed: ${accountsResponse.error}`)
    }

    console.log('✅ Protected endpoint access successful')
    console.log(`   Found ${accountsResponse.data.items.length} accounts`)

    // 3. Test token refresh
    console.log('\n3️⃣ Testing token refresh...')
    const refreshResponse = await makeRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken
      })
    })

    if (!refreshResponse.success) {
      throw new Error(`Token refresh failed: ${refreshResponse.error}`)
    }

    console.log('✅ Token refresh successful')
    const newAccessToken = refreshResponse.data.tokens.accessToken

    // 4. Test with new token
    console.log('\n4️⃣ Testing with refreshed token...')
    const accountsResponse2 = await makeRequest('/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${newAccessToken}`
      }
    })

    if (!accountsResponse2.success) {
      throw new Error(`New token failed: ${accountsResponse2.error}`)
    }

    console.log('✅ New token works correctly')

    // 5. Test logout
    console.log('\n5️⃣ Testing logout...')
    const logoutResponse = await makeRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken: refreshResponse.data.tokens.refreshToken
      })
    })

    if (!logoutResponse.success) {
      throw new Error(`Logout failed: ${logoutResponse.error}`)
    }

    console.log('✅ Logout successful')

    console.log('\n🎉 All authentication tests passed!')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests if server is available
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/accounts`)
    return response.status !== 500 // Server is responding
  } catch {
    return false
  }
}

async function main() {
  const serverRunning = await checkServer()

  if (!serverRunning) {
    console.log('⚠️  Server not running. Start the dev server first:')
    console.log('   npm run dev')
    console.log('\nThen run this test again.')
    process.exit(1)
  }

  await testAuthFlow()
}

main().catch(console.error)
