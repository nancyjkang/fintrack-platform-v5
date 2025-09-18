#!/usr/bin/env tsx

/**
 * Script to verify cube updates after bulk operations
 * Usage: npx tsx scripts/verify-cube-update.ts <tenant-id>
 */

import { PrismaClient } from '@prisma/client'
import { CubeService } from '../src/lib/services/cube'

const prisma = new PrismaClient()

async function verifyCubeUpdate(tenantId: string) {
  try {
    console.log(`🔍 Verifying cube status for tenant: ${tenantId}`)
    console.log('=' .repeat(50))

    const cubeService = new CubeService()

    // Get comprehensive cube statistics
    const stats = await cubeService.getCubeStatistics(tenantId)

    console.log('📊 Cube Statistics:')
    console.log(`   Total Records: ${stats.totalRecords}`)
    console.log(`   Weekly Records: ${stats.weeklyRecords}`)
    console.log(`   Monthly Records: ${stats.monthlyRecords}`)
    console.log(`   Account Count: ${stats.accountCount}`)
    console.log(`   Category Count: ${stats.categoryCount}`)
    console.log(`   Date Range: ${stats.dateRange.earliest} → ${stats.dateRange.latest}`)
    console.log(`   Last Updated: ${stats.lastUpdated}`)

    // Get recent cube records (last 10)
    console.log('\n🕒 Recent Cube Records:')
    const recentRecords = await prisma.financialCube.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        period_type: true,
        period_start: true,
        transaction_type: true,
        category_id: true,
        total_amount: true,
        transaction_count: true,
        created_at: true
      }
    })

    recentRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.period_type} ${record.period_start.toISOString().split('T')[0]} | ${record.transaction_type} | Cat:${record.category_id} | $${record.total_amount} (${record.transaction_count} txns) | ${record.created_at.toISOString()}`)
    })

    // Check for any inconsistencies
    console.log('\n🔍 Consistency Check:')
    const totalTransactions = await prisma.transaction.count({
      where: { tenant_id: tenantId }
    })

    console.log(`   Total Transactions in DB: ${totalTransactions}`)
    console.log(`   Total Cube Records: ${stats.totalRecords}`)

    if (stats.totalRecords === 0 && totalTransactions > 0) {
      console.log('   ⚠️  WARNING: You have transactions but no cube records!')
      console.log('   💡 Consider running: npx tsx scripts/populate-cube.ts')
    } else if (stats.totalRecords > 0) {
      console.log('   ✅ Cube appears to be populated')
    }

    console.log('\n✅ Verification complete!')

  } catch (error) {
    console.error('❌ Error verifying cube:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get tenant ID from command line args
const tenantId = process.argv[2]

if (!tenantId) {
  console.error('❌ Please provide a tenant ID')
  console.log('Usage: npx tsx scripts/verify-cube-update.ts <tenant-id>')
  process.exit(1)
}

verifyCubeUpdate(tenantId)
