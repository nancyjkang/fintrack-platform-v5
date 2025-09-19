#!/usr/bin/env tsx

/**
 * Clean stale financial cube data and regenerate from actual transaction dates
 */

import { PrismaClient } from '@prisma/client'
import { CubeService } from '../src/lib/services/cube/cube.service'

const prisma = new PrismaClient()
const cubeService = new CubeService()

async function cleanStaleCubeData() {
  console.log('🧹 Cleaning stale financial cube data...\n')

  try {
    const tenantId = 'cmfqv0wxd0002u2tkktynie6k' // Family Finance tenant

    // 1. Get the earliest transaction date
    const earliestTransaction = await prisma.transaction.findFirst({
      where: {
        account: {
          tenant_id: tenantId
        }
      },
      orderBy: {
        date: 'asc'
      },
      select: {
        date: true
      }
    })

    if (!earliestTransaction) {
      console.log('❌ No transactions found for tenant')
      return
    }

    const transactionStartDate = earliestTransaction.date
    console.log(`📅 Earliest transaction date: ${transactionStartDate.toISOString().split('T')[0]}`)

    // 2. Find stale cube data (before earliest transaction)
    const staleCubeData = await prisma.financialCube.findMany({
      where: {
        tenant_id: tenantId,
        period_start: {
          lt: transactionStartDate
        }
      },
      select: {
        id: true,
        period_start: true,
        total_amount: true
      }
    })

    console.log(`🗑️  Found ${staleCubeData.length} stale cube records to delete:`)
    staleCubeData.forEach(record => {
      console.log(`   - ${record.period_start.toISOString().split('T')[0]}: $${Number(record.total_amount).toFixed(2)}`)
    })

    if (staleCubeData.length === 0) {
      console.log('✅ No stale cube data found!')
      return
    }

    // 3. Delete stale cube data
    console.log('\n🗑️  Deleting stale cube data...')
    const deleteResult = await prisma.financialCube.deleteMany({
      where: {
        tenant_id: tenantId,
        period_start: {
          lt: transactionStartDate
        }
      }
    })

    console.log(`✅ Deleted ${deleteResult.count} stale cube records`)

    // 4. Regenerate cube data from actual transaction dates
    console.log('\n🔄 Regenerating cube data from actual transaction dates...')

    const latestTransaction = await prisma.transaction.findFirst({
      where: {
        account: {
          tenant_id: tenantId
        }
      },
      orderBy: {
        date: 'desc'
      },
      select: {
        date: true
      }
    })

    if (latestTransaction) {
      console.log(`📅 Transaction date range: ${transactionStartDate.toISOString().split('T')[0]} to ${latestTransaction.date.toISOString().split('T')[0]}`)

      // Regenerate cube for the date range
      await cubeService.regenerateCubeForDateRange(tenantId, transactionStartDate, latestTransaction.date)

      console.log('✅ Cube data regenerated successfully!')
    }

    // 5. Verify the fix
    console.log('\n🔍 Verifying the fix...')
    const newCubeRange = await prisma.financialCube.aggregate({
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

    console.log(`📊 New cube data range:`)
    console.log(`   Records: ${newCubeRange._count.id}`)
    console.log(`   Start: ${newCubeRange._min.period_start?.toISOString().split('T')[0] || 'None'}`)
    console.log(`   End: ${newCubeRange._max.period_start?.toISOString().split('T')[0] || 'None'}`)

    const cubeStartsAfterTransactions = newCubeRange._min.period_start &&
      newCubeRange._min.period_start >= transactionStartDate

    console.log(`✅ Cube now starts ${cubeStartsAfterTransactions ? 'on or after' : 'before'} transaction start date`)

  } catch (error) {
    console.error('❌ Error cleaning stale cube data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanStaleCubeData().catch(console.error)
