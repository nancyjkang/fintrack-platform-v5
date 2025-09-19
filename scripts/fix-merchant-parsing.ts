#!/usr/bin/env tsx

/**
 * Fix merchant parsing for existing transactions
 * This script re-parses merchant names using the updated logic
 */

import { PrismaClient } from '@prisma/client'
import { extractMerchantName } from '../src/lib/utils/merchant-parser'

const prisma = new PrismaClient()

async function fixMerchantParsing() {
  console.log('🔧 Starting merchant parsing fix...')

  try {
    // Get all transactions that currently have merchant data
    const transactions = await prisma.transaction.findMany({
      where: {
        merchant: {
          not: null
        }
      },
      select: {
        id: true,
        description: true,
        merchant: true
      }
    })

    console.log(`📊 Found ${transactions.length} transactions with merchant data`)

    let updatedCount = 0
    let nullifiedCount = 0

    // Process in batches
    const batchSize = 100
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)

      const updates = batch.map(transaction => {
        const newMerchant = extractMerchantName(transaction.description)

        if (newMerchant !== transaction.merchant) {
          if (newMerchant === null) {
            nullifiedCount++
          } else {
            updatedCount++
          }

          return prisma.transaction.update({
            where: { id: transaction.id },
            data: { merchant: newMerchant }
          })
        }
        return null
      }).filter(Boolean)

      if (updates.length > 0) {
        await Promise.all(updates)
        console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transactions.length / batchSize)}`)
      }
    }

    console.log(`🎉 Merchant parsing fix completed!`)
    console.log(`   - Updated: ${updatedCount} transactions`)
    console.log(`   - Nullified: ${nullifiedCount} transactions (no valid merchant found)`)
    console.log(`   - Unchanged: ${transactions.length - updatedCount - nullifiedCount} transactions`)

  } catch (error) {
    console.error('❌ Error fixing merchant parsing:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixMerchantParsing().catch(console.error)

