#!/usr/bin/env tsx

/**
 * Debug trends data discrepancies
 * Compare financial cube vs raw transactions for a specific category/period
 */

import { PrismaClient } from '@prisma/client'
import { endOfWeek, endOfMonth, addMonths, addDays } from 'date-fns'
import { createUTCDate } from '../src/lib/utils/date-utils'

const prisma = new PrismaClient()

async function debugTrendsData() {
  console.log('🔍 Debugging trends data discrepancies...\n')

  try {
    // Test case: Uncategorized transactions for Dec 2024
    const categoryId = null // Uncategorized
    const periodStart = createUTCDate(2024, 11, 1)
    const periodEnd = endOfMonth(periodStart) // Dec 31, 2024
    const tenantId = 'demo-tenant' // Adjust if needed

    console.log(`📊 Test Case: Uncategorized transactions`)
    console.log(`   Period: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`)
    console.log(`   Category ID: ${categoryId}`)
    console.log(`   Tenant: ${tenantId}\n`)

    // 1. Check Financial Cube data
    console.log('💾 FINANCIAL CUBE DATA:')
    const cubeData = await prisma.financialCube.findMany({
      where: {
        tenant_id: tenantId,
        category_id: categoryId,
        period_start: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      select: {
        period_start: true,
        period_end: true,
        period_type: true,
        transaction_type: true,
        category_name: true,
        total_amount: true,
        transaction_count: true,
        is_recurring: true
      },
      orderBy: [
        { period_start: 'asc' },
        { transaction_type: 'asc' }
      ]
    })

    console.log(`   Found ${cubeData.length} cube records:`)
    cubeData.forEach(record => {
      console.log(`   - ${record.period_start.toISOString().split('T')[0]} | ${record.transaction_type} | $${record.total_amount} | ${record.transaction_count} txns | Recurring: ${record.is_recurring}`)
    })

    const cubeTotal = cubeData.reduce((sum, r) => sum + Number(r.total_amount), 0)
    const cubeTxnCount = cubeData.reduce((sum, r) => sum + r.transaction_count, 0)
    console.log(`   CUBE TOTALS: $${cubeTotal.toFixed(2)} | ${cubeTxnCount} transactions\n`)

    // 2. Check Raw Transactions data
    console.log('📝 RAW TRANSACTIONS DATA:')
    const rawTransactions = await prisma.transaction.findMany({
      where: {
        account: {
          tenant_id: tenantId
        },
        category_id: categoryId,
        date: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      select: {
        id: true,
        date: true,
        amount: true,
        type: true,
        description: true,
        merchant: true,
        is_recurring: true,
        category_id: true
      },
      orderBy: { date: 'asc' }
    })

    console.log(`   Found ${rawTransactions.length} raw transactions:`)
    rawTransactions.slice(0, 10).forEach(txn => {
      console.log(`   - ${txn.date.toISOString().split('T')[0]} | ${txn.type} | $${txn.amount} | ${txn.merchant || 'No merchant'} | ${txn.description.substring(0, 50)}...`)
    })

    if (rawTransactions.length > 10) {
      console.log(`   ... and ${rawTransactions.length - 10} more`)
    }

    const rawTotal = rawTransactions.reduce((sum, txn) => sum + Number(txn.amount), 0)
    const rawWithMerchant = rawTransactions.filter(txn => txn.merchant !== null)
    console.log(`   RAW TOTALS: $${rawTotal.toFixed(2)} | ${rawTransactions.length} transactions`)
    console.log(`   WITH MERCHANT: ${rawWithMerchant.length} transactions | $${rawWithMerchant.reduce((sum, txn) => sum + Number(txn.amount), 0).toFixed(2)}\n`)

    // 3. Compare by transaction type
    console.log('🔄 BREAKDOWN BY TRANSACTION TYPE:')
    const types = ['INCOME', 'EXPENSE', 'TRANSFER']

    for (const type of types) {
      const cubeForType = cubeData.filter(r => r.transaction_type === type)
      const rawForType = rawTransactions.filter(txn => txn.type === type)

      const cubeAmount = cubeForType.reduce((sum, r) => sum + Number(r.total_amount), 0)
      const rawAmount = rawForType.reduce((sum, txn) => sum + Number(txn.amount), 0)

      console.log(`   ${type}:`)
      console.log(`     Cube: $${cubeAmount.toFixed(2)} | ${cubeForType.reduce((sum, r) => sum + r.transaction_count, 0)} txns`)
      console.log(`     Raw:  $${rawAmount.toFixed(2)} | ${rawForType.length} txns`)
      console.log(`     Match: ${Math.abs(cubeAmount - rawAmount) < 0.01 ? '✅' : '❌'}`)
    }

    console.log('\n🎯 SUMMARY:')
    console.log(`   Cube vs Raw Amount: ${Math.abs(cubeTotal - rawTotal) < 0.01 ? '✅ MATCH' : '❌ MISMATCH'}`)
    console.log(`   Cube vs Raw Count: ${cubeTxnCount === rawTransactions.length ? '✅ MATCH' : '❌ MISMATCH'}`)

    if (Math.abs(cubeTotal - rawTotal) >= 0.01) {
      console.log(`   Difference: $${(cubeTotal - rawTotal).toFixed(2)}`)
    }

  } catch (error) {
    console.error('❌ Error debugging trends data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the debug
debugTrendsData().catch(console.error)
