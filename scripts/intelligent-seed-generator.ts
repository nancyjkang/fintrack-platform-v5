/**
 * FinTrack v5 - Intelligent Seed Generation Script
 *
 * Generates realistic financial data based on configurable JSON parameters
 * including avatar personas, date ranges, and merchant variety.
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'
import { createUTCDate, getCurrentUTCDate, addDays, subtractDays } from '../src/lib/utils/date-utils'

const prisma = new PrismaClient()

interface SeedConfig {
  dateRange: {
    startDate: string
    endDate: string
  }
  categories: Array<{
    name: string
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  }>
  accounts: Record<string, {
    name: string
    initialBalance: number
    type: string
    color: string
    anchorDate: string
  }>
  patterns: {
    transactionFrequency: string
    seasonalAdjustments: boolean
    recurringTransactions: boolean
  }
  transfers: {
    enabled: boolean
    types: Array<{
      name: string
      fromAccount: string
      toAccount: string
      frequency: string
      amount: number | string
      description: string
    }>
  }
  user: {
    email: string
    name: string
    tenantName: string
    avatar: string
  }
  avatarSettings: {
    [key: string]: {
      incomeRange: Record<string, any>
      merchants: Record<string, string[]>
      savingsRate: number
      creditCardUsage: string
      investmentFocus: string
    }
  }
}

/**
 * Parse intelligent date strings like "today", "-6months", etc.
 */
function parseIntelligentDate(dateStr: string): Date {
  if (dateStr === 'today') {
    return getCurrentUTCDate()
  }

  if (dateStr === 'yesterday') {
    return subtractDays(getCurrentUTCDate(), 1)
  }

  // Handle relative dates like "-6months", "-30days", "+7days"
  const relativeMatch = dateStr.match(/^([+-])(\d+)(days?|months?|years?)$/)
  if (relativeMatch) {
    const [, sign, amount, unit] = relativeMatch
    const num = parseInt(amount)
    const isNegative = sign === '-'
    const today = getCurrentUTCDate()

    switch (unit) {
      case 'day':
      case 'days':
        return isNegative ? subtractDays(today, num) : addDays(today, num)
      case 'month':
      case 'months':
        const monthDate = createUTCDate(today.getFullYear(), today.getMonth(), today.getDate())!
        monthDate.setMonth(monthDate.getMonth() + (isNegative ? -num : num))
        return monthDate
      case 'year':
      case 'years':
        const yearDate = createUTCDate(today.getFullYear(), today.getMonth(), today.getDate())
        yearDate.setFullYear(yearDate.getFullYear() + (isNegative ? -num : num))
        return yearDate
      default:
        throw new Error(`Unsupported date unit: ${unit}`)
    }
  }

  // Handle ISO date strings (YYYY-MM-DD format)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const year = parseInt(isoMatch[1])
    const month = parseInt(isoMatch[2]) - 1 // Month is 0-indexed
    const day = parseInt(isoMatch[3])
    return createUTCDate(year, month, day)
  }

  throw new Error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD, "today", "yesterday", or relative formats like "-6months"`)
}

/**
 * Load and validate seed configuration
 */
function loadSeedConfig(): SeedConfig {
  const configPath = path.join(process.cwd(), 'prisma', 'seed-config.json')

  if (!fs.existsSync(configPath)) {
    throw new Error(`Seed configuration not found at: ${configPath}`)
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configContent) as SeedConfig

    // Validate required fields
    if (!config.dateRange || !config.categories || !config.accounts || !config.user) {
      throw new Error('Invalid seed configuration: missing required fields')
    }

    return config
  } catch (error) {
    throw new Error(`Failed to parse seed configuration: ${error}`)
  }
}

/**
 * Generate random amount based on category and merchant
 */
function generateTransactionAmount(
  categoryName: string,
  categoryType: 'INCOME' | 'EXPENSE' | 'TRANSFER',
  merchant: string,
  avatar: string
): number {
  // Base amount ranges by category type
  const amountRanges: Record<string, { min: number; max: number }> = {
    // Income amounts
    'Salary': { min: 4500, max: 6500 },
    'Side Hustle': { min: 150, max: 800 },
    'Other Income': { min: 50, max: 300 },

    // Expense amounts by category
    'Bills & Utilities': { min: 45, max: 250 },
    'Food & Dining': { min: 8, max: 85 },
    'Housing': { min: 1800, max: 2500 },
    'Services': { min: 12, max: 150 },
    'Health': { min: 15, max: 200 },
    'Fun Money': { min: 9, max: 120 },
    'Other Expenses': { min: 5, max: 75 },

    // Transfer amounts
    'System Transfer': { min: 100, max: 1000 },
    'Credit Card Payment': { min: 200, max: 1500 },
    'Roth IRA': { min: 400, max: 600 }
  }

  const range = amountRanges[categoryName] || { min: 10, max: 100 }
  const baseAmount = Math.random() * (range.max - range.min) + range.min

  // Apply category type multiplier
  let amount = baseAmount
  if (categoryType === 'EXPENSE') {
    amount = -amount // Ensure expenses are negative (amount is always positive from baseAmount)
  }
  // Note: TRANSFER amounts are handled separately in paired transactions

  // Round to 2 decimal places
  return Math.round(amount * 100) / 100
}

/**
 * Get random merchant for a category
 */
function getRandomMerchant(categoryName: string, avatarSettings: any): string {
  const merchants = avatarSettings.merchants[categoryName]
  if (!merchants || merchants.length === 0) {
    return `${categoryName} Transaction`
  }

  return merchants[Math.floor(Math.random() * merchants.length)]
}

/**
 * Generate transactions for a date range
 */
function generateTransactions(
  config: SeedConfig,
  startDate: Date,
  endDate: Date,
  accounts: Record<string, any>,
  categories: Record<string, any>,
  tenantId: string
): any[] {
  const transactions: any[] = []
  const avatarSettings = config.avatarSettings[config.user.avatar]

  if (!avatarSettings) {
    throw new Error(`Avatar settings not found for: ${config.user.avatar}`)
  }

  // Generate transactions for each day in the range
  const currentDate = createUTCDate(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  let transactionId = 1

  while (currentDate <= endDate) {
    // Determine how many transactions to generate for this day (0-5)
    const dailyTransactionCount = Math.floor(Math.random() * 6)

    for (let i = 0; i < dailyTransactionCount; i++) {
      // Pick a random category (exclude TRANSFER categories - they're handled separately)
      const nonTransferCategories = config.categories.filter(cat => cat.type !== 'TRANSFER')
      const category = nonTransferCategories[Math.floor(Math.random() * nonTransferCategories.length)]
      const categoryRecord = categories[category.name]

      if (!categoryRecord) continue

      // Pick a random account (favor checking for expenses, credit for some purchases)
      let accountKey = 'checking'
      if (category.type === 'EXPENSE' && Math.random() < 0.3) {
        accountKey = 'credit' // 30% chance to use credit card for expenses
      }

      const account = accounts[accountKey]
      if (!account) continue

      // Generate merchant and amount
      const merchant = getRandomMerchant(category.name, avatarSettings)
      const amount = generateTransactionAmount(category.name, category.type, merchant, config.user.avatar)

      // Skip very small amounts
      if (Math.abs(amount) < 1) continue

      transactions.push({
        tenant_id: tenantId,
        account_id: account.id,
        category_id: categoryRecord.id,
        amount,
        description: merchant,
        date: createUTCDate(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
        type: category.type,
        is_recurring: category.name === 'Salary' || category.name === 'Housing'
      })
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return transactions
}

/**
 * Main seed generation function
 */
async function generateSeedData() {
  console.log('🌱 Starting intelligent seed data generation...')

  try {
    // Load configuration
    const config = loadSeedConfig()
    console.log(`📋 Loaded configuration for avatar: ${config.user.avatar}`)

    // Parse date range
    console.log(`🔍 Parsing start date: ${config.dateRange.startDate}`)
    const startDate = parseIntelligentDate(config.dateRange.startDate)
    console.log(`🔍 Parsing end date: ${config.dateRange.endDate}`)
    const endDate = parseIntelligentDate(config.dateRange.endDate)
    console.log(`📅 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

    // Create user
    const hashedPassword = await bcrypt.hash('demo123456', 12)
    const user = await prisma.user.upsert({
      where: { email: config.user.email },
      update: {},
      create: {
        email: config.user.email,
        password: hashedPassword,
        name: config.user.name
      }
    })
    console.log(`✅ Created user: ${user.email}`)

    // Create tenant
    const tenant = await prisma.tenant.upsert({
      where: { id: 'demo-tenant' },
      update: {},
      create: {
        id: 'demo-tenant',
        name: config.user.tenantName
      }
    })
    console.log(`✅ Created tenant: ${tenant.name}`)

    // Create membership
    await prisma.membership.upsert({
      where: {
        user_id_tenant_id: {
          user_id: user.id,
          tenant_id: tenant.id
        }
      },
      update: {},
      create: {
        user_id: user.id,
        tenant_id: tenant.id,
        role: 'owner'
      }
    })
    console.log(`✅ Created membership`)

    // Create categories
    const categoryRecords: Record<string, any> = {}
    for (const categoryConfig of config.categories) {
      const category = await prisma.category.upsert({
        where: {
          tenant_id_name_type: {
            tenant_id: tenant.id,
            name: categoryConfig.name,
            type: categoryConfig.type
          }
        },
        update: {},
        create: {
          tenant_id: tenant.id,
          name: categoryConfig.name,
          type: categoryConfig.type,
          color: '#E5E7EB' // Default color
        }
      })
      categoryRecords[categoryConfig.name] = category
    }
    console.log(`✅ Created ${Object.keys(categoryRecords).length} categories`)

    // Create accounts
    const accountRecords: Record<string, any> = {}
    for (const [key, accountConfig] of Object.entries(config.accounts)) {
      const account = await prisma.account.upsert({
        where: {
          tenant_id_name: {
            tenant_id: tenant.id,
            name: accountConfig.name
          }
        },
        update: {},
        create: {
          tenant_id: tenant.id,
          name: accountConfig.name,
          type: accountConfig.type as any,
          net_worth_category: accountConfig.type === 'CREDIT' ? 'LIABILITY' : 'ASSET',
          balance: accountConfig.initialBalance,
          balance_date: startDate,
          color: accountConfig.color,
          is_active: true
        }
      })
      accountRecords[key] = account
    }
    console.log(`✅ Created ${Object.keys(accountRecords).length} accounts`)

    // Create balance anchors for each account
    console.log('⚓ Creating balance anchors...')
    for (const [key, accountConfig] of Object.entries(config.accounts)) {
      const account = accountRecords[key]
      if (!account) continue

      // Parse the anchor date (could be "endDate", "startDate", or a specific date)
      let anchorDate: Date
      if (accountConfig.anchorDate === 'endDate') {
        anchorDate = endDate
      } else if (accountConfig.anchorDate === 'startDate') {
        anchorDate = startDate
      } else {
        anchorDate = parseIntelligentDate(accountConfig.anchorDate)
      }

      // Check if anchor already exists
      const existingAnchor = await prisma.accountBalanceAnchor.findFirst({
        where: {
          account_id: account.id,
          anchor_date: anchorDate
        }
      })

      if (!existingAnchor) {
        await prisma.accountBalanceAnchor.create({
          data: {
            account_id: account.id,
            tenant_id: tenant.id,
            balance: accountConfig.initialBalance,
            anchor_date: anchorDate,
            description: `Initial balance anchor for ${accountConfig.name}`
          }
        })
      }

      console.log(`  ⚓ Created anchor for ${accountConfig.name}: $${accountConfig.initialBalance} on ${anchorDate.toISOString().split('T')[0]}`)
    }
    console.log(`✅ Created balance anchors for all accounts`)

    // Generate transactions
    console.log('🎲 Generating transactions...')
    const transactions = generateTransactions(
      config,
      startDate,
      endDate,
      accountRecords,
      categoryRecords,
      tenant.id
    )

    // Insert transactions in batches
    const batchSize = 100
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)
      await prisma.transaction.createMany({
        data: batch
      })
    }

    console.log(`✅ Generated ${transactions.length} transactions`)

    // Generate transfers if enabled
    if (config.transfers.enabled) {
      console.log('🔄 Generating transfer transactions...')
      let transferCount = 0

      for (const transferConfig of config.transfers.types) {
        const fromAccount = accountRecords[transferConfig.fromAccount]
        const toAccount = accountRecords[transferConfig.toAccount]

        if (!fromAccount || !toAccount) continue

        // Generate monthly transfers for the date range
        const transferDate = createUTCDate(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        while (transferDate <= endDate) {
          const transferAmount = typeof transferConfig.amount === 'number'
            ? transferConfig.amount
            : Math.random() * 500 + 200 // Variable amount

          const transferId = `transfer-${Date.now()}-${Math.random()}`

          // Find the appropriate category for this transfer type
          const categoryId = categoryRecords[transferConfig.name]?.id || categoryRecords['Credit Card Payment']?.id

          // Create paired transactions
          await prisma.transaction.createMany({
            data: [
              {
                tenant_id: tenant.id,
                account_id: fromAccount.id,
                category_id: categoryId,
                amount: -transferAmount,
                description: transferConfig.description,
                date: createUTCDate(transferDate.getFullYear(), transferDate.getMonth(), transferDate.getDate()),
                type: 'TRANSFER',
                is_recurring: true
              },
              {
                tenant_id: tenant.id,
                account_id: toAccount.id,
                category_id: categoryId,
                amount: transferAmount,
                description: transferConfig.description,
                date: createUTCDate(transferDate.getFullYear(), transferDate.getMonth(), transferDate.getDate()),
                type: 'TRANSFER',
                is_recurring: true
              }
            ]
          })

          transferCount += 2

          // Move to next month
          transferDate.setMonth(transferDate.getMonth() + 1)
        }
      }

      console.log(`✅ Generated ${transferCount} transfer transactions`)
    }

    console.log('🎉 Intelligent seed data generation completed successfully!')

  } catch (error) {
    console.error('❌ Seed generation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed generation
if (require.main === module) {
  generateSeedData()
}

export { generateSeedData }
