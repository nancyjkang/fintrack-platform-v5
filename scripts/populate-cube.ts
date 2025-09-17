#!/usr/bin/env tsx

/**
 * Script to populate the financial cube with historical transaction data
 * Usage: npx tsx scripts/populate-cube.ts [tenantId] [options]
 */

import { PrismaClient } from '@prisma/client'
import { cubeService } from '../src/lib/services/cube.service'
import { parseAndConvertToUTC, getCurrentUTCDate } from '../src/lib/utils/date-utils'

const prisma = new PrismaClient()

interface PopulateOptions {
  tenantId?: string
  startDate?: string
  endDate?: string
  clearExisting?: boolean
  batchSize?: number
  accountId?: number
  dryRun?: boolean
}

async function main() {
  const args = process.argv.slice(2)

  // Parse command line arguments
  const options: PopulateOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--tenant-id' && args[i + 1]) {
      options.tenantId = args[i + 1]
      i++
    } else if (arg === '--start-date' && args[i + 1]) {
      options.startDate = args[i + 1]
      i++
    } else if (arg === '--end-date' && args[i + 1]) {
      options.endDate = args[i + 1]
      i++
    } else if (arg === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1], 10)
      i++
    } else if (arg === '--clear-existing') {
      options.clearExisting = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (!options.tenantId && !arg.startsWith('--')) {
      options.tenantId = arg
    }
  }

  // Show usage if no tenant ID provided
  if (!options.tenantId) {
    console.log(`
Usage: npx tsx scripts/populate-cube.ts [tenantId] [options]

Options:
  --tenant-id <id>      Tenant ID to populate cube for
  --start-date <date>   Start date (YYYY-MM-DD format, optional)
  --end-date <date>     End date (YYYY-MM-DD format, optional)
  --batch-size <num>    Batch size for processing (default: 100)
  --clear-existing      Clear existing cube data before populating
  --dry-run            Show what would be done without actually doing it

Examples:
  npx tsx scripts/populate-cube.ts user123
  npx tsx scripts/populate-cube.ts user123 --start-date 2024-01-01 --clear-existing
  npx tsx scripts/populate-cube.ts --tenant-id user123 --batch-size 50 --dry-run
    `)
    process.exit(1)
  }

  try {
    console.log('🔍 Checking tenant and transaction data...')

    // Verify tenant exists and has transactions
    const tenant = await prisma.tenant.findUnique({
      where: { id: options.tenantId }
    })

    if (!tenant) {
      console.error(`❌ Tenant '${options.tenantId}' not found`)
      process.exit(1)
    }

    const transactionCount = await prisma.transaction.count({
      where: { tenant_id: options.tenantId }
    })

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`)
    console.log(`📊 Transaction count: ${transactionCount}`)

    if (transactionCount === 0) {
      console.log('⚠️  No transactions found for this tenant. Nothing to populate.')
      process.exit(0)
    }

    // Get current cube stats
    const currentStats = await cubeService.getCubeStats(options.tenantId)
    console.log(`📈 Current cube records: ${currentStats.totalRecords} (${currentStats.weeklyRecords} weekly, ${currentStats.monthlyRecords} monthly)`)

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made')

      // Show what would be processed
      const startDate = options.startDate ? parseAndConvertToUTC(options.startDate) : await getEarliestTransactionDate(options.tenantId)
      const endDate = options.endDate ? parseAndConvertToUTC(options.endDate) : getCurrentUTCDate()

      if (startDate) {
        console.log(`📅 Would process transactions from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
        console.log(`🔄 Batch size: ${options.batchSize || 100}`)
        console.log(`🗑️  Clear existing: ${options.clearExisting ? 'Yes' : 'No'}`)
      }

      process.exit(0)
    }

    // Confirm before proceeding if clearing existing data
    if (options.clearExisting && currentStats.totalRecords > 0) {
      console.log(`⚠️  This will delete ${currentStats.totalRecords} existing cube records!`)
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    console.log('🚀 Starting cube population...')

    const populateOptions = {
      startDate: options.startDate ? parseAndConvertToUTC(options.startDate) : undefined,
      endDate: options.endDate ? parseAndConvertToUTC(options.endDate) : undefined,
      clearExisting: options.clearExisting,
      batchSize: options.batchSize
    }

    const result = await cubeService.populateHistoricalData(options.tenantId, populateOptions)

    console.log('✅ Cube population completed!')
    console.log(`📊 Periods processed: ${result.periodsProcessed}`)
    console.log(`📈 Records created: ${result.recordsCreated}`)
    console.log(`⏱️  Time elapsed: ${(result.timeElapsed / 1000).toFixed(2)}s`)

    // Show final stats
    const finalStats = await cubeService.getCubeStats(options.tenantId)
    console.log(`📈 Final cube records: ${finalStats.totalRecords} (${finalStats.weeklyRecords} weekly, ${finalStats.monthlyRecords} monthly)`)

    if (finalStats.dateRange.earliest && finalStats.dateRange.latest) {
      console.log(`📅 Date range: ${finalStats.dateRange.earliest.toISOString().split('T')[0]} to ${finalStats.dateRange.latest.toISOString().split('T')[0]}`)
    }

  } catch (error) {
    console.error('❌ Error populating cube:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function getEarliestTransactionDate(tenantId: string): Promise<Date | null> {
  const result = await prisma.transaction.findFirst({
    where: { tenant_id: tenantId },
    select: { date: true },
    orderBy: { date: 'asc' }
  })

  return result?.date || null
}

// Run the script
main().catch(console.error)
