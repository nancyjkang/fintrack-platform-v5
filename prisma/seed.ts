/**
 * FinTrack v5 Database Seeding Script
 *
 * Seeds the database with initial data including:
 * - System categories
 * - Demo user and tenant
 * - Sample financial data for testing
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
      password_hash: hashedPassword,
      email_verified: true,
      is_active: true
    }
  })

  console.log('✅ Created demo user:', demoUser.email)

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant-001' },
    update: {},
    create: {
      id: 'demo-tenant-001',
      name: "Demo User's Finances",
      type: 'PERSONAL',
      timezone: 'America/New_York',
      locale: 'en-US',
      currency: 'USD',
      is_active: true
    }
  })

  console.log('✅ Created demo tenant:', demoTenant.name)

  // Create membership linking user to tenant
  await prisma.membership.upsert({
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
      role: 'ADMIN',
      is_active: true
    }
  })

  console.log('✅ Created membership')

  // Create system categories
  const categories = [
    // Income categories
    { name: 'Income', parent: null, color: '#10B981', icon: '💰' },
    { name: 'Salary', parent: 'Income', color: '#10B981', icon: '💼' },
    { name: 'Freelance', parent: 'Income', color: '#10B981', icon: '🎯' },
    { name: 'Investment Returns', parent: 'Income', color: '#10B981', icon: '📈' },
    { name: 'Other Income', parent: 'Income', color: '#10B981', icon: '💵' },

    // Expense categories
    { name: 'Housing', parent: null, color: '#EF4444', icon: '🏠' },
    { name: 'Rent/Mortgage', parent: 'Housing', color: '#EF4444', icon: '🏡' },
    { name: 'Utilities', parent: 'Housing', color: '#EF4444', icon: '⚡' },
    { name: 'Home Maintenance', parent: 'Housing', color: '#EF4444', icon: '🔧' },

    { name: 'Transportation', parent: null, color: '#F59E0B', icon: '🚗' },
    { name: 'Gas', parent: 'Transportation', color: '#F59E0B', icon: '⛽' },
    { name: 'Car Payment', parent: 'Transportation', color: '#F59E0B', icon: '🚙' },
    { name: 'Public Transit', parent: 'Transportation', color: '#F59E0B', icon: '🚌' },

    { name: 'Food & Dining', parent: null, color: '#8B5CF6', icon: '🍽️' },
    { name: 'Groceries', parent: 'Food & Dining', color: '#8B5CF6', icon: '🛒' },
    { name: 'Restaurants', parent: 'Food & Dining', color: '#8B5CF6', icon: '🍕' },
    { name: 'Coffee & Snacks', parent: 'Food & Dining', color: '#8B5CF6', icon: '☕' },

    { name: 'Entertainment', parent: null, color: '#EC4899', icon: '🎬' },
    { name: 'Streaming Services', parent: 'Entertainment', color: '#EC4899', icon: '📺' },
    { name: 'Movies & Events', parent: 'Entertainment', color: '#EC4899', icon: '🎭' },
    { name: 'Hobbies', parent: 'Entertainment', color: '#EC4899', icon: '🎨' },

    { name: 'Healthcare', parent: null, color: '#06B6D4', icon: '🏥' },
    { name: 'Insurance', parent: 'Healthcare', color: '#06B6D4', icon: '🛡️' },
    { name: 'Doctor Visits', parent: 'Healthcare', color: '#06B6D4', icon: '👩‍⚕️' },
    { name: 'Medications', parent: 'Healthcare', color: '#06B6D4', icon: '💊' },

    { name: 'Shopping', parent: null, color: '#84CC16', icon: '🛍️' },
    { name: 'Clothing', parent: 'Shopping', color: '#84CC16', icon: '👕' },
    { name: 'Electronics', parent: 'Shopping', color: '#84CC16', icon: '📱' },
    { name: 'Personal Care', parent: 'Shopping', color: '#84CC16', icon: '🧴' },

    { name: 'Financial', parent: null, color: '#6366F1', icon: '🏦' },
    { name: 'Bank Fees', parent: 'Financial', color: '#6366F1', icon: '💳' },
    { name: 'Investments', parent: 'Financial', color: '#6366F1', icon: '📊' },
    { name: 'Taxes', parent: 'Financial', color: '#6366F1', icon: '📋' },

    { name: 'Uncategorized', parent: null, color: '#6B7280', icon: '❓' }
  ]

  // Create categories with proper parent-child relationships
  const categoryMap = new Map<string, string>()

  // First pass: create parent categories
  for (const cat of categories.filter(c => c.parent === null)) {
    // For parent categories (parent_id is null), we need to use a different approach
    // since the unique constraint doesn't work well with null values
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: cat.name,
        parent_id: null
      }
    })

    const category = existingCategory || await prisma.category.create({
      data: {
        tenant_id: demoTenant.id,
        name: cat.name,
        parent_id: null,
        color: cat.color,
        icon: cat.icon,
        is_system: true,
        is_active: true
      }
    })
    categoryMap.set(cat.name, category.id)
  }

  // Second pass: create child categories
  for (const cat of categories.filter(c => c.parent !== null)) {
    const parentId = categoryMap.get(cat.parent!)
    if (parentId) {
      const category = await prisma.category.upsert({
        where: {
          tenant_id_name_parent_id: {
             tenant_id: demoTenant.id,
            name: cat.name,
            parent_id: parentId
          }
        },
        update: {},
        create: {
          tenant_id: demoTenant.id,
          name: cat.name,
          parent_id: parentId,
          color: cat.color,
          icon: cat.icon,
          is_system: true,
          is_active: true
        }
      })
      categoryMap.set(cat.name, category.id)
    }
  }

  console.log(`✅ Created ${categories.length} categories`)

  // Create demo accounts
  const checkingAccount = await prisma.account.upsert({
    where: { id: 'demo-checking-001' },
    update: {},
    create: {
      id: 'demo-checking-001',
      tenant_id: demoTenant.id,
      name: 'Main Checking',
      type: 'checking',
      subtype: 'checking',
      current_balance: 2500.00,
      currency: 'USD',
      account_number_last4: '1234',
      institution_name: 'Demo Bank',
      is_active: true,
      color: '#3B82F6',
      icon: '🏦'
    }
  })

  const savingsAccount = await prisma.account.upsert({
    where: { id: 'demo-savings-001' },
    update: {},
    create: {
      id: 'demo-savings-001',
      tenant_id: demoTenant.id,
      name: 'Emergency Fund',
      type: 'savings',
      subtype: 'high_yield_savings',
      current_balance: 10000.00,
      currency: 'USD',
      account_number_last4: '5678',
      institution_name: 'Demo Bank',
      is_active: true,
      color: '#10B981',
      icon: '💰'
    }
  })

  const creditAccount = await prisma.account.upsert({
    where: { id: 'demo-credit-001' },
    update: {},
    create: {
      id: 'demo-credit-001',
      tenant_id: demoTenant.id,
      name: 'Rewards Credit Card',
      type: 'credit',
      subtype: 'rewards_credit',
      current_balance: -850.00,
      credit_limit: 5000.00,
      currency: 'USD',
      account_number_last4: '9012',
      institution_name: 'Demo Credit Union',
      is_active: true,
      color: '#EF4444',
      icon: '💳'
    }
  })

  console.log('✅ Created demo accounts')

  // Create balance anchors for accounts
  const today = new Date()
  const anchorDate = new Date(today.getFullYear(), today.getMonth(), 1) // First of current month

  await prisma.accountBalanceAnchor.createMany({
    data: [
      {
        account_id: checkingAccount.id,
        balance: 2500.00,
        anchor_date: anchorDate,
        description: 'Initial balance',
        is_initial_balance: true,
        confidence_level: 'high'
      },
      {
        account_id: savingsAccount.id,
        balance: 10000.00,
        anchor_date: anchorDate,
        description: 'Initial balance',
        is_initial_balance: true,
        confidence_level: 'high'
      },
      {
        account_id: creditAccount.id,
        balance: -850.00,
        anchor_date: anchorDate,
        description: 'Initial balance',
        is_initial_balance: true,
        confidence_level: 'high'
      }
    ]
  })

  console.log('✅ Created balance anchors')

  // Create sample transactions
  const salaryCategory = categoryMap.get('Salary')
  const groceriesCategory = categoryMap.get('Groceries')
  const gasCategory = categoryMap.get('Gas')
  const rentCategory = categoryMap.get('Rent/Mortgage')

  const sampleTransactions = [
    // Income
    {
      account_id: checkingAccount.id,
      category_id: salaryCategory,
      amount: 3500.00,
      description: 'Salary Deposit',
      date: new Date(2025, 0, 15), // Jan 15, 2025
      type: 'income',
      status: 'cleared'
    },

    // Expenses
    {
      account_id: checkingAccount.id,
      category_id: rentCategory,
      amount: -1200.00,
      description: 'Monthly Rent',
      date: new Date(2025, 0, 1), // Jan 1, 2025
      type: 'expense',
      status: 'cleared'
    },
    {
      account_id: creditAccount.id,
      category_id: groceriesCategory,
      amount: -85.50,
      description: 'Whole Foods Market',
      date: new Date(2025, 0, 10), // Jan 10, 2025
      type: 'expense',
      status: 'cleared'
    },
    {
      account_id: creditAccount.id,
      category_id: gasCategory,
      amount: -45.00,
      description: 'Shell Gas Station',
      date: new Date(2025, 0, 8), // Jan 8, 2025
      type: 'expense',
      status: 'cleared'
    }
  ]

  await prisma.transaction.createMany({
    data: sampleTransactions
  })

  console.log('✅ Created sample transactions')

  // Create a spending goal
  await prisma.spendingGoal.upsert({
    where: { id: 'demo-goal-001' },
    update: {},
    create: {
      id: 'demo-goal-001',
      tenant_id: demoTenant.id,
      category_id: groceriesCategory,
      name: 'Monthly Grocery Budget',
      target_amount: 400.00,
      period_type: 'monthly',
      start_date: new Date(2025, 0, 1),
      current_amount: 85.50,
      is_active: true,
      alert_threshold: 0.80
    }
  })

  console.log('✅ Created spending goal')

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
