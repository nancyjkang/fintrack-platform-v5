/**
 * FinTrack v5 Database Seeding Script
 * Based on v4.1 structure with multi-tenant support
 *
 * Seeds the database with:
 * - Demo user, tenant, and membership
 * - Default categories (based on v4.1)
 * - Sample accounts and transactions
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 12)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@fintrack.com' },
    update: {},
    create: {
      email: 'demo@fintrack.com',
      password: hashedPassword,
      name: 'Demo User'
    }
  })

  console.log('✅ Created demo user:', demoUser.email)

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'Demo Household'
    }
  })

  console.log('✅ Created demo tenant:', demoTenant.name)

  // Create membership (user belongs to tenant)
  const membership = await prisma.membership.upsert({
    where: {
      user_id_tenant_id: {
        user_id: demoUser.id,
        tenant_id: demoTenant.id
      }
    },
    update: {},
    create: {
      user_id: demoUser.id,
      tenant_id: demoTenant.id,
      role: 'owner'
    }
  })

  console.log('✅ Created membership for demo user')

  // Create default categories (from docs/reference/default-categories.ts)
  const defaultCategories = [
    // Income categories
    { name: 'Salary', type: 'INCOME', color: '#D1FAE5' },
    { name: 'Side Hustle', type: 'INCOME', color: '#E9D5FF' },
    { name: 'Other Income', type: 'INCOME', color: '#CFFAFE' },

    // Expense categories - Needs
    { name: 'Bills & Utilities', type: 'EXPENSE', color: '#FEE2E2' },
    { name: 'Food & Dining', type: 'EXPENSE', color: '#FEF3C7' },
    { name: 'Housing', type: 'EXPENSE', color: '#DBEAFE' },
    { name: 'Services', type: 'EXPENSE', color: '#F3F4F6' },
    { name: 'Health', type: 'EXPENSE', color: '#FCE7F3' },

    // Expense categories - Wants
    { name: 'Fun Money', type: 'EXPENSE', color: '#FED7AA' },
    { name: 'Other Expenses', type: 'EXPENSE', color: '#E5E7EB' },

    // Transfer categories
    { name: 'System Transfer', type: 'TRANSFER', color: '#F3F4F6' },
    { name: 'Credit Card Payment', type: 'TRANSFER', color: '#E5E7EB' },
    { name: 'Roth IRA', type: 'TRANSFER', color: '#E5E7EB' }
  ]

  for (const categoryData of defaultCategories) {
    await prisma.category.upsert({
      where: {
        tenant_id_name_type: {
          tenant_id: demoTenant.id,
          name: categoryData.name,
          type: categoryData.type
        }
      },
      update: {},
      create: {
        tenant_id: demoTenant.id,
        name: categoryData.name,
        type: categoryData.type,
        color: categoryData.color
      }
    })
  }

  console.log('✅ Created default categories')

  // Create sample accounts (based on v4.1 patterns)
  const checkingAccount = await prisma.account.upsert({
    where: {
      tenant_id_name: {
        tenant_id: demoTenant.id,
        name: 'Main Checking'
      }
    },
    update: {},
    create: {
      tenant: { connect: { id: demoTenant.id } },
      name: 'Main Checking',
      type: 'CHECKING',
      net_worth_category: 'ASSET',
      balance: 2500.00,
      balance_date: new Date(),
      color: '#3B82F6',
      is_active: true
    }
  })

  const savingsAccount = await prisma.account.upsert({
    where: {
      tenant_id_name: {
        tenant_id: demoTenant.id,
        name: 'Emergency Fund'
      }
    },
    update: {},
    create: {
      tenant: { connect: { id: demoTenant.id } },
      name: 'Emergency Fund',
      type: 'SAVINGS',
      net_worth_category: 'ASSET',
      balance: 10000.00,
      balance_date: new Date(),
      color: '#10B981',
      is_active: true
    }
  })

  const creditAccount = await prisma.account.upsert({
    where: {
      tenant_id_name: {
        tenant_id: demoTenant.id,
        name: 'Credit Card'
      }
    },
    update: {},
    create: {
      tenant: { connect: { id: demoTenant.id } },
      name: 'Credit Card',
      type: 'CREDIT',
      net_worth_category: 'LIABILITY',
      balance: -850.00,
      balance_date: new Date(),
      color: '#EF4444',
      is_active: true
    }
  })

  console.log('✅ Created sample accounts')

  // Get categories for sample transactions
  const foodDiningCategory = await prisma.category.findFirst({
    where: { tenant_id: demoTenant.id, name: 'Food & Dining' }
  })
  const salaryCategory = await prisma.category.findFirst({
    where: { tenant_id: demoTenant.id, name: 'Salary' }
  })
  const billsUtilitiesCategory = await prisma.category.findFirst({
    where: { tenant_id: demoTenant.id, name: 'Bills & Utilities' }
  })
  const funMoneyCategory = await prisma.category.findFirst({
    where: { tenant_id: demoTenant.id, name: 'Fun Money' }
  })

  // Create sample transactions
  const sampleTransactions = [
    {
      account_id: checkingAccount.id,
      category_id: salaryCategory?.id,
      amount: 3500.00,
      description: 'Monthly Salary',
      date: new Date('2025-09-01'),
      type: 'INCOME',
      is_recurring: true
    },
    {
      account_id: checkingAccount.id,
      category_id: foodDiningCategory?.id,
      amount: -85.50,
      description: 'Whole Foods Groceries',
      date: new Date('2025-09-10'),
      type: 'EXPENSE',
      is_recurring: false
    },
    {
      account_id: creditAccount.id,
      category_id: foodDiningCategory?.id,
      amount: -45.00,
      description: 'Restaurant Dinner',
      date: new Date('2025-09-12'),
      type: 'EXPENSE',
      is_recurring: false
    },
    {
      account_id: checkingAccount.id,
      category_id: billsUtilitiesCategory?.id,
      amount: -120.75,
      description: 'Electric Bill',
      date: new Date('2025-09-14'),
      type: 'EXPENSE',
      is_recurring: true
    },
    {
      account_id: checkingAccount.id,
      category_id: funMoneyCategory?.id,
      amount: -25.00,
      description: 'Coffee Shop',
      date: new Date('2025-09-15'),
      type: 'EXPENSE',
      is_recurring: false
    }
  ]

  for (const transactionData of sampleTransactions) {
    await prisma.transaction.create({
      data: {
        tenant_id: demoTenant.id,
        ...transactionData
      }
    })
  }

  console.log('✅ Created sample transactions')

  // Create balance anchors for accounts
  await prisma.accountBalanceAnchor.create({
    data: {
      tenant_id: demoTenant.id,
      account_id: checkingAccount.id,
      balance: 2000.00,
      anchor_date: new Date('2025-09-01'),
      description: 'Initial balance'
    }
  })

  await prisma.accountBalanceAnchor.create({
    data: {
      tenant_id: demoTenant.id,
      account_id: savingsAccount.id,
      balance: 10000.00,
      anchor_date: new Date('2025-09-01'),
      description: 'Initial emergency fund'
    }
  })

  console.log('✅ Created balance anchors')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
