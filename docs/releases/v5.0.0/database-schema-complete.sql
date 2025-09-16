-- FinTrack v5.0.0 - Complete Database Schema
-- This script creates the complete database schema for FinTrack v5.0.0
--
-- Usage:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Run this complete script to create all tables, indexes, and constraints
--
-- ⚠️ WARNING: This will delete ALL existing data! ⚠️
-- Only run this on a fresh database or if you want to completely reset the schema

-- ==============================================================================
-- STEP 1: Reset Database Schema
-- ==============================================================================

-- Drop all existing tables and recreate schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ==============================================================================
-- STEP 2: Create All Tables
-- ==============================================================================

-- Table: users (with password column for authentication)
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Table: tenants (multi-tenancy support)
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- Table: memberships (user-tenant relationships)
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- Table: accounts (financial accounts with net worth categorization)
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "balance_date" TIMESTAMP(3) NOT NULL,
    "color" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "net_worth_category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- Table: categories (transaction categorization)
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Table: transactions (financial transactions)
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "category_id" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- Table: account_balance_anchors (balance tracking points)
CREATE TABLE "account_balance_anchors" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "anchor_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_balance_anchors_pkey" PRIMARY KEY ("id")
);

-- Table: spending_goals (budgeting and goal tracking)
CREATE TABLE "spending_goals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal_type" TEXT NOT NULL,
    "target_amount" DECIMAL(12,2) NOT NULL,
    "timeframe" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "alert_warning_threshold" INTEGER NOT NULL DEFAULT 80,
    "alert_critical_threshold" INTEGER NOT NULL DEFAULT 90,
    "criteria_category_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "criteria_account_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "criteria_recurring" BOOLEAN,
    "criteria_transaction_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "spending_goals_pkey" PRIMARY KEY ("id")
);

-- ==============================================================================
-- STEP 3: Create All Indexes
-- ==============================================================================

-- Unique indexes for data integrity
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "memberships_user_id_tenant_id_key" ON "memberships"("user_id", "tenant_id");
CREATE UNIQUE INDEX "accounts_tenant_id_name_key" ON "accounts"("tenant_id", "name");
CREATE UNIQUE INDEX "categories_tenant_id_name_type_key" ON "categories"("tenant_id", "name", "type");

-- Performance indexes
CREATE INDEX "transactions_tenant_id_idx" ON "transactions"("tenant_id");
CREATE INDEX "transactions_account_id_idx" ON "transactions"("account_id");
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");
CREATE INDEX "transactions_date_idx" ON "transactions"("date");
CREATE INDEX "accounts_tenant_id_idx" ON "accounts"("tenant_id");
CREATE INDEX "categories_tenant_id_idx" ON "categories"("tenant_id");

-- ==============================================================================
-- STEP 4: Add All Foreign Key Constraints
-- ==============================================================================

-- User and tenant relationships
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Account relationships
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Category relationships
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Transaction relationships
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Balance anchor relationships
ALTER TABLE "account_balance_anchors" ADD CONSTRAINT "account_balance_anchors_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "account_balance_anchors" ADD CONSTRAINT "account_balance_anchors_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Spending goal relationships
ALTER TABLE "spending_goals" ADD CONSTRAINT "spending_goals_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==============================================================================
-- STEP 5: Verification and Completion
-- ==============================================================================

-- Verify schema creation
SELECT 'FinTrack v5.0.0 database schema created successfully!' as status;

-- List all created tables
SELECT
    'Created table: ' || table_name as result
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Show table structure verification
SELECT
    n.nspname as schema_name,
    c.relname as table_name,
    a.attname as column_name,
    t.typname as data_type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_type t ON a.atttypid = t.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND c.relname IN ('users', 'tenants', 'memberships', 'accounts', 'categories', 'transactions', 'account_balance_anchors', 'spending_goals')
ORDER BY c.relname, a.attnum;

-- ==============================================================================
-- DEPLOYMENT NOTES
-- ==============================================================================

/*
DEPLOYMENT CHECKLIST:

1. ✅ Run this script in Supabase SQL Editor
2. ✅ Verify all tables are created (8 tables total)
3. ✅ Verify all indexes are created
4. ✅ Verify all foreign key constraints are active
5. ✅ Test application connectivity
6. ✅ Run application tests
7. ✅ Deploy application code

ROLLBACK PLAN:
- If issues occur, you can re-run this script to reset the schema
- For production, ensure you have a backup before running

NEXT STEPS:
- Update your application's DATABASE_URL to point to this database
- Run your application to verify connectivity
- Consider running seed data if needed

VERSION: v5.0.0
CREATED: 2025-09-16
COMPATIBLE WITH: FinTrack v5.0.0 and later
*/
