#!/usr/bin/env tsx

/**
 * Diagnose date mismatch between transactions and financial cube
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnoseDateMismatch() {
  console.log('🔍 Diagnosing date mismatch between transactions and financial cube...\n')
  
  try {
    const tenantId = 'cmfqv0wxd0002u2tkktynie6k' // Family Finance tenant
    
    // 1. Check transaction date range
    console.log('📝 TRANSACTION DATE RANGE:')
    const transactionDateRange = await prisma.transaction.aggregate({
      where: {
        account: {
          tenant_id: tenantId
        }
      },
      _min: {
        date: true
      },
      _max: {
        date: true
      },
      _count: {
        id: true
      }
    })
    
    console.log(`   Total Transactions: ${transactionDateRange._count.id}`)
    console.log(`   Earliest Transaction: ${transactionDateRange._min.date?.toISOString().split('T')[0] || 'None'}`)
    console.log(`   Latest Transaction: ${transactionDateRange._max.date?.toISOString().split('T')[0] || 'None'}`)
    
    // 2. Check financial cube date range
    console.log('\n💾 FINANCIAL CUBE DATE RANGE:')
    const cubeeDateRange = await prisma.financialCube.aggregate({
      where: {
        tenant_id: tenantId
      },
      _min: {
        period_start: true
      },
      _max: {
        period_start: true
      },
      _count: {
        id: true
      }
    })
    
    console.log(`   Total Cube Records: ${cubeeDateRange._count.id}`)
    console.log(`   Earliest Period: ${cubeeDateRange._min.period_start?.toISOString().split('T')[0] || 'None'}`)
    console.log(`   Latest Period: ${cubeeDateRange._max.period_start?.toISOString().split('T')[0] || 'None'}`)
    
    // 3. Check for transactions by month
    console.log('\n📊 TRANSACTIONS BY MONTH:')
    const transactionsByMonth = await prisma.$queryRaw<Array<{
      month: string
      count: bigint
      total_amount: number
    }>>`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(*) as count,
        SUM(amount::numeric) as total_amount
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.tenant_id = ${tenantId}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `
    
    transactionsByMonth.forEach(row => {
      console.log(`   ${row.month}: ${Number(row.count)} transactions, $${Number(row.total_amount).toFixed(2)}`)
    })
    
    // 4. Check for cube records by month
    console.log('\n📊 CUBE RECORDS BY MONTH:')
    const cubeByMonth = await prisma.$queryRaw<Array<{
      month: string
      count: bigint
      total_amount: number
    }>>`
      SELECT 
        TO_CHAR(period_start, 'YYYY-MM') as month,
        COUNT(*) as count,
        SUM(total_amount::numeric) as total_amount
      FROM financial_cube
      WHERE tenant_id = ${tenantId}
      GROUP BY TO_CHAR(period_start, 'YYYY-MM')
      ORDER BY month
    `
    
    cubeByMonth.forEach(row => {
      console.log(`   ${row.month}: ${Number(row.count)} cube records, $${Number(row.total_amount).toFixed(2)}`)
    })
    
    // 5. Check for orphaned cube data (cube data without corresponding transactions)
    console.log('\n🔍 CHECKING FOR ORPHANED CUBE DATA:')
    const orphanedCubeData = await prisma.$queryRaw<Array<{
      period_start: Date
      cube_amount: number
      transaction_amount: number | null
    }>>`
      SELECT 
        fc.period_start,
        SUM(fc.total_amount::numeric) as cube_amount,
        (
          SELECT SUM(t.amount::numeric)
          FROM transactions t
          JOIN accounts a ON t.account_id = a.id
          WHERE a.tenant_id = ${tenantId}
            AND t.date >= fc.period_start
            AND t.date <= fc.period_end
        ) as transaction_amount
      FROM financial_cube fc
      WHERE fc.tenant_id = ${tenantId}
      GROUP BY fc.period_start, fc.period_end
      ORDER BY fc.period_start
      LIMIT 10
    `
    
    console.log('   Period Start | Cube Amount | Transaction Amount | Match')
    console.log('   -------------|-------------|-------------------|------')
    orphanedCubeData.forEach(row => {
      const cubeAmount = Number(row.cube_amount)
      const txnAmount = row.transaction_amount ? Number(row.transaction_amount) : 0
      const match = Math.abs(cubeAmount - txnAmount) < 0.01 ? '✅' : '❌'
      console.log(`   ${row.period_start.toISOString().split('T')[0]} | $${cubeAmount.toFixed(2).padStart(10)} | $${txnAmount.toFixed(2).padStart(16)} | ${match}`)
    })
    
    console.log('\n🎯 SUMMARY:')
    const transactionStart = transactionDateRange._min.date
    const cubeStart = cubeeDateRange._min.period_start
    
    if (transactionStart && cubeStart) {
      const daysDiff = Math.floor((transactionStart.getTime() - cubeStart.getTime()) / (1000 * 60 * 60 * 24))
      console.log(`   Date Mismatch: Cube starts ${daysDiff} days before transactions`)
      
      if (daysDiff > 0) {
        console.log('   🚨 ISSUE: Financial cube contains data from before your earliest transaction!')
        console.log('   💡 SOLUTION: Clear old cube data and regenerate from actual transaction dates')
      }
    }
    
  } catch (error) {
    console.error('❌ Error diagnosing date mismatch:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the diagnosis
diagnoseDateMismatch().catch(console.error)
