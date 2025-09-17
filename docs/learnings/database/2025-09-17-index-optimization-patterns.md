---
tags: [database, indexing, performance, postgresql]
date: 2025-09-17
complexity: intermediate
impact: high
context: financial-trends-cube
---

# Database Index Optimization Patterns

## Context
While designing the `financial_cube` table for OLAP-style financial analysis, discovered several critical index optimization patterns that significantly impact query performance and storage efficiency.

## Key Learnings

### 1. Unique Constraints as Indexes
**Insight**: Unique constraints automatically serve as indexes and can eliminate redundant indexes.

**Example**:
```sql
-- ❌ REDUNDANT: These indexes are covered by the unique constraint
CREATE INDEX idx_short ON table(a, b, c);
CREATE INDEX idx_medium ON table(a, b, c, d, e);

-- ✅ SUFFICIENT: Unique constraint covers all prefix queries
CREATE UNIQUE INDEX unique_all ON table(a, b, c, d, e, f, g);
```

**Impact**: Eliminated 2 redundant indexes, reduced storage overhead, improved write performance.

### 2. Clustered Index vs Regular Index Redundancy
**Insight**: When using clustered indexes, standalone indexes on the clustered prefix are redundant.

**Example**:
```sql
-- Clustered index: (tenant_id, period_start, period_type, id)
-- ❌ REDUNDANT: Covered by clustered index leftmost prefix
CREATE INDEX idx_tenant ON table(tenant_id);

-- ✅ KEEP: Different column order serves different query patterns
CREATE INDEX idx_tenant_type_start ON table(tenant_id, period_type, period_start);
```

**Rule**: Clustered indexes efficiently handle leftmost prefix queries.

### 3. Column Order in Composite Indexes
**Insight**: Column order dramatically affects query performance based on selectivity and query frequency.

**Decision Framework**:
1. **Selectivity**: Higher selectivity (more unique values) → earlier position
2. **Query Frequency**: More frequently filtered → earlier position
3. **Data Distribution**: Even distribution → better performance

**Example**:
```sql
-- ❌ SUBOPTIMAL: Low selectivity boolean first
CREATE UNIQUE INDEX bad_order ON table(tenant_id, is_recurring, account_id, ...);

-- ✅ OPTIMAL: High selectivity, frequently queried column first
CREATE UNIQUE INDEX good_order ON table(tenant_id, account_id, is_recurring, ...);
```

**Impact**: Account-specific queries (very common) became significantly faster.

### 4. Leftmost Prefix Rule
**Insight**: PostgreSQL can use any leftmost prefix of a composite index for query optimization.

**Coverage Analysis**:
```sql
-- Index: (a, b, c, d, e)
-- ✅ Can optimize: WHERE a = 1
-- ✅ Can optimize: WHERE a = 1 AND b = 2
-- ✅ Can optimize: WHERE a = 1 AND b = 2 AND c = 3
-- ❌ Cannot optimize: WHERE b = 2 (missing leftmost column)
-- ❌ Cannot optimize: WHERE c = 3 AND d = 4 (missing leftmost columns)
```

## Optimization Process

### Step 1: Identify Query Patterns
- Analyze expected WHERE clauses
- Identify most frequent filter combinations
- Consider ORDER BY requirements

### Step 2: Design Composite Indexes
- Start with highest selectivity + frequency columns
- Consider leftmost prefix coverage
- Avoid redundant indexes

### Step 3: Validate with EXPLAIN
```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM table WHERE conditions;
```

### Step 4: Monitor and Adjust
- Track query performance metrics
- Identify unused indexes
- Adjust based on actual usage patterns

## Tools & Commands

### Index Analysis
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public';

-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public';

-- Index size analysis
SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE schemaname = 'public';
```

## Anti-Patterns to Avoid

1. **Index Spam**: Creating indexes for every possible query combination
2. **Ignoring Selectivity**: Putting low-selectivity columns first
3. **Duplicate Coverage**: Multiple indexes covering the same query patterns
4. **No Monitoring**: Creating indexes without measuring their effectiveness

## Related Learnings
- [Clustered Index Design](./2025-09-17-clustered-index-strategy.md)
- [Query Performance Analysis](../performance/query-optimization.md)

## References
- PostgreSQL Documentation: Indexes
- Use The Index, Luke: SQL Indexing Guide
- Project: `financial_cube` table design

---

**Key Takeaway**: Index design is about understanding query patterns, not just adding indexes everywhere. Quality over quantity, with careful attention to column ordering and redundancy elimination.
