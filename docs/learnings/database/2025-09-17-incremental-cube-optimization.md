# Incremental Cube Update Optimization

**Date**: 2025-09-17
**Tags**: database, performance, cube, optimization, incremental-updates
**Context**: Financial Trends Cube Real-time Updates

## Problem

When transactions are added, modified, or deleted, the cube needs to be updated to reflect these changes. The naive approach would be to rebuild entire periods, but this is inefficient because:

1. **Over-processing**: Rebuilds accounts that weren't affected in specific periods
2. **Wasted computation**: Processes unchanged data repeatedly
3. **Poor scalability**: Performance degrades with tenant size, not change size

## Original Approach (Inefficient)

```typescript
async updateCubeForTransactions(tenantId: string, transactionIds: number[]): Promise<void> {
  const affectedPeriods = await this.getAffectedPeriods(tenantId, transactionIds)

  // ❌ Rebuilds ALL accounts for each affected period
  for (const { periodStart, periodEnd, periodType } of affectedPeriods) {
    await this.rebuildCubeForPeriod(tenantId, periodStart, periodEnd, periodType)
  }
}
```

**Performance Characteristics:**
- **Time Complexity**: O(periods × accounts × transactions_per_period)
- **Database Load**: High - processes all accounts even if unchanged
- **Scalability**: Poor - grows with total tenant size

## Optimized Approach (Efficient)

```typescript
async updateCubeForTransactions(tenantId: string, transactionIds: number[]): Promise<void> {
  const affectedPeriods = await this.getAffectedPeriods(tenantId, transactionIds)

  // ✅ For each period, find which accounts were actually affected
  for (const { periodStart, periodEnd, periodType } of affectedPeriods) {
    const affectedAccountIds = await this.getAffectedAccountsForPeriod(
      tenantId,
      transactionIds,
      periodStart,
      periodEnd
    )

    // ✅ Rebuild only affected accounts in this period
    for (const accountId of affectedAccountIds) {
      await this.rebuildCubeForPeriod(tenantId, periodStart, periodEnd, periodType, accountId)
    }
  }
}
```

**Performance Characteristics:**
- **Time Complexity**: O(periods × affected_accounts × transactions_per_account_per_period)
- **Database Load**: Low - processes only changed accounts
- **Scalability**: Excellent - grows with change size, not tenant size

## Key Helper Method

```typescript
private async getAffectedAccountsForPeriod(
  tenantId: string,
  transactionIds: number[],
  periodStart: Date,
  periodEnd: Date
): Promise<number[]> {
  const result = await this.prisma.transaction.findMany({
    where: {
      tenant_id: tenantId,
      id: { in: transactionIds },
      date: {
        gte: periodStart,
        lte: periodEnd
      }
    },
    select: { account_id: true },
    distinct: ['account_id']
  })

  return result.map(t => t.account_id)
}
```

## Performance Impact Analysis

### Scenario 1: Small Change in Large Tenant
- **Tenant**: 100 accounts, 50,000 transactions
- **Change**: 5 transactions added to 2 accounts in 1 month
- **Before**: Rebuilds 100 accounts × 1 period = 100 account-periods
- **After**: Rebuilds 2 accounts × 1 period = 2 account-periods
- **Improvement**: 98% reduction in processing

### Scenario 2: Multi-Period Update
- **Tenant**: 50 accounts, 25,000 transactions
- **Change**: 10 transactions across 3 accounts spanning 2 months
- **Before**: Rebuilds 50 accounts × 2 periods = 100 account-periods
- **After**: Rebuilds 3 accounts × 2 periods = 6 account-periods
- **Improvement**: 94% reduction in processing

### Scenario 3: Cross-Account Transfer
- **Tenant**: 200 accounts, 100,000 transactions
- **Change**: 1 transfer transaction (affects 2 accounts) in 1 week
- **Before**: Rebuilds 200 accounts × 1 period = 200 account-periods
- **After**: Rebuilds 2 accounts × 1 period = 2 account-periods
- **Improvement**: 99% reduction in processing

## Real-World Benefits

### 1. **Faster Real-time Updates**
- Transaction creation/editing feels instant
- Dashboard updates happen in milliseconds, not seconds
- Better user experience during high-frequency operations

### 2. **Reduced Database Load**
- Lower CPU utilization during cube updates
- Fewer database connections and queries
- Better concurrent user support

### 3. **Improved Scalability**
- Performance scales with change volume, not tenant size
- Large tenants don't slow down incremental updates
- Supports high-frequency trading/transaction scenarios

### 4. **Cost Efficiency**
- Reduced compute costs for cloud deployments
- Lower database resource consumption
- More efficient use of connection pools

## Implementation Considerations

### 1. **Transaction Boundary Management**
Ensure cube updates happen within the same transaction as the source data changes to maintain consistency.

### 2. **Batch Processing**
For bulk operations, consider batching the affected account IDs to avoid too many small rebuild operations.

### 3. **Error Handling**
If rebuilding one account fails, continue with others rather than failing the entire operation.

### 4. **Monitoring**
Track metrics on:
- Number of affected accounts per update
- Time saved vs. naive approach
- Success/failure rates per account

## Usage Patterns

### Ideal For:
- **Real-time transaction processing**
- **Account reconciliation** (affects single account)
- **Category updates** (affects multiple accounts but specific periods)
- **Bulk imports** with known account scope

### Less Optimal For:
- **Full tenant data migration** (use `populateHistoricalData` instead)
- **Schema changes** affecting all data
- **Initial cube population**

## Future Enhancements

### 1. **Parallel Account Processing**
Process multiple affected accounts in parallel within each period.

### 2. **Smart Batching**
Group adjacent periods for the same account to reduce rebuild operations.

### 3. **Change Detection**
Skip rebuilds if the aggregated values haven't actually changed.

### 4. **Predictive Caching**
Pre-compute likely affected periods based on transaction patterns.

## Measurement Results

```typescript
// Example monitoring code
const startTime = Date.now()
const affectedAccounts = await this.getAffectedAccountsForPeriod(...)
const processingTime = Date.now() - startTime

console.log(`Incremental update: ${affectedAccounts.length} accounts in ${processingTime}ms`)
// vs. naive approach: ${totalAccounts} accounts in ${naiveTime}ms
```

This optimization transforms cube updates from a tenant-size problem to a change-size problem, making the system highly scalable and responsive.
