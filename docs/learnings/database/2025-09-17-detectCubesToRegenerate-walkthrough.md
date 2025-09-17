# detectCubesToRegenerate Method Walkthrough

## Overview
The `detectCubesToRegenerate` method is the core intelligence of our delta-based cube update system. It analyzes transaction deltas and determines exactly which cube records need to be regenerated, avoiding unnecessary work.

## Scenario Analysis
**Bulk Update Scenario:**
- **100 transactions** being updated
- **Same time period**: all transactions remain in period X (January 15, 2024) - NO date change
- **Category change ONLY**: from "Food" (category A, ID=1) to "Entertainment" (category B, ID=2)
- **Across 3 accounts**: Checking (ID=1), Savings (ID=2), Credit Card (ID=3)
- **Mix of transactions**: 60 non-recurring, 40 recurring

## Step-by-Step Code Walkthrough (OPTIMIZED APPROACH)

### Step 1: Get ALL Unique Dates (Single Pass)
```typescript
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
```

**What happens for our scenario:**
- 100 deltas, but only 1 unique date: "2024-01-15" (category-only change)
- `uniqueDates` Set contains: `["2024-01-15"]`
- **Massive optimization**: Instead of processing dates 200 times (100 old + 100 new), we process just 1 unique date!

### Step 2: Calculate ALL Distinct Periods Once
```typescript
// OPTIMIZATION: Step 2 - Calculate ALL distinct periods once
const allPeriods = this.calculateDistinctPeriods(
  Array.from(uniqueDates).map(dateStr => new Date(dateStr))
)
```

**What happens:**
- Input: 1 unique date (2024-01-15)
- Output: 2 periods
  - Weekly: 2024-01-15 to 2024-01-21 (week containing Jan 15)
  - Monthly: 2024-01-01 to 2024-01-31 (January 2024)
- **Key insight**: We calculate periods once, not 100 times per delta!

### Step 3: Create Period Lookup Map
```typescript
// OPTIMIZATION: Step 3 - Create period lookup map for O(1) access
const periodLookup = new Map<string, Period[]>()
for (const dateStr of uniqueDates) {
  const date = new Date(dateStr)
  periodLookup.set(dateStr, allPeriods.filter(period =>
    date >= period.start && date <= period.end
  ))
}
```

**What happens:**
- Creates lookup: `"2024-01-15" → [WeeklyPeriod, MonthlyPeriod]`
- **O(1) lookup** instead of recalculating periods for each delta

### Step 3: getCubeRecordsForDelta Analysis

#### 3a: Helper Function - addRecordsForTransaction
```typescript
const addRecordsForTransaction = (fields: CubeRelevantFields) => {
  const date = fields.date

  // Generate weekly and monthly periods for this date
  const weeklyPeriod = {
    type: 'WEEKLY' as const,
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday start
    end: endOfWeek(date, { weekStartsOn: 1 })
  }

  const monthlyPeriod = {
    type: 'MONTHLY' as const,
    start: startOfMonth(date),
    end: endOfMonth(date)
  }

  // Add records for both weekly and monthly periods
  for (const period of [weeklyPeriod, monthlyPeriod]) {
    records.push({
      tenantId: delta.tenantId,
      periodType: period.type,
      periodStart: period.start,
      transactionType: fields.type,
      categoryId: fields.category_id,
      accountId: fields.account_id,
      isRecurring: fields.is_recurring
    })
  }
}
```

**What this does for each transaction:**
- Calculates the weekly period (e.g., Jan 15-21, 2024)
- Calculates the monthly period (e.g., January 2024)
- Creates cube records for BOTH weekly and monthly periods
- Each record captures all dimensions: tenant, period, transaction type, category, account, recurring status

#### 3b: UPDATE Operation Processing
```typescript
else if (delta.operation === 'UPDATE') {
  // For UPDATE operations, both old and new values might affect different cube records
  if (delta.oldValues) {
    addRecordsForTransaction(delta.oldValues)
  }
  if (delta.newValues) {
    addRecordsForTransaction(delta.newValues)
  }
}
```

**For each UPDATE delta:**
- Processes OLD values (January period, Food category)
- Processes NEW values (January period, Entertainment category) - SAME PERIOD!
- This means each transaction affects **4 cube records** (2 old + 2 new)
- **Key insight**: Since the date is unchanged, both old and new records affect the SAME periods

### Step 4: Detailed Record Generation

**For a single transaction update (category-only change):**

**Old Values (January 15, 2024):**
- Account: Checking (ID=1)
- Category: Food (ID=1)
- Type: EXPENSE
- Recurring: false
- Date: 2024-01-15 (UNCHANGED)

**Generated Old Records:**
1. `tenant-123-WEEKLY-2024-01-15T00:00:00Z-EXPENSE-1-1-false`
2. `tenant-123-MONTHLY-2024-01-01T00:00:00Z-EXPENSE-1-1-false`

**New Values (January 15, 2024 - SAME DATE):**
- Account: Checking (ID=1) (UNCHANGED)
- Category: Entertainment (ID=2) (CHANGED)
- Type: EXPENSE (UNCHANGED)
- Recurring: false (UNCHANGED)
- Date: 2024-01-15 (UNCHANGED)

**Generated New Records:**
3. `tenant-123-WEEKLY-2024-01-15T00:00:00Z-EXPENSE-2-1-false`
4. `tenant-123-MONTHLY-2024-01-01T00:00:00Z-EXPENSE-2-1-false`

### Step 5: Deduplication Logic
```typescript
for (const record of affectedRecords) {
  // Create a unique key for this cube record
  const key = `${record.tenantId}-${record.periodType}-${record.periodStart.toISOString()}-${record.transactionType}-${record.categoryId}-${record.accountId}-${record.isRecurring}`

  if (!targets.has(key)) {
    targets.add(key)
    targetList.push(record)
  }
}
```

**Deduplication in action:**
- Creates unique string keys for each cube record
- Uses Set to prevent duplicates
- Only adds to `targetList` if not already seen

## Scenario Results Analysis

### Input: 100 Transaction Updates (Category-Only Change)
- 100 deltas × 4 records per delta = **400 potential cube records**

### Deduplication Impact
**Without deduplication:** 400 cube records to regenerate

**With deduplication (category-only scenario):**

**Accounts (3 total):** Checking, Savings, Credit Card
**Categories:** Food → Entertainment (2 categories affected)
**Periods:** January only (1 month, 1 week) - SAME PERIOD FOR ALL!
**Transaction Types:** EXPENSE (1 type)
**Recurring Status:** true/false (2 values)

**Unique cube records calculation:**
- **Monthly records:** 3 accounts × 2 categories × 1 month × 1 type × 2 recurring = **12 monthly records**
- **Weekly records:** 3 accounts × 2 categories × 1 week × 1 type × 2 recurring = **12 weekly records**

**Total unique cube records to regenerate: 24 records**

**Optimization achieved:** 400 → 24 = **94% reduction!**

### Key Insights

1. **Smart Deduplication:** Multiple transactions affecting the same cube dimensions are deduplicated
2. **Cross-Period Updates:** UPDATE operations affect both old and new periods
3. **Dimension Explosion:** Each transaction affects multiple cube dimensions (weekly + monthly)
4. **Recurring Status Matters:** Creates separate cube records for recurring vs non-recurring
5. **Account Distribution:** Spreading across 3 accounts increases unique combinations

### Performance Characteristics

**Time Complexity:** O(n × d) where:
- n = number of deltas (100)
- d = dimensions per delta (4 for UPDATE operations)

**Space Complexity:** O(u) where:
- u = unique cube records (~120 in this scenario)

**Database Impact:**
- **Without optimization:** Rebuild entire periods (potentially thousands of records)
- **With optimization:** Regenerate only 120 specific cube records
- **Efficiency gain:** 90%+ reduction in database operations

## Code Flow Summary

```
detectCubesToRegenerate(100 deltas)
├── Initialize: targets Set, targetList Array
├── For each delta (100 iterations):
│   ├── getCubeRecordsForDelta(delta)
│   │   ├── Process oldValues → 2 records (weekly + monthly)
│   │   └── Process newValues → 2 records (weekly + monthly)
│   └── Deduplicate using string keys
└── Return ~120 unique CubeRegenerationTargets
```

## Real-World Benefits

1. **Surgical Precision:** Only regenerates affected cube records
2. **Cross-Period Handling:** Properly handles date changes across periods
3. **Bulk Operation Efficiency:** Massive deduplication for bulk updates
4. **Resource Conservation:** Minimizes database operations and CPU usage
5. **Scalability:** Performance scales with unique dimensions, not transaction count

This approach transforms a potentially expensive operation (rebuilding entire periods) into a highly targeted and efficient regeneration process.
