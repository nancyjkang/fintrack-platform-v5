#!/usr/bin/env npx tsx

/**
 * Create missing balance anchors for accounts
 * 
 * This script identifies accounts that don't have balance anchors and creates them
 * using the account's current balance and balance_date as the anchor point.
 */

import { prisma } from '../src/lib/prisma'
import { getCurrentUTCDate, toUTCDateString } from '../src/lib/utils/date-utils'

async function createMissingBalanceAnchors() {
  console.log('🔍 Checking for accounts missing balance anchors...')
  
  try {
    // Get all accounts
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        tenant_id: true,
        name: true,
        balance: true,
        balance_date: true,
        created_at: true
      }
    })
    
    console.log(`📊 Found ${accounts.length} total accounts`)
    
    // Check which accounts have balance anchors
    const accountsWithAnchors = await prisma.accountBalanceAnchor.findMany({
      select: {
        account_id: true,
        tenant_id: true
      },
      distinct: ['account_id', 'tenant_id']
    })
    
    const accountsWithAnchorSet = new Set(
      accountsWithAnchors.map(a => `${a.account_id}-${a.tenant_id}`)
    )
    
    console.log(`⚓ Found ${accountsWithAnchorSet.size} accounts with existing anchors`)
    
    // Find accounts missing anchors
    const accountsMissingAnchors = accounts.filter(account => 
      !accountsWithAnchorSet.has(`${account.id}-${account.tenant_id}`)
    )
    
    console.log(`❌ Found ${accountsMissingAnchors.length} accounts missing balance anchors:`)
    
    for (const account of accountsMissingAnchors) {
      console.log(`  - Account ${account.id}: "${account.name}" (Balance: $${account.balance}, Date: ${account.balance_date})`)
    }
    
    if (accountsMissingAnchors.length === 0) {
      console.log('✅ All accounts have balance anchors!')
      return
    }
    
    // Create missing anchors
    console.log('\n🔧 Creating missing balance anchors...')
    
    const anchorsToCreate = accountsMissingAnchors.map(account => ({
      tenant_id: account.tenant_id,
      account_id: account.id,
      anchor_date: account.balance_date || account.created_at,
      balance: account.balance
    }))
    
    const result = await prisma.accountBalanceAnchor.createMany({
      data: anchorsToCreate,
      skipDuplicates: true
    })
    
    console.log(`✅ Created ${result.count} balance anchors`)
    
    // Verify the anchors were created
    console.log('\n🔍 Verifying created anchors...')
    for (const account of accountsMissingAnchors) {
      const anchor = await prisma.accountBalanceAnchor.findFirst({
        where: {
          account_id: account.id,
          tenant_id: account.tenant_id
        },
        orderBy: {
          anchor_date: 'desc'
        }
      })
      
      if (anchor) {
        console.log(`✅ Account ${account.id} ("${account.name}"): Anchor created for ${toUTCDateString(anchor.anchor_date)} = $${anchor.balance}`)
      } else {
        console.log(`❌ Account ${account.id} ("${account.name}"): Failed to create anchor`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating balance anchors:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMissingBalanceAnchors().catch(console.error)
