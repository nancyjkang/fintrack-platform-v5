-- =====================================================
-- Database Index Optimization Script for FinTrack v5
-- =====================================================
-- This script creates missing indexes and clustered indexes for optimal performance
-- Run this script on your PostgreSQL database to improve query performance

-- Note: PostgreSQL doesn't have traditional "clustered indexes" like SQL Server
-- Instead, we use CLUSTER command to physically reorder table data by an index
-- and create strategic indexes for optimal performance

-- Note: CONCURRENTLY removed for dev environment to allow transaction blocks
-- For production, use CONCURRENTLY and run outside transactions

BEGIN;

-- =====================================================
-- 1. TRANSACTIONS TABLE INDEXES (Most Critical)
-- =====================================================
-- This is the most frequently queried table and needs comprehensive indexing

-- Create missing indexes from Prisma schema that may not exist in database
CREATE INDEX IF NOT EXISTS "transactions_tenant_id_date_idx"
ON "transactions"("tenant_id", "date");

CREATE INDEX IF NOT EXISTS "transactions_tenant_id_category_id_idx"
ON "transactions"("tenant_id", "category_id");

CREATE INDEX IF NOT EXISTS "transactions_tenant_id_account_id_date_idx"
ON "transactions"("tenant_id", "account_id", "date");

CREATE INDEX IF NOT EXISTS "transactions_tenant_id_type_account_id_idx"
ON "transactions"("tenant_id", "type", "account_id");

CREATE INDEX IF NOT EXISTS "transactions_tenant_id_description_idx"
ON "transactions"("tenant_id", "description");

CREATE INDEX IF NOT EXISTS "transactions_tenant_id_is_recurring_idx"
ON "transactions"("tenant_id", "is_recurring");

-- Composite index for cube generation groupBy queries (most important for performance)
CREATE INDEX IF NOT EXISTS "transactions_cube_generation_idx"
ON "transactions"("tenant_id", "date", "account_id", "category_id", "type", "is_recurring");


-- =====================================================
-- 2. ACCOUNTS TABLE INDEXES
-- =====================================================

-- Index for tenant-based account queries
CREATE INDEX IF NOT EXISTS "accounts_tenant_active_idx"
ON "accounts"("tenant_id", "is_active");


-- =====================================================
-- 3. CATEGORIES TABLE INDEXES
-- =====================================================

-- Index for category type queries
CREATE INDEX IF NOT EXISTS "categories_tenant_type_idx"
ON "categories"("tenant_id", "type");

-- =====================================================
-- 4. FINANCIAL_CUBE TABLE INDEXES
-- =====================================================
-- These indexes should already exist from the schema, but ensuring they're present

-- Create the unique constraint index (used for clustering)
CREATE UNIQUE INDEX IF NOT EXISTS "financial_cube_tenant_id_period_type_period_start_transacti_key"
ON "financial_cube"("tenant_id", "period_type", "period_start", "transaction_type", "category_id", "account_id", "is_recurring");

-- Ensure all financial cube indexes exist
CREATE INDEX IF NOT EXISTS "financial_cube_tenant_category_period_idx"
ON "financial_cube"("tenant_id", "category_id", "period_start");

CREATE INDEX IF NOT EXISTS "financial_cube_tenant_account_period_idx"
ON "financial_cube"("tenant_id", "account_id", "period_start");

CREATE INDEX IF NOT EXISTS "financial_cube_tenant_type_period_idx"
ON "financial_cube"("tenant_id", "transaction_type", "period_start");

CREATE INDEX IF NOT EXISTS "financial_cube_tenant_recurring_period_idx"
ON "financial_cube"("tenant_id", "is_recurring", "period_start");

CREATE INDEX IF NOT EXISTS "financial_cube_tenant_period_range_idx"
ON "financial_cube"("tenant_id", "period_start", "period_end");

-- =====================================================
-- 5. ACCOUNT_BALANCE_ANCHORS TABLE INDEXES
-- =====================================================

-- Index for anchor date queries
CREATE INDEX IF NOT EXISTS "account_balance_anchors_tenant_account_idx"
ON "account_balance_anchors"("tenant_id", "account_id");

CREATE INDEX IF NOT EXISTS "account_balance_anchors_account_date_idx"
ON "account_balance_anchors"("account_id", "anchor_date");

-- =====================================================
-- 6. SPENDING_GOALS TABLE INDEXES
-- =====================================================

-- Index for active goals
CREATE INDEX IF NOT EXISTS "spending_goals_tenant_status_idx"
ON "spending_goals"("tenant_id", "status");

-- Index for date range queries
CREATE INDEX IF NOT EXISTS "spending_goals_date_range_idx"
ON "spending_goals"("start_date", "end_date");

-- Index for goal type queries
CREATE INDEX IF NOT EXISTS "spending_goals_tenant_type_idx"
ON "spending_goals"("tenant_id", "goal_type");

-- =====================================================
-- 7. MEMBERSHIPS TABLE INDEXES
-- =====================================================

-- Index for user-based membership queries
CREATE INDEX IF NOT EXISTS "memberships_user_role_idx"
ON "memberships"("user_id", "role");

-- Index for tenant-based membership queries
CREATE INDEX IF NOT EXISTS "memberships_tenant_role_idx"
ON "memberships"("tenant_id", "role");

-- =====================================================
-- 8. USERS TABLE INDEXES
-- =====================================================

-- Index for user creation date (for analytics)
CREATE INDEX IF NOT EXISTS "users_created_at_idx"
ON "users"("created_at");

-- =====================================================
-- 9. TENANTS TABLE INDEXES
-- =====================================================

-- Index for tenant creation date (for analytics)
CREATE INDEX IF NOT EXISTS "tenants_created_at_idx"
ON "tenants"("created_at");

-- Index for tenant name searches
CREATE INDEX IF NOT EXISTS "tenants_name_idx"
ON "tenants"("name");

COMMIT;

-- =====================================================
-- 10. CLUSTERING OPERATIONS (PostgreSQL equivalent)
-- =====================================================
-- These operations physically reorder table data for better performance
-- Run these during maintenance windows as they lock tables

-- Note: Uncomment and run these during low-traffic periods

/*
-- Cluster transactions by the most frequently used index (tenant + date)
CLUSTER "transactions" USING "transactions_tenant_id_date_idx";

-- Cluster financial_cube by tenant and period for better range query performance
CLUSTER "financial_cube" USING "financial_cube_tenant_category_period_idx";

-- Cluster accounts by tenant for better tenant-based queries
CLUSTER "accounts" USING "accounts_tenant_id_name_key";

-- Cluster categories by tenant for better tenant-based queries
CLUSTER "categories" USING "categories_tenant_id_name_type_key";
*/

-- =====================================================
-- 11. ANALYZE TABLES FOR UPDATED STATISTICS
-- =====================================================
-- Update table statistics after creating indexes

ANALYZE "users";
ANALYZE "tenants";
ANALYZE "memberships";
ANALYZE "accounts";
ANALYZE "categories";
ANALYZE "transactions";
ANALYZE "account_balance_anchors";
ANALYZE "spending_goals";
ANALYZE "financial_cube";

-- =====================================================
-- 12. INDEX USAGE MONITORING QUERIES
-- =====================================================
-- Use these queries to monitor index usage and performance

/*
-- Check index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table scan statistics
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Check for unused indexes (run after some production usage)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check slow queries that might need additional indexes
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE query LIKE '%transactions%'
    OR query LIKE '%financial_cube%'
ORDER BY mean_time DESC
LIMIT 10;
*/

-- =====================================================
-- PERFORMANCE NOTES:
-- =====================================================
-- 1. The CONCURRENTLY option allows index creation without blocking writes
-- 2. Composite indexes should be ordered by selectivity (most selective first)
-- 3. Consider partial indexes for frequently filtered columns (e.g., is_active = true)
-- 4. Monitor index usage and drop unused indexes to save space
-- 5. Run CLUSTER operations during maintenance windows
-- 6. Update table statistics regularly with ANALYZE
-- 7. Consider index-only scans for covering indexes

-- =====================================================
-- MAINTENANCE RECOMMENDATIONS:
-- =====================================================
-- 1. Run REINDEX CONCURRENTLY monthly for high-write tables
-- 2. Monitor index bloat and rebuild when necessary
-- 3. Update statistics weekly: ANALYZE;
-- 4. Check for missing indexes using pg_stat_statements
-- 5. Review and optimize slow queries regularly
