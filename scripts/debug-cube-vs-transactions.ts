#!/usr/bin/env npx tsx

/**
 * Debug script to compare cube data vs raw transaction data for a specific date range
 * This helps identify discrepancies in the trends calculations
 */

import { prisma } from '../src/lib/prisma'
import { parseAndConvertToUTC } from '../src/lib/utils/date-utils'

async function debugCubeVsTransactions() {
  const tenantId = 'cmfqv0wxd0002u2tkktynie6k' // Your active tenant
  const startDate = parseAndConvertToUTC('2025-06-21')
  const endDate = parseAndConvertToUTC('2025-09-19')
  
  console.log('🔍 Debugging Cube vs Transactions')
  console.log('📅 Date Range:', {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  })
  console.log('🏢 Tenant:', tenantId)
  console.log('')

  // 1. Check raw transactions in this date range
  console.log('📊 RAW TRANSACTIONS:')
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
      type: true
    },
    orderBy: { date: 'asc' }
  })

  console.log(`Found ${rawTransactions.length} raw EXPENSE transactions`)
  if (rawTransactions.length > 0) {
    const totalAmount = rawTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    console.log(`Total raw amount: $${totalAmount.toFixed(2)}`)
    console.log('Date range of transactions:', {
      earliest: rawTransactions[0].date.toISOString().split('T')[0],
      latest: rawTransactions[rawTransactions.length - 1].date.toISOString().split('T')[0]
    })
    
    // Show sample transactions
    console.log('\nSample transactions:')
    rawTransactions.slice(0, 5).forEach(t => {
      console.log(`  ${t.date.toISOString().split('T')[0]} | $${Number(t.amount).toFixed(2)} | ${t.description.substring(0, 50)}`)
    })
  }
  console.log('')

  // 2. Check cube data for the same period
  console.log('🧊 CUBE DATA:')
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
    orderBy: { period_start: 'asc' }
  })

  console.log(`Found ${cubeData.length} cube records`)
  if (cubeData.length > 0) {
    const totalCubeAmount = cubeData.reduce((sum, c) => sum + Number(c.total_amount), 0)
    console.log(`Total cube amount: $${totalCubeAmount.toFixed(2)}`)
    console.log('Date range of cube data:', {
      earliest: cubeData[0].period_start.toISOString().split('T')[0],
      latest: cubeData[cubeData.length - 1].period_start.toISOString().split('T')[0]
    })
    
    // Show sample cube records
    console.log('\nSample cube records:')
    cubeData.slice(0, 5).forEach(c => {
      console.log(`  ${c.period_start.toISOString().split('T')[0]} | ${c.period_type} | ${c.category_name} | $${Number(c.total_amount).toFixed(2)} (${c.transaction_count} txns)`)
    })
  }
  console.log('')

  // 3. Compare the totals
  if (rawTransactions.length > 0 && cubeData.length > 0) {
    const rawTotal = rawTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const cubeTotal = cubeData.reduce((sum, c) => sum + Number(c.total_amount), 0)
    const difference = Math.abs(rawTotal - cubeTotal)
    
    console.log('💰 COMPARISON:')
    console.log(`Raw transactions total: $${rawTotal.toFixed(2)}`)
    console.log(`Cube data total: $${cubeTotal.toFixed(2)}`)
    console.log(`Difference: $${difference.toFixed(2)}`)
    
    if (difference > 0.01) {
      console.log('⚠️  DISCREPANCY DETECTED!')
      
      // Check if cube data is stale
      const latestTransaction = rawTransactions[rawTransactions.length - 1]
      const latestCube = cubeData[cubeData.length - 1]
      
      console.log('\n🕐 FRESHNESS CHECK:')
      console.log(`Latest transaction: ${latestTransaction.date.toISOString()}`)
      console.log(`Latest cube record: ${latestCube.period_start.toISOString()}`)
      
      // Check for missing periods in cube
      const transactionMonths = new Set(rawTransactions.map(t => 
        t.date.toISOString().substring(0, 7) // YYYY-MM
      ))
      const cubeMonths = new Set(cubeData.map(c => 
        c.period_start.toISOString().substring(0, 7) // YYYY-MM
      ))
      
      console.log('\n📅 PERIOD COVERAGE:')
      console.log('Transaction months:', Array.from(transactionMonths).sort())
      console.log('Cube months:', Array.from(cubeMonths).sort())
      
      const missingInCube = Array.from(transactionMonths).filter(m => !cubeMonths.has(m))
      if (missingInCube.length > 0) {
        console.log('❌ Missing in cube:', missingInCube)
      }
    } else {
      console.log('✅ Totals match!')
    }
  } else if (rawTransactions.length === 0) {
    console.log('ℹ️  No raw transactions found in this date range')
  } else if (cubeData.length === 0) {
    console.log('ℹ️  No cube data found in this date range')
  }

  await prisma.$disconnect()
}

debugCubeVsTransactions().catch(console.error)

