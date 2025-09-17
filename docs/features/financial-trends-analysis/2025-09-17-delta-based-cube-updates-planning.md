# Delta-Based Cube Updates Planning Document

**Date**: 2025-09-17  
**Tags**: database, performance, cube, delta-tracking, planning  
**Context**: Financial Trends Cube Optimization

## Problem Statement

Current cube update system rebuilds entire periods when transactions change, but this is inefficient because:

1. **Missing old values**: When transactions are updated/deleted, we lose the original values that need to be subtracted from the cube
2. **Over-processing**: Rebuilding entire periods processes unchanged transactions
3. **Race conditions**: Multiple concurrent updates can cause inconsistent cube state
4. **Scalability**: Performance degrades with transaction volume, not change volume

## Proposed Solution: Delta-Based Updates

Track transaction changes (before/after states) and apply precise incremental updates to the cube instead of rebuilding periods.

## Core Components

### 1. Transaction Change Tracking

```typescript
interface TransactionDelta {
  transactionId: number
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  tenantId: string
  
  // Old values (for UPDATE/DELETE operations)
  oldValues?: {
    account_id: number
    category_id: number | null
    amount: Decimal
    date: Date
    type: string
    is_recurring: boolean
  }
  
  // New values (for INSERT/UPDATE operations)
  newValues?: {
    account_id: number
    category_id: number | null
    amount: Decimal
    date: Date
    type: string
    is_recurring: boolean
  }
  
  // Metadata
  timestamp: Date
  userId?: string
}
```

### 2. Delta Calculation Engine

```typescript
interface CubeDelta {
  // Cube record identification
  tenant_id: string
  period_type: 'WEEKLY' | 'MONTHLY'
  period_start: Date
  period_end: Date
  transaction_type: string
  category_id: number | null
  account_id: number
  is_recurring: boolean
  
  // Delta values (can be positive or negative)
  amount_delta: Decimal
  count_delta: number
}
```

### 3. Atomic Cube Updates

Apply deltas atomically to maintain consistency:
- **Subtract old values** (for UPDATE/DELETE)
- **Add new values** (for INSERT/UPDATE)
- **Handle zero-sum records** (remove if amount and count become zero)

## Implementation Strategy

### Phase 1: Change Capture Infrastructure

1. **Service-level interceptors** in transaction CRUD operations
2. **Change event queue** for async processing
3. **Delta calculation utilities**

### Phase 2: Delta-Based Cube Service

1. **New `updateCubeWithDeltas()` method**
2. **Period detection from deltas**
3. **Atomic cube record updates**

### Phase 3: Integration & Migration

1. **Replace current `updateCubeForTransactions()`**
2. **Backward compatibility layer**
3. **Performance monitoring**

## Detailed Design

### Change Capture Points

```typescript
// In transaction.service.ts
class TransactionService {
  async updateTransaction(id: number, data: UpdateData): Promise<Transaction> {
    // 1. Fetch old values
    const oldTransaction = await this.getTransaction(id)
    
    // 2. Apply update
    const newTransaction = await this.prisma.transaction.update({...})
    
    // 3. Capture delta
    const delta: TransactionDelta = {
      transactionId: id,
      operation: 'UPDATE',
      tenantId: oldTransaction.tenant_id,
      oldValues: extractCubeRelevantFields(oldTransaction),
      newValues: extractCubeRelevantFields(newTransaction),
      timestamp: new Date()
    }
    
    // 4. Queue cube update
    await cubeService.updateCubeWithDeltas([delta])
    
    return newTransaction
  }
}
```

### Delta Processing Algorithm

```typescript
async updateCubeWithDeltas(deltas: TransactionDelta[]): Promise<void> {
  // 1. Group deltas by affected periods
  const periodDeltas = this.groupDeltasByPeriod(deltas)
  
  // 2. For each period, calculate net changes
  for (const [periodKey, periodDeltas] of periodDeltas) {
    const cubeDeltas = this.calculateCubeDeltas(periodDeltas)
    
    // 3. Apply deltas atomically
    await this.applyCubeDeltas(cubeDeltas)
  }
}

private calculateCubeDeltas(deltas: TransactionDelta[]): CubeDelta[] {
  const cubeDeltas = new Map<string, CubeDelta>()
  
  for (const delta of deltas) {
    // Process old values (subtract)
    if (delta.oldValues) {
      const key = this.getCubeKey(delta.oldValues, period)
      this.addToCubeDelta(cubeDeltas, key, {
        amount_delta: delta.oldValues.amount.negated(),
        count_delta: -1
      })
    }
    
    // Process new values (add)
    if (delta.newValues) {
      const key = this.getCubeKey(delta.newValues, period)
      this.addToCubeDelta(cubeDeltas, key, {
        amount_delta: delta.newValues.amount,
        count_delta: 1
      })
    }
  }
  
  return Array.from(cubeDeltas.values())
}
```

### Atomic Cube Updates

```typescript
private async applyCubeDeltas(deltas: CubeDelta[]): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    for (const delta of deltas) {
      // Try to update existing record
      const updated = await tx.financialCube.updateMany({
        where: {
          tenant_id: delta.tenant_id,
          period_type: delta.period_type,
          period_start: delta.period_start,
          period_end: delta.period_end,
          transaction_type: delta.transaction_type,
          category_id: delta.category_id,
          account_id: delta.account_id,
          is_recurring: delta.is_recurring
        },
        data: {
          total_amount: {
            increment: delta.amount_delta
          },
          transaction_count: {
            increment: delta.count_delta
          }
        }
      })
      
      // If no existing record, create new one (for positive deltas only)
      if (updated.count === 0 && delta.amount_delta.gt(0)) {
        await tx.financialCube.create({
          data: {
            tenant_id: delta.tenant_id,
            period_type: delta.period_type,
            period_start: delta.period_start,
            period_end: delta.period_end,
            transaction_type: delta.transaction_type,
            category_id: delta.category_id,
            category_name: await this.getCategoryName(delta.category_id),
            account_id: delta.account_id,
            account_name: await this.getAccountName(delta.account_id),
            is_recurring: delta.is_recurring,
            total_amount: delta.amount_delta,
            transaction_count: delta.count_delta
          }
        })
      }
      
      // Clean up zero-sum records
      await tx.financialCube.deleteMany({
        where: {
          tenant_id: delta.tenant_id,
          period_type: delta.period_type,
          period_start: delta.period_start,
          period_end: delta.period_end,
          transaction_type: delta.transaction_type,
          category_id: delta.category_id,
          account_id: delta.account_id,
          is_recurring: delta.is_recurring,
          total_amount: 0,
          transaction_count: 0
        }
      })
    }
  })
}
```

## Performance Benefits

### Current System vs Delta System

| Scenario | Current Approach | Delta Approach | Improvement |
|----------|------------------|----------------|-------------|
| Single transaction update | Rebuild entire period (1000+ transactions) | Apply 2 deltas (subtract old, add new) | 99.8% faster |
| Bulk update (100 transactions) | Rebuild multiple periods | Apply 200 deltas | 95% faster |
| Cross-period transaction move | Rebuild 2 periods | Apply 2 deltas | 99.9% faster |
| High-frequency updates | Queued period rebuilds | Real-time delta application | Near-instant |

### Scalability Characteristics

- **Time Complexity**: O(changes) instead of O(total_transactions_in_period)
- **Space Complexity**: O(unique_cube_dimensions_affected) instead of O(all_transactions)
- **Concurrency**: Lock-free delta application vs period-level locks
- **Consistency**: Atomic delta transactions vs eventual consistency

## Edge Cases & Considerations

### 1. **Concurrent Updates**
- **Problem**: Multiple deltas affecting same cube record
- **Solution**: Database-level atomic increments handle concurrency

### 2. **Category/Account Name Changes**
- **Problem**: Denormalized names become stale
- **Solution**: Separate process to update denormalized fields

### 3. **Historical Data Corrections**
- **Problem**: Bulk historical changes
- **Solution**: Fallback to period rebuild for large change sets

### 4. **Delta Queue Failures**
- **Problem**: Lost delta events
- **Solution**: Idempotent delta application with change log

### 5. **Cross-Period Transactions**
- **Problem**: Transaction date changes affecting multiple periods
- **Solution**: Generate deltas for all affected periods

## Monitoring & Observability

### Key Metrics
- **Delta processing time** per operation type
- **Cube consistency** validation checks
- **Queue depth** and processing lag
- **Error rates** by delta type

### Health Checks
- **Cube vs source data** reconciliation
- **Zero-sum record** cleanup effectiveness
- **Performance regression** detection

## Migration Strategy

### Phase 1: Parallel Implementation
- Implement delta system alongside current system
- Compare results for consistency
- Performance benchmarking

### Phase 2: Gradual Rollout
- Enable delta system for new transactions
- Migrate existing workloads incrementally
- Monitor performance and accuracy

### Phase 3: Full Migration
- Replace current system entirely
- Remove legacy code
- Optimize for delta-only workflow

## Success Criteria

1. **Performance**: 90%+ reduction in cube update time
2. **Accuracy**: 100% consistency with source data
3. **Reliability**: 99.9% delta processing success rate
4. **Scalability**: Linear performance with change volume
5. **Maintainability**: Clear separation of concerns

## Risks & Mitigation

### High Risk
- **Data inconsistency** → Comprehensive testing + rollback plan
- **Performance regression** → Gradual rollout + monitoring

### Medium Risk  
- **Increased complexity** → Thorough documentation + training
- **Edge case handling** → Extensive test coverage

### Low Risk
- **Migration effort** → Phased approach + automation
- **Monitoring overhead** → Efficient metrics collection

This delta-based approach transforms cube updates from a "rebuild everything" problem to a "apply precise changes" solution, enabling real-time financial analytics at scale.
