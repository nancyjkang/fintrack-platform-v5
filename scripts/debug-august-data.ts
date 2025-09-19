#!/usr/bin/env npx tsx

/**
 * Debug script to compare August 2025 cube data vs raw transaction data
 * Based on the screenshot showing 8 transactions totaling -$828.76
 */

import { prisma } from '../src/lib/prisma'
import { parseAndConvertToUTC } from '../src/lib/utils/date-utils'

async function debugAugustData() {
  const tenantId = 'cmfqv0wxd0002u2tkktynie6k'
  const startDate = parseAndConvertToUTC('2025-08-01')
  const endDate = parseAndConvertToUTC('2025-08-31')
  
  console.log('🔍 Debugging August 2025 Data')
  console.log('📅 Date Range: August 1-31, 2025')
  console.log('🏢 Tenant:', tenantId)
  console.log('🎯 Expected from UI: 8 transactions, -$828.76 total')
  console.log('')

  // 1. Check raw transactions for August 2025
  console.log('📊 RAW TRANSACTIONS (August 2025):')
  const rawTransactions = await prisma.transaction.findMany({
    where: {
      account: { tenant_id: tenantId },
      date: {
        gte: startDate,
        lte: endDate
      },
      type: 'EXPENSE'
    },
    select: {
      id: true,
      date: true,
      amount: true,
      description: true,
      category_id: true,
      account_id: true,
      type: true,
      category: {
        select: { name: true }
      },
      account: {
        select: { name: true }
      }
    },
    orderBy: { date: 'asc' }
  })

  console.log(`Found ${rawTransactions.length} raw EXPENSE transactions`)
  if (rawTransactions.length > 0) {
    const totalAmount = rawTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    console.log(`Total raw amount: $${totalAmount.toFixed(2)}`)
    
    console.log('\nAll August transactions:')
    rawTransactions.forEach((t, i) => {
      console.log(`  ${i+1}. ${t.date.toISOString().split('T')[0]} | $${Number(t.amount).toFixed(2)} | ${t.category?.name || 'Uncategorized'} | ${t.description.substring(0, 60)}`)
    })
  }
  console.log('')

  // 2. Check cube data for August 2025
  console.log('🧊 CUBE DATA (August 2025):')
  const cubeData = await prisma.financialCube.findMany({
    where: {
      tenant_id: tenantId,
      period_start: {
        gte: startDate,
        lte: endDate
      },
      transaction_type: 'EXPENSE'
    },
    select: {
      period_start: true,
      period_type: true,
      category_name: true,
      account_name: true,
      total_amount: true,
      transaction_count: true,
      is_recurring: true
    },
    orderBy: [
      { period_start: 'asc' },
      { category_name: 'asc' }
    ]
  })

  console.log(`Found ${cubeData.length} cube records`)
  if (cubeData.length > 0) {
    const totalCubeAmount = cubeData.reduce((sum, c) => sum + Number(c.total_amount), 0)
    const totalCubeCount = cubeData.reduce((sum, c) => sum + c.transaction_count, 0)
    console.log(`Total cube amount: $${totalCubeAmount.toFixed(2)}`)
    console.log(`Total cube transaction count: ${totalCubeCount}`)
    
    console.log('\nAll August cube records:')
    cubeData.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.period_start.toISOString().split('T')[0]} | ${c.period_type} | ${c.category_name} | ${c.account_name} | $${Number(c.total_amount).toFixed(2)} (${c.transaction_count} txns) | Recurring: ${c.is_recurring}`)
    })
  }
  console.log('')

  // 3. Compare with expected values from UI
  console.log('💰 COMPARISON WITH UI:')
  if (rawTransactions.length > 0) {
    const rawTotal = rawTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const expectedTotal = -828.76
    const expectedCount = 8
    
    console.log(`Expected (from UI): ${expectedCount} transactions, $${expectedTotal.toFixed(2)}`)
    console.log(`Raw transactions: ${rawTransactions.length} transactions, $${rawTotal.toFixed(2)}`)
    
    const countMatch = rawTransactions.length === expectedCount
    const amountMatch = Math.abs(rawTotal - expectedTotal) < 0.01
    
    console.log(`Count match: ${countMatch ? '✅' : '❌'}`)
    console.log(`Amount match: ${amountMatch ? '✅' : '❌'}`)
    
    if (!countMatch || !amountMatch) {
      console.log('⚠️  Raw data doesn\'t match UI expectations!')
    }
  }

  if (cubeData.length > 0) {
    const cubeTotal = cubeData.reduce((sum, c) => sum + Number(c.total_amount), 0)
    const cubeCount = cubeData.reduce((sum, c) => sum + c.transaction_count, 0)
    const expectedTotal = -828.76
    const expectedCount = 8
    
    console.log(`Cube data: ${cubeCount} transactions, $${cubeTotal.toFixed(2)}`)
    
    const cubeCountMatch = cubeCount === expectedCount
    const cubeAmountMatch = Math.abs(cubeTotal - expectedTotal) < 0.01
    
    console.log(`Cube count match: ${cubeCountMatch ? '✅' : '❌'}`)
    console.log(`Cube amount match: ${cubeAmountMatch ? '✅' : '❌'}`)
    
    if (!cubeCountMatch || !cubeAmountMatch) {
      console.log('⚠️  Cube data doesn\'t match UI expectations!')
    }
  }

  // 4. Test the trends API for August
  console.log('\n🌐 TESTING TRENDS API:')
  try {
    const { cubeService } = await import('../src/lib/services/cube/cube.service')
    
    const trendsData = await cubeService.getTrends(tenantId, {
      periodType: 'MONTHLY',
      startDate: startDate,
      endDate: endDate,
      transactionType: 'EXPENSE'
    })
    
    console.log(`Trends API returned ${trendsData.length} records`)
    if (trendsData.length > 0) {
      const apiTotal = trendsData.reduce((sum, t) => sum + Number(t.total_amount), 0)
      const apiCount = trendsData.reduce((sum, t) => sum + t.transaction_count, 0)
      console.log(`API total: $${apiTotal.toFixed(2)} (${apiCount} transactions)`)
      
      console.log('\nAPI records:')
      trendsData.forEach((t, i) => {
        console.log(`  ${i+1}. ${t.period_start.toISOString().split('T')[0]} | ${t.category_name} | ${t.account_name} | $${Number(t.total_amount).toFixed(2)} (${t.transaction_count} txns)`)
      })
    }
  } catch (error) {
    console.error('Error testing trends API:', error)
  }

  await prisma.$disconnect()
}

debugAugustData().catch(console.error)
