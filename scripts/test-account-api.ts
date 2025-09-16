#!/usr/bin/env tsx

/**
 * Integration test script for Account Management API
 * Tests the actual API endpoints with real HTTP requests
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestAccount {
  id?: number
  name: string
  type: string
  net_worth_category?: string
  balance: number
  balance_date: string
  color: string
  is_active?: boolean
}

class AccountAPITester {
  private baseUrl: string
  private authToken: string | null = null
  private testTenantId: string = 'test-tenant-123'
  private createdAccountIds: number[] = []

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  /**
   * Setup test environment
   */
  async setup() {
    console.log('🔧 Setting up test environment...')

    // Create test tenant and user if they don't exist
    try {
      await prisma.tenant.upsert({
        where: { id: this.testTenantId },
        update: {},
        create: {
          id: this.testTenantId,
          name: 'Test Tenant'
        }
      })

      await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
          id: 'test-user-123',
          email: 'test@example.com',
          password: 'test-hash',
          name: 'Test User'
        }
      })

      console.log('✅ Test environment setup complete')
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error)
      throw error
    }
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    console.log('🧹 Cleaning up test data...')

    try {
      // Delete test accounts
      if (this.createdAccountIds.length > 0) {
        await prisma.account.deleteMany({
          where: {
            id: { in: this.createdAccountIds },
            tenant_id: this.testTenantId
          }
        })
      }

      // Clean up test user and tenant
      await prisma.user.deleteMany({
        where: { email: 'test@example.com' }
      })

      await prisma.tenant.deleteMany({
        where: { id: this.testTenantId }
      })

      console.log('✅ Cleanup complete')
    } catch (error) {
      console.error('❌ Cleanup failed:', error)
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Add auth header if we have a token
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    // For testing, we'll simulate authentication by adding tenant context
    // In a real scenario, this would come from the JWT token
    headers['X-Test-Tenant-Id'] = this.testTenantId

    return fetch(url, {
      ...options,
      headers
    })
  }

  /**
   * Test GET /api/accounts
   */
  async testGetAccounts() {
    console.log('\n📋 Testing GET /api/accounts...')

    try {
      const response = await this.makeRequest('/api/accounts')
      const data = await response.json()

      console.log(`Status: ${response.status}`)
      console.log('Response:', JSON.stringify(data, null, 2))

      if (response.status === 200 && data.success) {
        console.log('✅ GET /api/accounts - SUCCESS')
        return data.data
      } else {
        console.log('❌ GET /api/accounts - FAILED')
        return null
      }
    } catch (error) {
      console.error('❌ GET /api/accounts - ERROR:', error)
      return null
    }
  }

  /**
   * Test POST /api/accounts
   */
  async testCreateAccount(accountData: TestAccount) {
    console.log('\n➕ Testing POST /api/accounts...')

    try {
      const response = await this.makeRequest('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(accountData)
      })
      const data = await response.json()

      console.log(`Status: ${response.status}`)
      console.log('Response:', JSON.stringify(data, null, 2))

      if (response.status === 201 && data.success) {
        console.log('✅ POST /api/accounts - SUCCESS')
        this.createdAccountIds.push(data.data.id)
        return data.data
      } else {
        console.log('❌ POST /api/accounts - FAILED')
        return null
      }
    } catch (error) {
      console.error('❌ POST /api/accounts - ERROR:', error)
      return null
    }
  }

  /**
   * Test GET /api/accounts/[id]
   */
  async testGetAccount(accountId: number) {
    console.log(`\n🔍 Testing GET /api/accounts/${accountId}...`)

    try {
      const response = await this.makeRequest(`/api/accounts/${accountId}`)
      const data = await response.json()

      console.log(`Status: ${response.status}`)
      console.log('Response:', JSON.stringify(data, null, 2))

      if (response.status === 200 && data.success) {
        console.log('✅ GET /api/accounts/[id] - SUCCESS')
        return data.data
      } else {
        console.log('❌ GET /api/accounts/[id] - FAILED')
        return null
      }
    } catch (error) {
      console.error('❌ GET /api/accounts/[id] - ERROR:', error)
      return null
    }
  }

  /**
   * Test PUT /api/accounts/[id]
   */
  async testUpdateAccount(accountId: number, updateData: Partial<TestAccount>) {
    console.log(`\n✏️ Testing PUT /api/accounts/${accountId}...`)

    try {
      const response = await this.makeRequest(`/api/accounts/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const data = await response.json()

      console.log(`Status: ${response.status}`)
      console.log('Response:', JSON.stringify(data, null, 2))

      if (response.status === 200 && data.success) {
        console.log('✅ PUT /api/accounts/[id] - SUCCESS')
        return data.data
      } else {
        console.log('❌ PUT /api/accounts/[id] - FAILED')
        return null
      }
    } catch (error) {
      console.error('❌ PUT /api/accounts/[id] - ERROR:', error)
      return null
    }
  }

  /**
   * Test GET /api/accounts/net-worth
   */
  async testGetNetWorth() {
    console.log('\n💰 Testing GET /api/accounts/net-worth...')

    try {
      const response = await this.makeRequest('/api/accounts/net-worth')
      const data = await response.json()

      console.log(`Status: ${response.status}`)
      console.log('Response:', JSON.stringify(data, null, 2))

      if (response.status === 200 && data.success) {
        console.log('✅ GET /api/accounts/net-worth - SUCCESS')
        return data.data
      } else {
        console.log('❌ GET /api/accounts/net-worth - FAILED')
        return null
      }
    } catch (error) {
      console.error('❌ GET /api/accounts/net-worth - ERROR:', error)
      return null
    }
  }

  /**
   * Test POST /api/accounts/[id]/reconcile
   */
  async testReconcileAccount(accountId: number) {
    console.log(`\n⚖️ Testing POST /api/accounts/${accountId}/reconcile...`)

    const reconcileData = {
      newBalance: 1500.75,
      reconcileDate: '2025-01-15',
      adjustmentType: 'INCOME'
    }

    try {
      const response = await this.makeRequest(`/api/accounts/${accountId}/reconcile`, {
        method: 'POST',
        body: JSON.stringify(reconcileData)
      })
      const data = await response.json()

      console.log(`Status: ${response.status}`)
      console.log('Response:', JSON.stringify(data, null, 2))

      if (response.status === 200 && data.success) {
        console.log('✅ POST /api/accounts/[id]/reconcile - SUCCESS')
        return data.data
      } else {
        console.log('❌ POST /api/accounts/[id]/reconcile - FAILED')
        return null
      }
    } catch (error) {
      console.error('❌ POST /api/accounts/[id]/reconcile - ERROR:', error)
      return null
    }
  }

  /**
   * Test net_worth_category functionality
   */
  async testNetWorthCategoryFunctionality() {
    console.log('\n🏷️ Testing net_worth_category functionality...')

    const testAccounts = [
      {
        name: 'Test Checking',
        type: 'CHECKING',
        balance: 5000,
        balance_date: '2025-01-01',
        color: '#0066cc'
      },
      {
        name: 'Test Credit Card',
        type: 'CREDIT_CARD',
        balance: -2000,
        balance_date: '2025-01-01',
        color: '#cc0000'
      },
      {
        name: 'Test Investment',
        type: 'INVESTMENT',
        net_worth_category: 'EXCLUDED', // Explicit override
        balance: 50000,
        balance_date: '2025-01-01',
        color: '#00cc66'
      }
    ]

    const createdAccounts = []

    // Create test accounts
    for (const accountData of testAccounts) {
      const account = await this.testCreateAccount(accountData)
      if (account) {
        createdAccounts.push(account)
      }
    }

    // Verify net_worth_category assignment
    console.log('\n🔍 Verifying net_worth_category assignments...')
    for (const account of createdAccounts) {
      console.log(`Account: ${account.name}`)
      console.log(`  Type: ${account.type}`)
      console.log(`  Net Worth Category: ${account.net_worth_category}`)

      // Verify expected categories
      if (account.type === 'CHECKING' && account.net_worth_category === 'ASSET') {
        console.log('  ✅ Checking account correctly categorized as ASSET')
      } else if (account.type === 'CREDIT_CARD' && account.net_worth_category === 'LIABILITY') {
        console.log('  ✅ Credit card correctly categorized as LIABILITY')
      } else if (account.type === 'INVESTMENT' && account.net_worth_category === 'EXCLUDED') {
        console.log('  ✅ Investment account correctly overridden as EXCLUDED')
      } else {
        console.log('  ❌ Unexpected net_worth_category assignment')
      }
    }

    return createdAccounts
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Account Management API Tests...')

    try {
      await this.setup()

      // Test basic CRUD operations
      await this.testGetAccounts()

      // Test net_worth_category functionality
      const testAccounts = await this.testNetWorthCategoryFunctionality()

      if (testAccounts.length > 0) {
        const firstAccount = testAccounts[0]

        // Test individual account operations
        await this.testGetAccount(firstAccount.id)
        await this.testUpdateAccount(firstAccount.id, {
          name: 'Updated Test Account',
          net_worth_category: 'LIABILITY'
        })

        // Test net worth calculation
        await this.testGetNetWorth()

        // Test reconciliation
        await this.testReconcileAccount(firstAccount.id)
      }

      console.log('\n🎉 All tests completed!')

    } catch (error) {
      console.error('💥 Test suite failed:', error)
    } finally {
      await this.cleanup()
      await prisma.$disconnect()
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new AccountAPITester()
  tester.runAllTests().catch(console.error)
}

export { AccountAPITester }
