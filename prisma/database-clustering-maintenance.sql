-- =====================================================
-- Database Clustering Maintenance Script for FinTrack v5
-- =====================================================
-- This script performs clustering operations to physically reorder table data
-- ⚠️  IMPORTANT: Run during maintenance windows as these operations lock tables
-- ⚠️  These operations can take significant time on large tables

-- =====================================================
-- PRE-CLUSTERING CHECKS
-- =====================================================

-- Check table sizes before clustering
SELECT
    t.schemaname,
    t.tablename,
    pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
    pg_size_pretty(pg_relation_size(c.oid)) as table_size,
    pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) as index_size
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.schemaname = 'public'
ORDER BY pg_total_relation_size(c.oid) DESC;

-- Check current clustering status
SELECT
    n.nspname as schemaname,
    t.relname as tablename,
    i.relname as indexname,
    pg_size_pretty(pg_relation_size(i.oid)) as index_size
FROM pg_class i
JOIN pg_index ix ON ix.indexrelid = i.oid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND i.relkind = 'i'
ORDER BY pg_relation_size(i.oid) DESC;

-- =====================================================
-- CLUSTERING OPERATIONS
-- =====================================================

BEGIN;

-- Set maintenance work memory for better performance during clustering
SET maintenance_work_mem = '1GB';

-- 1. CLUSTER TRANSACTIONS TABLE (Most Critical)
-- Cluster by tenant_id and date for optimal range queries
-- This is the most frequently accessed pattern in the application
CLUSTER "transactions" USING "transactions_tenant_id_date_idx";

-- 2. CLUSTER FINANCIAL_CUBE TABLE
-- Cluster by the unique constraint index for optimal analytical query performance
-- This covers: tenant_id, period_type, period_start, transaction_type, category_id, account_id, is_recurring
CLUSTER "financial_cube" USING "financial_cube_tenant_id_period_type_period_start_transacti_key";

-- 3. CLUSTER ACCOUNTS TABLE
-- Cluster by tenant and name for better tenant-based account queries
CLUSTER "accounts" USING "accounts_tenant_id_name_key";

-- 4. CLUSTER CATEGORIES TABLE
-- Cluster by tenant, name, and type for better category lookups
CLUSTER "categories" USING "categories_tenant_id_name_type_key";

-- 5. CLUSTER ACCOUNT_BALANCE_ANCHORS TABLE
-- Cluster by tenant and account for better balance history queries
-- First create the index if it doesn't exist
-- Note: Index should already exist from index optimization script
-- CREATE INDEX IF NOT EXISTS "account_balance_anchors_tenant_account_idx"
-- ON "account_balance_anchors"("tenant_id", "account_id");

CLUSTER "account_balance_anchors" USING "account_balance_anchors_tenant_account_idx";

-- 6. CLUSTER SPENDING_GOALS TABLE
-- Cluster by tenant and status for better goal queries
-- Note: Index should already exist from index optimization script
-- CREATE INDEX IF NOT EXISTS "spending_goals_tenant_status_idx"
-- ON "spending_goals"("tenant_id", "status");

CLUSTER "spending_goals" USING "spending_goals_tenant_status_idx";

-- 7. CLUSTER MEMBERSHIPS TABLE
-- Cluster by user and tenant for better membership lookups
CLUSTER "memberships" USING "memberships_user_id_tenant_id_key";

-- Reset maintenance work memory
RESET maintenance_work_mem;

COMMIT;

-- =====================================================
-- POST-CLUSTERING MAINTENANCE
-- =====================================================

-- Update all table statistics after clustering
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
-- VERIFY CLUSTERING RESULTS
-- =====================================================

-- Check table sizes after clustering
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check clustering correlation (closer to 1.0 or -1.0 is better)
SELECT
    schemaname,
    tablename,
    attname,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
    AND tablename IN ('transactions', 'financial_cube', 'accounts', 'categories')
    AND attname IN ('tenant_id', 'date', 'period_start', 'name')
ORDER BY tablename, attname;

-- =====================================================
-- CLUSTERING SCHEDULE RECOMMENDATIONS
-- =====================================================

/*
RECOMMENDED CLUSTERING SCHEDULE:

1. TRANSACTIONS TABLE:
   - Cluster monthly during maintenance window
   - This table grows rapidly and benefits most from clustering
   - Monitor query performance and cluster more frequently if needed

2. FINANCIAL_CUBE TABLE:
   - Cluster quarterly or when cube regeneration is performed
   - This table is rebuilt periodically, so clustering frequency can be lower

3. OTHER TABLES:
   - Cluster semi-annually or when significant data changes occur
   - These tables are relatively stable and don't require frequent clustering

AUTOMATION SCRIPT EXAMPLE:
-- Create a cron job or scheduled task to run clustering during maintenance windows
-- Example: Every first Sunday of the month at 2 AM

#!/bin/bash
# clustering-maintenance.sh
psql -d your_database -f database-clustering-maintenance.sql

# Add to crontab:
# 0 2 * * 0 [ $(date +\%d) -le 07 ] && /path/to/clustering-maintenance.sh
*/

-- =====================================================
-- MONITORING QUERIES FOR CLUSTERING EFFECTIVENESS
-- =====================================================

/*
-- Monitor query performance after clustering
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE query LIKE '%transactions%'
    OR query LIKE '%financial_cube%'
ORDER BY mean_time DESC
LIMIT 10;

-- Check for sequential scans that might indicate missing indexes
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    seq_tup_read / GREATEST(seq_scan, 1) as avg_seq_tup_read
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND seq_scan > 0
ORDER BY seq_tup_read DESC;

-- Monitor index usage to ensure clustering is effective
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename IN ('transactions', 'financial_cube', 'accounts', 'categories')
ORDER BY tablename, idx_scan DESC;
*/

-- =====================================================
-- NOTES AND WARNINGS
-- =====================================================

/*
IMPORTANT CONSIDERATIONS:

1. DOWNTIME: Clustering operations require exclusive table locks
   - Plan for application downtime during clustering
   - Consider using pg_repack for online clustering (requires extension)

2. DISK SPACE: Clustering requires additional disk space
   - Ensure 2x table size free space is available
   - Monitor disk usage during operation

3. PERFORMANCE IMPACT: Large tables take significant time to cluster
   - transactions table clustering may take 10-30 minutes on large datasets
   - Monitor progress using pg_stat_progress_cluster view

4. FREQUENCY: Don't over-cluster
   - Clustering too frequently can cause unnecessary downtime
   - Monitor correlation statistics to determine optimal frequency

5. ALTERNATIVES: Consider these alternatives for high-availability systems:
   - pg_repack extension for online clustering
   - Partitioning large tables by tenant_id or date
   - Read replicas for analytical queries

6. BACKUP: Always backup before major maintenance operations
   - Take a full backup before running clustering operations
   - Test restore procedures regularly
*/
