import { NextRequest, NextResponse } from 'next/server'
import { AccountService } from '@/lib/services/account'
import { verifyAuth } from '@/lib/auth'

/**
 * GET /api/accounts/net-worth - Calculate net worth for the authenticated user's tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and get tenant context
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { tenantId } = user

    // Calculate net worth
    const netWorth = await AccountService.calculateNetWorth(tenantId)

    // Get breakdown by category for additional insights
    const assets = await AccountService.getAccountsByNetWorthCategory('ASSET', tenantId)
    const liabilities = await AccountService.getAccountsByNetWorthCategory('LIABILITY', tenantId)
    const excluded = await AccountService.getAccountsByNetWorthCategory('EXCLUDED', tenantId)

    const totalAssets = assets.reduce((sum, account) => sum + Number(account.balance), 0)
    const totalLiabilities = liabilities.reduce((sum, account) => sum + Number(account.balance), 0)

    return NextResponse.json({ 
      success: true, 
      data: {
        netWorth,
        breakdown: {
          totalAssets,
          totalLiabilities: Math.abs(totalLiabilities),
          excludedAccounts: excluded.length
        },
        accountCounts: {
          assets: assets.length,
          liabilities: liabilities.length,
          excluded: excluded.length,
          total: assets.length + liabilities.length + excluded.length
        }
      }
    })
  } catch (error) {
    console.error('GET /api/accounts/net-worth error:', error)
    return NextResponse.json({ 
      error: 'Failed to calculate net worth',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
