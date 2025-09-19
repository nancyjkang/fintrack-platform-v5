#!/usr/bin/env tsx

/**
 * Verify January 2025 transaction totals
 */

import { PrismaClient } from '@prisma/client'
import { createUTCDate } from '../src/lib/utils/date-utils'

const prisma = new PrismaClient()

async function verifyJanuaryTotals() {
  console.log('🔍 Verifying January 2025 transaction totals...\n')

  try {
    const tenantId = 'cmfqv0wxd0002u2tkktynie6k' // Family Finance tenant

    // Get January 2025 transactions
    const januaryTransactions = await prisma.transaction.findMany({
      where: {
        account: {
          tenant_id: tenantId
        },
        date: {
          gte: createUTCDate(2025, 0, 1),
          lte: createUTCDate(2025, 0, 31)
        }
      },
      select: {
        id: true,
        date: true,
        amount: true,
        type: true,
        description: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    console.log(`📊 Found ${januaryTransactions.length} transactions in January 2025`)

    // Calculate totals by type
    const totals = {
      INCOME: 0,
      EXPENSE: 0,
      TRANSFER: 0,
      ALL: 0
    }

    const categoryTotals = new Map<string, number>()

    januaryTransactions.forEach(txn => {
      const amount = Number(txn.amount)
      totals[txn.type as keyof typeof totals] += amount
      totals.ALL += amount

      const categoryName = txn.category?.name || 'Uncategorized'
      categoryTotals.set(categoryName, (categoryTotals.get(categoryName) || 0) + amount)
    })

    console.log('\n💰 JANUARY 2025 TOTALS:')
    console.log(`   Income: $${totals.INCOME.toFixed(2)}`)
    console.log(`   Expenses: $${totals.EXPENSE.toFixed(2)}`)
    console.log(`   Transfers: $${totals.TRANSFER.toFixed(2)}`)
    console.log(`   Net Total: $${totals.ALL.toFixed(2)}`)

    console.log('\n📊 TOP EXPENSE CATEGORIES:')
    const expenseCategories = Array.from(categoryTotals.entries())
      .filter(([_, amount]) => amount < 0) // Expenses are negative
      .sort(([_, a], [__, b]) => a - b) // Sort by amount (most negative first)
      .slice(0, 10)

    expenseCategories.forEach(([category, amount]) => {
      console.log(`   ${category}: $${Math.abs(amount).toFixed(2)}`)
    })

    // Show sample transactions
    console.log('\n📝 SAMPLE JANUARY TRANSACTIONS:')
    januaryTransactions.slice(0, 10).forEach(txn => {
      console.log(`   ${txn.date.toISOString().split('T')[0]} | ${txn.type} | $${Number(txn.amount).toFixed(2)} | ${txn.category?.name || 'Uncategorized'} | ${txn.description.substring(0, 40)}...`)
    })

    if (januaryTransactions.length > 10) {
      console.log(`   ... and ${januaryTransactions.length - 10} more transactions`)
    }

    // Check what the financial cube shows for January
    console.log('\n💾 FINANCIAL CUBE DATA FOR JANUARY:')
    const cubeData = await prisma.financialCube.findMany({
      where: {
        tenant_id: tenantId,
        period_start: {
          gte: createUTCDate(2025, 0, 1),
          lte: createUTCDate(2025, 0, 31)
        }
      },
      select: {
        period_start: true,
        transaction_type: true,
        category_name: true,
        total_amount: true,
        transaction_count: true
      },
      orderBy: [
        { period_start: 'asc' },
        { transaction_type: 'asc' },
        { category_name: 'asc' }
      ]
    })

    console.log(`   Found ${cubeData.length} cube records for January`)

    const cubeExpenseTotal = cubeData
      .filter(record => record.transaction_type === 'EXPENSE')
      .reduce((sum, record) => sum + Number(record.total_amount), 0)

    console.log(`   Cube EXPENSE total: $${cubeExpenseTotal.toFixed(2)}`)
    console.log(`   Raw transactions EXPENSE total: $${totals.EXPENSE.toFixed(2)}`)
    console.log(`   Match: ${Math.abs(cubeExpenseTotal - totals.EXPENSE) < 0.01 ? '✅' : '❌'}`)

  } catch (error) {
    console.error('❌ Error verifying January totals:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the verification
verifyJanuaryTotals().catch(console.error)
