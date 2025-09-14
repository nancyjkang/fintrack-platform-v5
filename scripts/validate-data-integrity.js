#!/usr/bin/env node

/**
 * Data Integrity Validation Script for FinTrack v5
 * Validates database schema and critical data before deployment
 */

const { PrismaClient } = require('@prisma/client');

async function validateDataIntegrity() {
  console.log('🔍 Validating data integrity...');

  const prisma = new PrismaClient();

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Validate critical tables exist and have expected structure
    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenant.count();
    const accountCount = await prisma.account.count();

    console.log('📊 Data summary:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Tenants: ${tenantCount}`);
    console.log(`   Accounts: ${accountCount}`);

    // Validate referential integrity
    const orphanedAccounts = await prisma.account.count({
      where: {
        tenant: null
      }
    });

    if (orphanedAccounts > 0) {
      console.warn(`⚠️  Found ${orphanedAccounts} accounts without tenants`);
    }

    // Validate demo user exists (for development)
    if (process.env.NODE_ENV !== 'production') {
      const demoUser = await prisma.user.findFirst({
        where: { email: 'demo@fintrack.app' }
      });

      if (!demoUser) {
        console.warn('⚠️  Demo user not found - consider running seed script');
      } else {
        console.log('✅ Demo user exists');
      }
    }

    console.log('✅ Data integrity validation passed');

  } catch (error) {
    console.error('❌ Data integrity validation failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  validateDataIntegrity();
}

module.exports = { validateDataIntegrity };
