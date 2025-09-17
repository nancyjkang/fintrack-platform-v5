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

### Dual Approach: Individual Deltas vs Bulk Metadata

The system supports two approaches based on the operation type:

1. **Individual Delta Approach**: For single transaction changes and mixed operations
2. **Bulk Metadata Approach**: For bulk updates affecting multiple transactions with the same field changes

### Bulk Metadata Interface

```typescript
interface BulkUpdateMetadata {
  tenantId: string
  affectedTransactionIds: number[]
  changedFields: {
    fieldName: keyof CubeRelevantFields
    oldValue: any
    newValue: any
  }[]
  dateRange?: {
    startDate: Date
    endDate: Date
  }
  // Optional: transaction type if all transactions are the same type
  transactionType?: string
}

interface CubeRelevantFields {
  account_id: number
  category_id: number | null
  amount: Decimal
  date: Date
  type: string
  is_recurring: boolean
}
```

### Bulk Update Cube Service

```typescript
async updateCubeWithBulkMetadata(bulkUpdate: BulkUpdateMetadata): Promise<DeltaProcessingResult> {
  // Step 1: Calculate affected periods from date range (not individual dates!)
  const periods = this.calculatePeriodsForDateRange(
    bulkUpdate.dateRange?.startDate || await this.getEarliestTransactionDate(bulkUpdate.affectedTransactionIds),
    bulkUpdate.dateRange?.endDate || await this.getLatestTransactionDate(bulkUpdate.affectedTransactionIds)
  )

  // Step 2: Direct calculation of regeneration targets based on changed fields
  const targets = this.calculateRegenerationTargetsFromBulk(bulkUpdate, periods)

  // Step 3: Group and regenerate (same as delta approach)
  const periodGroups = this.groupCubesByPeriod(targets)
  await this.regenerateCubeRecords(periodGroups)

  return {
    cubesToRegenerate: targets,
    affectedPeriods: this.extractAffectedPeriods(targets),
    totalDeltas: bulkUpdate.affectedTransactionIds.length,
    processedAt: getCurrentUTCDate()
  }
}

private calculateRegenerationTargetsFromBulk(
  bulkUpdate: BulkUpdateMetadata,
  periods: Period[]
): CubeRegenerationTarget[] {
  const targets: CubeRegenerationTarget[] = []

  for (const change of bulkUpdate.changedFields) {
    for (const period of periods) {

      if (change.fieldName === 'category_id') {
        // Category change affects both old and new category cubes
        if (change.oldValue !== null) {
          targets.push({
            tenantId: bulkUpdate.tenantId,
            periodType: period.type,
            periodStart: period.start,
            periodEnd: period.end,
            transactionType: bulkUpdate.transactionType || 'EXPENSE', // Default or derive
            categoryId: change.oldValue
          })
        }

        if (change.newValue !== null) {
          targets.push({
            tenantId: bulkUpdate.tenantId,
            periodType: period.type,
            periodStart: period.start,
            periodEnd: period.end,
            transactionType: bulkUpdate.transactionType || 'EXPENSE',
            categoryId: change.newValue
          })
        }
      }

      if (change.fieldName === 'account_id') {
        // Account change - regenerate for the category (derive from transactions)
        // This requires querying the transactions to get their categories
        const affectedCategories = await this.getCategoriesForTransactions(bulkUpdate.affectedTransactionIds)

        for (const categoryId of affectedCategories) {
          targets.push({
            tenantId: bulkUpdate.tenantId,
            periodType: period.type,
            periodStart: period.start,
            periodEnd: period.end,
            transactionType: bulkUpdate.transactionType || 'EXPENSE',
            categoryId: categoryId
          })
        }
      }

      if (change.fieldName === 'date') {
        // Date change affects both old and new periods
        // This is more complex and might fall back to individual delta processing
      }

      // Handle other field types as needed...
    }
  }

  // Remove duplicates (much smaller set than individual delta approach)
  return this.deduplicateTargets(targets)
}
```

### Change Capture Points

```typescript
// In transaction.service.ts
class TransactionService {
  // Individual transaction update (uses delta approach)
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

    // 4. Update cube with individual delta
    await cubeService.updateCubeWithDeltas([delta])

    return newTransaction
  }

  // Bulk transaction update (uses bulk metadata approach)
  async bulkUpdateTransactions(
    transactionIds: number[],
    updates: Partial<CubeRelevantFields>,
    tenantId: string
  ): Promise<void> {
    // 1. Get old values for affected transactions (for cube calculation)
    const oldTransactions = await this.prisma.transaction.findMany({
      where: { id: { in: transactionIds }, tenant_id: tenantId },
      select: { id: true, account_id: true, category_id: true, amount: true, date: true, type: true, is_recurring: true }
    })

    // 2. Apply bulk update
    await this.prisma.transaction.updateMany({
      where: { id: { in: transactionIds }, tenant_id: tenantId },
      data: updates
    })

    // 3. Create bulk metadata from the update
    const bulkMetadata = this.createBulkUpdateMetadata(oldTransactions, updates, tenantId)

    // 4. Update cube efficiently with bulk metadata
    await this.cubeService.updateCubeWithBulkMetadata(bulkMetadata)
  }

  private createBulkUpdateMetadata(
    oldTransactions: Transaction[],
    updates: Partial<CubeRelevantFields>,
    tenantId: string
  ): BulkUpdateMetadata {
    const changedFields: BulkUpdateMetadata['changedFields'] = []

    // Determine which fields changed and their old/new values
    if (updates.category_id !== undefined) {
      // For category changes, we need to handle multiple old values
      const uniqueOldCategories = [...new Set(oldTransactions.map(t => t.category_id))]

      if (uniqueOldCategories.length === 1) {
        // All transactions had the same old category - simple case
        changedFields.push({
          fieldName: 'category_id',
          oldValue: uniqueOldCategories[0],
          newValue: updates.category_id
        })
      } else {
        // Multiple old categories - fall back to individual delta processing
        throw new Error('Bulk update with multiple old category values not supported. Use individual updates.')
      }
    }

    if (updates.account_id !== undefined) {
      const uniqueOldAccounts = [...new Set(oldTransactions.map(t => t.account_id))]

      if (uniqueOldAccounts.length === 1) {
        changedFields.push({
          fieldName: 'account_id',
          oldValue: uniqueOldAccounts[0],
          newValue: updates.account_id
        })
      } else {
        throw new Error('Bulk update with multiple old account values not supported. Use individual updates.')
      }
    }

    // Calculate date range from affected transactions
    const dates = oldTransactions.map(t => t.date)
    const dateRange = {
      startDate: new Date(Math.min(...dates.map(d => d.getTime()))),
      endDate: new Date(Math.max(...dates.map(d => d.getTime())))
    }

    // Determine transaction type (assume uniform for bulk operations)
    const transactionTypes = [...new Set(oldTransactions.map(t => t.type))]
    const transactionType = transactionTypes.length === 1 ? transactionTypes[0] : undefined

    return {
      tenantId,
      affectedTransactionIds: oldTransactions.map(t => t.id),
      changedFields,
      dateRange,
      transactionType
    }
  }
}
```

### Delta Processing Algorithm (OPTIMIZED)

```typescript
async updateCubeWithDeltas(deltas: TransactionDelta[]): Promise<void> {
  if (deltas.length === 0) return

  // OPTIMIZATION: Step 1 - Get ALL unique dates from deltas (single pass)
  const uniqueDates = new Set<string>()
  for (const delta of deltas) {
    if (delta.oldValues?.date) {
      uniqueDates.add(delta.oldValues.date.toISOString().split('T')[0])
    }
    if (delta.newValues?.date) {
      uniqueDates.add(delta.newValues.date.toISOString().split('T')[0])
    }
  }

  // OPTIMIZATION: Step 2 - Calculate ALL distinct periods once
  const allPeriods = this.calculateDistinctPeriods(
    Array.from(uniqueDates).map(dateStr => new Date(dateStr))
  )

  // OPTIMIZATION: Step 3 - Create period lookup map for O(1) access
  const periodLookup = new Map<string, Period[]>()
  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr)
    periodLookup.set(dateStr, allPeriods.filter(period =>
      date >= period.start && date <= period.end
    ))
  }

  // Step 4: Detect broader cube criteria (not individual records) using optimized lookup
  const cubesToRegenerate = await this.detectCubesToRegenerate(deltas, periodLookup)

  // Step 5: Group cubes by period for efficient regeneration
  const periodGroups = this.groupCubesByPeriod(cubesToRegenerate)

  // Step 6: Delete and rebuild cube records matching broader criteria
  await this.regenerateCubeRecords(periodGroups)
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

### Optimized Cube Criteria Detection with Map-Based Deduplication

Instead of string concatenation, use structured Map-based deduplication:

```typescript
class CubeRegenerationMap {
  private map = new Map<string, CubeRegenerationTarget>()

  add(criteria: CubeRegenerationTarget): void {
    const key = JSON.stringify({
      tenantId: criteria.tenantId,
      periodType: criteria.periodType,
      periodStart: criteria.periodStart.toISOString(),
      transactionType: criteria.transactionType,
      categoryId: criteria.categoryId
    })
    this.map.set(key, criteria)
  }

  getAll(): CubeRegenerationTarget[] {
    return Array.from(this.map.values())
  }
}

private async detectCubesToRegenerate(deltas: TransactionDelta[]): Promise<CubeRegenerationTarget[]> {
  const regenerationMap = new CubeRegenerationMap()

  // Step 1-3: Build optimized period lookup
  const periodLookup = this.buildPeriodLookup(deltas)

  for (const delta of deltas) {
    const affectedCriteria = this.getCubeRegenerationCriteria(delta, periodLookup)

    // Add to map - handles deduplication automatically
    for (const criteria of affectedCriteria) {
      regenerationMap.add(criteria)
    }
  }

  return regenerationMap.getAll()
}

private buildPeriodLookup(deltas: TransactionDelta[]): Map<string, Period[]> {
  // OPTIMIZATION: Step 1 - Get ALL unique dates from deltas (single pass)
  const uniqueDates = new Set<string>()
  for (const delta of deltas) {
    if (delta.oldValues?.date) {
      uniqueDates.add(delta.oldValues.date.toISOString().split('T')[0])
    }
    if (delta.newValues?.date) {
      uniqueDates.add(delta.newValues.date.toISOString().split('T')[0])
    }
  }

  // OPTIMIZATION: Step 2 - Calculate ALL distinct periods once
  const allPeriods = this.calculateDistinctPeriods(
    Array.from(uniqueDates).map(dateStr => new Date(dateStr))
  )

  // OPTIMIZATION: Step 3 - Create period lookup map for O(1) access
  const periodLookup = new Map<string, Period[]>()
  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr)
    periodLookup.set(dateStr, allPeriods.filter(period =>
      date >= period.start && date <= period.end
    ))
  }

  return periodLookup
}

private getCubeRegenerationCriteria(delta: TransactionDelta, periodLookup: Map<string, Period[]>): CubeRegenerationTarget[] {
  const criteria: CubeRegenerationTarget[] = []

  // Get affected periods using O(1) lookup
  const relevantDates = new Set<string>()
  if (delta.oldValues?.date) {
    relevantDates.add(delta.oldValues.date.toISOString().split('T')[0])
  }
  if (delta.newValues?.date) {
    relevantDates.add(delta.newValues.date.toISOString().split('T')[0])
  }

  for (const dateStr of relevantDates) {
    const periods = periodLookup.get(dateStr) || []

    for (const period of periods) {
      // Generate broader criteria for old values (if exists)
      if (delta.oldValues) {
        criteria.push({
          tenantId: delta.tenantId,
          periodType: period.type,
          periodStart: period.start,
          periodEnd: period.end,
          transactionType: delta.oldValues.type,
          categoryId: delta.oldValues.category_id
          // Note: NO account_id or is_recurring - covers ALL combinations
        })
      }

      // Generate broader criteria for new values (if exists)
      if (delta.newValues) {
        criteria.push({
          tenantId: delta.tenantId,
          periodType: period.type,
          periodStart: period.start,
          periodEnd: period.end,
          transactionType: delta.newValues.type,
          categoryId: delta.newValues.category_id
          // Note: NO account_id or is_recurring - covers ALL combinations
        })
      }
    }
  }

  return criteria
}
```

### Regeneration with Broader Criteria

```typescript
async regenerateCubeRecords(periodGroups: Map<string, CubeRegenerationTarget[]>) {
  for (const [periodKey, targets] of periodGroups) {
    await this.prisma.$transaction(async (tx) => {

      // Step 1: Delete all matching cubes using broader criteria
      for (const target of targets) {
        await tx.financialCube.deleteMany({
          where: {
            tenant_id: target.tenantId,
            period_type: target.periodType,
            period_start: target.periodStart,
            transaction_type: target.transactionType,
            category_id: target.categoryId,
            // Deletes ALL accounts and recurring statuses for this criteria
          }
        })
      }

      // Step 2: Rebuild all cubes for these broader criteria
      for (const target of targets) {
        await this.buildCubeForSinglePeriod(
          target.tenantId,
          target.periodType,
          target.periodStart,
          target.periodEnd,
          undefined, // accountId = undefined (rebuild for ALL accounts)
          {
            transactionType: target.transactionType,
            categoryId: target.categoryId
          }
        )
      }
    })
  }
}
```

## Scenario Walkthrough: Bulk Metadata Approach (Preferred)

**Scenario**: 100 transactions, category-only update (Food → Entertainment), same date (2024-01-15), 3 accounts, mix recurring/non-recurring

### Input: Single BulkUpdateMetadata

```typescript
const bulkUpdate: BulkUpdateMetadata = {
  tenantId: 'user123',
  affectedTransactionIds: [1, 2, 3, ..., 100], // 100 transaction IDs
  changedFields: [
    {
      fieldName: 'category_id',
      oldValue: 1, // Food
      newValue: 2  // Entertainment
    }
  ],
  dateRange: {
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-15') // Same date for all
  },
  transactionType: 'EXPENSE'
}
```

### Step 1: calculatePeriodsForDateRange(dateRange)

**Input**: Date range (2024-01-15 to 2024-01-15)
**Processing**:
```typescript
// Direct calculation from date range (not individual transaction dates!)
periods = [
  { type: 'WEEKLY', start: '2024-01-15', end: '2024-01-21' },
  { type: 'MONTHLY', start: '2024-01-01', end: '2024-01-31' }
]
```

**Output**: 2 periods (WEEKLY, MONTHLY)

### Step 2: calculateRegenerationTargetsFromBulk(bulkUpdate, periods)

**Input**: BulkUpdateMetadata + 2 periods
**Processing**:
```typescript
const targets: CubeRegenerationTarget[] = []

for (const change of bulkUpdate.changedFields) { // 1 change (category_id)
  if (change.fieldName === 'category_id') {
    for (const period of periods) { // 2 periods

      // Old category (Food)
      targets.push({
        tenantId: 'user123',
        periodType: period.type,
        periodStart: period.start,
        periodEnd: period.end,
        transactionType: 'EXPENSE',
        categoryId: 1 // oldValue
      })

      // New category (Entertainment)
      targets.push({
        tenantId: 'user123',
        periodType: period.type,
        periodStart: period.start,
        periodEnd: period.end,
        transactionType: 'EXPENSE',
        categoryId: 2 // newValue
      })
    }
  }
}

// Result: 1 field × 2 periods × 2 values (old + new) = 4 targets
// NO deduplication needed - calculated exactly!
```

**Output**: Exactly 4 `CubeRegenerationTarget` objects

### Step 3: groupCubesByPeriod(targets) - **This answers your question!**

**Input**: 4 regeneration targets
**Processing**:
```typescript
// Group targets by period for efficient database operations
const periodGroups = new Map<string, CubeRegenerationTarget[]>()

for (const target of targets) {
  const periodKey = `${target.periodType}-${target.periodStart.toISOString()}`

  if (!periodGroups.has(periodKey)) {
    periodGroups.set(periodKey, [])
  }

  periodGroups.get(periodKey)!.push(target)
}

// Result:
periodGroups = Map {
  "WEEKLY-2024-01-15T00:00:00.000Z" => [
    { periodType: 'WEEKLY', periodStart: '2024-01-15', categoryId: 1 }, // Food
    { periodType: 'WEEKLY', periodStart: '2024-01-15', categoryId: 2 }  // Entertainment
  ],
  "MONTHLY-2024-01-01T00:00:00.000Z" => [
    { periodType: 'MONTHLY', periodStart: '2024-01-01', categoryId: 1 }, // Food
    { periodType: 'MONTHLY', periodStart: '2024-01-01', categoryId: 2 }  // Entertainment
  ]
}
```

**Output**: Map with 2 period groups, each containing 2 targets

**Why Group by Period?**
- **Database Efficiency**: Process all targets for the same period in a single transaction
- **Atomic Operations**: Ensure consistency within each time period
- **Reduced Connections**: Fewer database round trips
- **Better Performance**: Batch operations are faster than individual operations

### Step 4: regenerateCubeRecords(periodGroups)

**Input**: Map with 2 period groups
**Processing**:
```typescript
for (const [periodKey, targets] of periodGroups) {
  await this.prisma.$transaction(async (tx) => {

    // Delete all matching cubes for this period
    for (const target of targets) {
      await tx.financialCube.deleteMany({
        where: {
          tenant_id: target.tenantId,
          period_type: target.periodType,
          period_start: target.periodStart,
          transaction_type: target.transactionType,
          category_id: target.categoryId
          // Deletes ALL accounts and recurring statuses for this category
        }
      })
    }

    // Rebuild cubes for this period
    for (const target of targets) {
      await this.buildCubeForSinglePeriod(
        target.tenantId,
        target.periodType,
        target.periodStart,
        target.periodEnd,
        undefined, // All accounts
        {
          transactionType: target.transactionType,
          categoryId: target.categoryId
        }
      )
    }
  })
}
```

**Database Operations**:
- **2 transactions** (one per period group)
- **4 delete operations** (one per target)
- **4 rebuild operations** (one per target)
- **Total: 10 operations** instead of 100+ individual operations

### Performance Summary: Bulk Metadata Approach

| Step | Input Size | Output Size | Operations |
|------|------------|-------------|------------|
| `calculatePeriodsForDateRange` | 1 date range | 2 periods | 1 calculation |
| `calculateRegenerationTargetsFromBulk` | 1 bulk metadata + 2 periods | 4 targets | Direct calculation |
| `groupCubesByPeriod` | 4 targets | 2 period groups | 4 grouping operations |
| `regenerateCubeRecords` | 2 period groups | Database updates | 2 transactions, 8 DB operations |
| **Total** | **1 bulk metadata** | **4 regeneration targets** | **~15 total operations** |

**Key Insight**: Step 5 (grouping by period) enables **atomic, efficient database operations** by batching all regeneration targets for the same time period together!

## Bulk Metadata Approach: Superior Performance

### Scenario: Bulk Category Update

**Setup**: 100 transactions, all changing from Food (category 1) to Entertainment (category 2), same date (2024-01-15)

### Input: Single BulkUpdateMetadata

```typescript
const bulkUpdate: BulkUpdateMetadata = {
  tenantId: 'user123',
  affectedTransactionIds: [1, 2, 3, ..., 100], // 100 transaction IDs
  changedFields: [
    {
      fieldName: 'category_id',
      oldValue: 1, // Food
      newValue: 2  // Entertainment
    }
  ],
  dateRange: {
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-15') // Same date for all
  },
  transactionType: 'EXPENSE'
}
```

### Processing: Direct Calculation

```typescript
// Step 1: Calculate periods from date range (not individual dates!)
periods = [
  { type: 'WEEKLY', start: '2024-01-15', end: '2024-01-21' },
  { type: 'MONTHLY', start: '2024-01-01', end: '2024-01-31' }
]

// Step 2: Direct calculation based on changed fields
for (const change of bulkUpdate.changedFields) {
  if (change.fieldName === 'category_id') {
    for (const period of periods) {
      // Old category (Food)
      targets.push({ periodType: period.type, periodStart: period.start, categoryId: 1 })
      // New category (Entertainment)
      targets.push({ periodType: period.type, periodStart: period.start, categoryId: 2 })
    }
  }
}

// Result: Exactly 4 targets, no deduplication needed!
```

### Output: Predictable Result

```typescript
cubesToRegenerate = [
  { tenantId: 'user123', periodType: 'WEEKLY', periodStart: '2024-01-15', categoryId: 1 },
  { tenantId: 'user123', periodType: 'MONTHLY', periodStart: '2024-01-01', categoryId: 1 },
  { tenantId: 'user123', periodType: 'WEEKLY', periodStart: '2024-01-15', categoryId: 2 },
  { tenantId: 'user123', periodType: 'MONTHLY', periodStart: '2024-01-01', categoryId: 2 }
]
```

### Performance Comparison: Bulk Metadata vs Individual Deltas

| Approach | Input Processing | Intermediate Objects | Deduplication | Final Output | Total Operations |
|----------|------------------|---------------------|---------------|--------------|------------------|
| **Individual Deltas** | 100 deltas | 400 criteria objects | Required | 4 targets | ~500 operations |
| **Bulk Metadata** | 1 bulk metadata | 4 targets directly | Not needed | 4 targets | ~10 operations |
| **Improvement** | **99% reduction** | **99% reduction** | **Eliminated** | Same result | **98% reduction** |

### Key Benefits of Bulk Metadata Approach

1. **Predictable Output**: `changedFields.length × periods.length × (oldValue + newValue) = exact target count`
2. **No Deduplication**: Direct calculation eliminates need for duplicate removal
3. **Minimal Processing**: Work with change metadata, not individual transaction data
4. **Better Performance**: O(fields × periods) instead of O(transactions × fields × periods)
5. **Simpler Logic**: Straightforward calculation instead of process-then-deduplicate

## Performance Benefits

### Optimization Impact: Broader Criteria Approach

**Scenario**: 100 transactions, category-only update (Food → Entertainment), same date (2024-01-15), 3 accounts, mix recurring/non-recurring

| Approach | Date Processing | Period Calculations | Cube Criteria Detection | Database Operations |
|----------|----------------|-------------------|----------------------|-------------------|
| **Naive** | 200 dates (100 old + 100 new) | 400 period calculations | 400 individual cube records | 400+ DB operations |
| **Optimized (Individual)** | 1 unique date | 2 period calculations | 24 unique cube records | 24+ DB operations |
| **Optimized (Broader Criteria)** | 1 unique date | 2 period calculations | **4 broader criteria** | **4 DB operations** |
| **Improvement vs Naive** | **99.5% reduction** | **99.5% reduction** | **99% reduction** | **99% reduction** |
| **Improvement vs Individual** | Same | Same | **83% reduction** | **83% reduction** |

**Expected `cubesToRegenerate` result:**
```typescript
[
  // Food category (old values) - covers ALL accounts & recurring statuses
  { tenantId, periodType: 'WEEKLY', periodStart: '2024-01-15', transactionType: 'EXPENSE', categoryId: 1 },
  { tenantId, periodType: 'MONTHLY', periodStart: '2024-01-01', transactionType: 'EXPENSE', categoryId: 1 },

  // Entertainment category (new values) - covers ALL accounts & recurring statuses
  { tenantId, periodType: 'WEEKLY', periodStart: '2024-01-15', transactionType: 'EXPENSE', categoryId: 2 },
  { tenantId, periodType: 'MONTHLY', periodStart: '2024-01-01', transactionType: 'EXPENSE', categoryId: 2 }
]
```

**Result: 4 broader criteria instead of 24 individual records or 400 naive operations!**

### Current System vs Delta System

| Scenario | Current Approach | Delta Approach (Optimized) | Improvement |
|----------|------------------|---------------------------|-------------|
| Single transaction update | Rebuild entire period (1000+ transactions) | Apply targeted regeneration (2-4 cube records) | 99.8% faster |
| Bulk update (100 transactions, same category) | Rebuild multiple periods | Process 1 unique date → 24 cube records | 97% faster |
| Cross-period transaction move | Rebuild 2 periods | Apply 2 deltas with optimized period lookup | 99.9% faster |
| High-frequency updates | Queued period rebuilds | Real-time optimized delta application | Near-instant |

### Scalability Characteristics

#### Individual Delta Approach
- **Time Complexity**: O(unique_dates + unique_criteria) instead of O(total_transactions_in_period)
- **Space Complexity**: O(unique_period_category_combinations) instead of O(all_transactions)
- **Date Processing**: O(1) per unique date instead of O(n) per delta
- **Period Calculation**: O(unique_dates) instead of O(total_deltas)
- **Criteria Detection**: O(unique_period_category_pairs) instead of O(account × recurring × category combinations)
- **Database Operations**: O(broader_criteria) instead of O(individual_cube_records)

#### Bulk Metadata Approach (Preferred for Bulk Operations)
- **Time Complexity**: O(changed_fields × periods) instead of O(transactions × fields × periods)
- **Space Complexity**: O(changed_fields × periods × old_new_values) - minimal and predictable
- **Date Processing**: O(1) - single date range calculation instead of per-transaction processing
- **Period Calculation**: O(date_range) instead of O(unique_dates_from_all_transactions)
- **Criteria Detection**: O(fields × periods × values) - direct calculation, no deduplication needed
- **Database Operations**: O(exact_regeneration_targets) - no over-processing

#### Approach Selection Strategy

| Scenario | Recommended Approach | Reason |
|----------|---------------------|---------|
| **Single transaction update** | Individual Delta | Simple, direct processing |
| **Bulk update (same field change)** | **Bulk Metadata** | 98% performance improvement |
| **Mixed operations (INSERT/UPDATE/DELETE)** | Individual Delta | Complex change patterns |
| **Cross-period date changes** | Individual Delta | Requires per-transaction period calculation |
| **Bulk category/account changes** | **Bulk Metadata** | Predictable output, no deduplication |

**Key Optimizations**:
1. **Bulk Metadata**: Direct calculation eliminates intermediate processing steps
2. **Unique Date Processing**: Scales with distinct dates, not transaction count
3. **Broader Criteria**: Scales with period×category combinations, not account×recurring×category
4. **Database Efficiency**: Let PostgreSQL handle complexity with optimized WHERE clauses
5. **Smart Approach Selection**: Use the right tool for each operation type

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

## Individual Transaction Cube Integration Architecture

**Date Added**: 2025-09-17  
**Context**: Integration of cube updates with individual transaction CRUD operations

### Design Decision: Operation-Specific Approaches

After analysis, we determined that different transaction operations require different cube integration strategies:

#### 1. INSERT Operations (createTransaction)
**Approach**: Direct transaction addition - no delta needed
```typescript
await cubeService.addTransaction(transaction, tenantId)
```

**Rationale**: 
- No "before" state exists for new transactions
- Delta concept doesn't apply (no old values)
- Simple addition to affected cube periods is sufficient

#### 2. UPDATE Operations (updateTransaction)  
**Approach**: Delta-based updates with old vs new values
```typescript
const delta = {
  transactionId: id,
  oldValues: { account_id: 100, category_id: 5, amount: 50.00 },
  newValues: { account_id: 100, category_id: 8, amount: 75.00 }
}
await cubeService.updateTransaction(delta, tenantId)
```

**Rationale**:
- Deltas are valuable for precision (only update affected categories/amounts)
- Enables efficient cube updates (subtract old impact, add new impact)
- Optimizes performance by avoiding unnecessary regeneration

#### 3. DELETE Operations (deleteTransaction)
**Approach**: Direct transaction removal - no delta needed  
```typescript
await cubeService.removeTransaction(transaction, tenantId)
```

**Rationale**:
- Only need to remove the transaction's impact from cube
- No "after" state exists for deleted transactions
- Simple subtraction from affected cube periods

### Implementation Benefits

1. **Semantic Clarity**: Each operation uses the most appropriate approach
2. **Performance Optimization**: No unnecessary delta creation for INSERT/DELETE
3. **Precision**: UPDATE operations get full delta benefits for targeted updates
4. **Maintainability**: Clear separation of concerns between operation types

### Rejected Approach: Unified Delta System

We considered using deltas for all operations but rejected this because:
- INSERT operations with `oldValue: null` for all fields is wasteful and confusing
- DELETE operations with `newValue: null` for all fields adds unnecessary complexity
- Forces inappropriate abstractions where simpler direct methods are clearer

This operation-specific approach provides the right tool for each job while maintaining the delta benefits where they matter most (UPDATE operations).
