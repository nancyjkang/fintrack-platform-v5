#!/usr/bin/env tsx

/**
 * Check what tenant ID is being used in the current session
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCurrentTenant() {
  console.log('🔍 Checking available tenants and their data...\n')
  
  try {
    // 1. List all tenants
    console.log('👥 ALL TENANTS:')
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        created_at: true
      }
    })
    
    tenants.forEach(tenant => {
      console.log(`   ${tenant.id} | ${tenant.name} | Created: ${tenant.created_at.toISOString().split('T')[0]}`)
    })
    
    // 2. Check transaction counts per tenant
    console.log('\n📊 TRANSACTIONS PER TENANT:')
    for (const tenant of tenants) {
      const transactionCount = await prisma.transaction.count({
        where: {
          account: {
            tenant_id: tenant.id
          }
        }
      })
      
      const dateRange = await prisma.transaction.aggregate({
        where: {
          account: {
            tenant_id: tenant.id
          }
        },
        _min: { date: true },
        _max: { date: true }
      })
      
      console.log(`   ${tenant.id}: ${transactionCount} transactions`)
      if (dateRange._min.date && dateRange._max.date) {
        console.log(`      Range: ${dateRange._min.date.toISOString().split('T')[0]} to ${dateRange._max.date.toISOString().split('T')[0]}`)
      }
    }
    
    // 3. Check cube data per tenant
    console.log('\n💾 CUBE DATA PER TENANT:')
    for (const tenant of tenants) {
      const cubeCount = await prisma.financialCube.count({
        where: {
          tenant_id: tenant.id
        }
      })
      
      const cubeRange = await prisma.financialCube.aggregate({
        where: {
          tenant_id: tenant.id
        },
        _min: { period_start: true },
        _max: { period_start: true }
      })
      
      console.log(`   ${tenant.id}: ${cubeCount} cube records`)
      if (cubeRange._min.period_start && cubeRange._max.period_start) {
        console.log(`      Range: ${cubeRange._min.period_start.toISOString().split('T')[0]} to ${cubeRange._max.period_start.toISOString().split('T')[0]}`)
      }
    }
    
    // 4. Check for the most active tenant (likely the one you're using)
    console.log('\n🎯 MOST LIKELY CURRENT TENANT:')
    const tenantWithMostTransactions = tenants[0] // We'll calculate this
    let maxTransactions = 0
    let activeTenant = null
    
    for (const tenant of tenants) {
      const count = await prisma.transaction.count({
        where: {
          account: {
            tenant_id: tenant.id
          }
        }
      })
      
      if (count > maxTransactions) {
        maxTransactions = count
        activeTenant = tenant
      }
    }
    
    if (activeTenant) {
      console.log(`   Most active tenant: ${activeTenant.id} (${activeTenant.name}) with ${maxTransactions} transactions`)
    }
    
  } catch (error) {
    console.error('❌ Error checking tenants:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkCurrentTenant().catch(console.error)

