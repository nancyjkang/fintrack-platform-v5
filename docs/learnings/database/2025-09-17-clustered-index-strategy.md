---
tags: [database, indexing, performance, postgresql, olap]
date: 2025-09-17
complexity: intermediate
impact: high
context: financial-trends-cube
---

# Clustered Index Strategy for OLAP Workloads

## Context
Designing physical data organization for `financial_cube` table to optimize time-series financial analysis queries.

## Key Decision: Clustered Index Column Order

### Chosen Order
```sql
CREATE UNIQUE INDEX clustered_idx ON financial_cube(tenant_id, period_start, period_type, id);
```

### Decision Rationale

#### 1. **Tenant Isolation First**
- **Why**: Multi-tenant application requires strict data isolation
- **Benefit**: All tenant data physically grouped together
- **Impact**: Tenant-specific queries scan minimal disk pages

#### 2. **Time-Series Optimization Second**
- **Why**: Financial analysis is primarily time-based
- **Benefit**: Date range queries are extremely efficient
- **Impact**: Monthly/quarterly reports scan sequential disk blocks

#### 3. **Period Type Third**
- **Why**: Separates WEEKLY vs MONTHLY within same time periods
- **Benefit**: Period-specific analysis benefits from grouping
- **Impact**: "Show all monthly data" queries are optimized

#### 4. **ID Last**
- **Why**: Ensures uniqueness when other columns are identical
- **Benefit**: Maintains primary key constraint
- **Impact**: Provides deterministic ordering

## Physical Data Layout Result

```
Disk Page 1: Tenant A | 2024-01-01 | WEEKLY   | [data]
Disk Page 1: Tenant A | 2024-01-01 | MONTHLY  | [data]
Disk Page 1: Tenant A | 2024-01-08 | WEEKLY   | [data]
Disk Page 2: Tenant A | 2024-02-01 | MONTHLY  | [data]
Disk Page N: Tenant B | 2024-01-01 | WEEKLY   | [data]
```

## Query Performance Impact

### ✅ **Optimized Query Patterns**
```sql
-- Time-series analysis (most common)
SELECT * FROM financial_cube
WHERE tenant_id = 'user123'
AND period_start BETWEEN '2024-01-01' AND '2024-03-31'
ORDER BY period_start;
-- Result: Sequential disk reads, minimal I/O

-- Tenant data export
SELECT * FROM financial_cube WHERE tenant_id = 'user123';
-- Result: All data in contiguous disk pages

-- Period-specific analysis
SELECT * FROM financial_cube
WHERE tenant_id = 'user123'
AND period_start >= '2024-01-01'
AND period_type = 'MONTHLY';
-- Result: Efficient with period_type as third column
```

### ⚠️ **Less Optimal (But Acceptable)**
```sql
-- Account-specific analysis
SELECT * FROM financial_cube
WHERE tenant_id = 'user123' AND account_id = 10;
-- Result: Requires index scan, but still efficient due to tenant grouping
```

## Alternative Considered

### Option B: Account-First Clustering
```sql
-- Alternative: (tenant_id, account_id, period_start, period_type)
```

**Why Rejected**:
- Financial analysis is more time-centric than account-centric
- Time-series queries are more frequent than account-specific queries
- Date range scans benefit more from physical ordering than account scans

## OLAP vs OLTP Considerations

### **OLAP Characteristics** (Our Use Case)
- ✅ **Read-Heavy**: More SELECT than INSERT/UPDATE
- ✅ **Range Queries**: Date ranges, aggregations
- ✅ **Sequential Access**: Time-series analysis patterns
- ✅ **Batch Updates**: Cube updates happen in batches

### **Clustered Index Benefits for OLAP**
1. **Sequential I/O**: Time-based queries read contiguous pages
2. **Cache Efficiency**: Related data loaded together
3. **Compression**: Similar data compresses better when adjacent
4. **Range Scans**: Optimal for date range analysis

## Implementation Notes

### **PostgreSQL Clustered Index**
```sql
-- Create clustered index by making it the primary key
DROP INDEX IF EXISTS financial_cube_pkey;
ALTER TABLE financial_cube DROP CONSTRAINT financial_cube_pkey;

CREATE UNIQUE INDEX financial_cube_clustered_idx
ON financial_cube(tenant_id, period_start, period_type, id);

ALTER TABLE financial_cube
ADD CONSTRAINT financial_cube_pkey
PRIMARY KEY USING INDEX financial_cube_clustered_idx;
```

### **Maintenance Considerations**
- **Insert Performance**: Slightly slower due to ordered inserts
- **Update Performance**: Minimal impact (cube updates are rare)
- **Storage**: Better compression due to data locality
- **Vacuum**: More efficient due to physical ordering

## Monitoring & Validation

### **Performance Metrics to Track**
```sql
-- Query execution time for time-series queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM financial_cube
WHERE tenant_id = 'user123'
AND period_start BETWEEN '2024-01-01' AND '2024-03-31';

-- Buffer hit ratio (should be high for sequential access)
SELECT datname, blks_read, blks_hit,
       round(blks_hit::float / (blks_hit + blks_read) * 100, 2) as hit_ratio
FROM pg_stat_database;
```

### **Success Indicators**
- Time-series queries complete in <100ms for 1 year of data
- Buffer hit ratio >95% for repeated time-range queries
- Minimal disk I/O for tenant-specific analysis

## Related Learnings
- [Index Optimization Patterns](./2025-09-17-index-optimization-patterns.md)
- [OLAP Query Performance](../performance/olap-optimization.md)

---

**Key Takeaway**: For OLAP workloads, clustered index design should prioritize the most common query access patterns. Time-series data benefits enormously from chronological physical ordering.
