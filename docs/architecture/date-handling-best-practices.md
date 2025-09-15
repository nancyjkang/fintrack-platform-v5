# Date Handling Best Practices - FinTrack v4

## Overview

This document outlines the best practices for handling dates in the FinTrack v4 codebase. Proper date handling is crucial for financial applications to ensure data consistency across different timezones and environments.

**Key Principle**: Data that goes in should display the same when retrieved. When you add a transaction for 9/6/2025, you should see a transaction for 9/6/2025, not 9/5/2025.

## The Problem with `new Date()`

### Issues with Direct Date Constructor Usage

1. **Timezone Inconsistencies**: `new Date('2024-01-15')` creates a date in the local timezone, leading to different results in different environments
2. **Date Parsing Ambiguity**: Different browsers and Node.js versions may parse date strings differently
3. **Financial Data Corruption**: Timezone-related bugs can cause transactions to appear on the wrong dates
4. **Calculation Errors**: Balance calculations may be incorrect due to timezone shifts

### Examples of Problems

```typescript
// ❌ WRONG: These can produce different results in different timezones
const date1 = new Date('2024-01-15')           // Local timezone interpretation
const date2 = new Date('2024-01-15T00:00:00')  // Local timezone midnight
const date3 = new Date()                       // Current local time

// ❌ WRONG: Manual date arithmetic without timezone awareness
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)       // Can fail during DST transitions
```

## Recommended Approach

### Use Date Utilities (Port from v3)

FinTrack v4 will use the proven date utilities from v3, located in `src/lib/utils/date-utils.ts`. Always use these instead of raw `new Date()` calls.

```typescript
import {
  getCurrentDate,
  formatDateForDisplay,
  toUTCDateString,
  isValidDateString,
  isSameDay,
  isToday,
  isPast,
  isFuture
} from '@/lib/utils/date-utils'

// ✅ CORRECT: Get current date as YYYY-MM-DD string
const today = getCurrentDate()

// ✅ CORRECT: Format dates for user display
const displayDate = formatDateForDisplay('2024-01-15')

// ✅ CORRECT: Validate date strings
const isValid = isValidDateString('2024-01-15')

// ✅ CORRECT: Get UTC date string for storage
const dateString = toUTCDateString(someDate)
```

### Best Practices by Use Case

#### 1. Data Service Operations (v4)

```typescript
// ✅ CORRECT: Store dates as YYYY-MM-DD strings
const transactionData = {
  description: 'Grocery shopping',
  amount: -50.00,
  date: '2024-01-15',  // Store as YYYY-MM-DD string
  accountId: 1,
  categoryId: 2
}

// ✅ CORRECT: Query with date string ranges
const transactions = dataService.getTransactionsWithFilter({
  accountId: 1,
  startDate: '2024-01-01',
  endDate: '2024-01-31'
})
```

#### 2. Transaction Forms (v4)

```typescript
// ✅ CORRECT: Initialize form with current date
const [formData, setFormData] = useState({
  date: getCurrentDate(),  // Use getCurrentDate() instead of new Date().toISOString().split('T')[0]
  description: '',
  amount: '',
  // ... other fields
})

// ✅ CORRECT: Handle date input changes
const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const dateValue = e.target.value  // HTML date input returns YYYY-MM-DD
  setFormData(prev => ({ ...prev, date: dateValue }))
}
```

#### 3. Transaction Display (v4)

```typescript
// ✅ CORRECT: Format dates for display
const formatDate = (dateString: string) => {
  return formatDateForDisplay(dateString)  // Returns "Jan 15, 2024"
}

// ✅ CORRECT: Display in transaction table
{transactions.map(transaction => (
  <tr key={transaction.id}>
    <td>{formatDate(transaction.date)}</td>
    <td>{transaction.description}</td>
    <td>${Math.abs(transaction.amount).toFixed(2)}</td>
  </tr>
))}
```

#### 4. Balance Calculation (v4)

```typescript
// ✅ CORRECT: Use date strings for balance calculations
const calculateAccountBalance = (accountId: number, date: string) => {
  const anchor = findLatestBalanceAnchor(accountId, date)
  const transactions = getTransactionsWithFilter({
    accountId,
    startDate: anchor.anchorDate,
    endDate: date
  })

  return anchor.balance + transactions.reduce((sum, tx) => sum + tx.amount, 0)
}

// ✅ CORRECT: Check if date is today for real-time updates
if (isToday(transactionDate)) {
  // Update current balance display
}
```

#### 5. Testing (v4)

```typescript
// ✅ CORRECT: Use consistent date strings in tests
describe('Transaction Date Handling', () => {
  const testDate = '2024-01-15'
  const mockTransaction = {
    id: 1,
    description: 'Test transaction',
    amount: -50.00,
    date: testDate,
    accountId: 1,
    categoryId: 2
  }

  it('should store and retrieve dates consistently', () => {
    dataService.addTransaction(mockTransaction)
    const retrieved = dataService.getTransaction(1)
    expect(retrieved.date).toBe(testDate)
  })

  it('should format dates for display correctly', () => {
    const displayDate = formatDateForDisplay(testDate)
    expect(displayDate).toBe('Jan 15, 2024')
  })
})
```

## Function Reference

### Core Date Utilities (v4)

| Function | Purpose | Example |
|----------|---------|---------|
| `getCurrentDate()` | Get current date as YYYY-MM-DD string | `getCurrentDate()` |
| `formatDateForDisplay(dateString)` | Format date for user display | `formatDateForDisplay('2024-01-15')` |
| `isValidDateString(dateString)` | Validate date string format | `isValidDateString('2024-01-15')` |
| `toUTCDateString(date)` | Convert Date object to YYYY-MM-DD string | `toUTCDateString(someDate)` |

### Date Comparison Utilities

| Function | Purpose | Example |
|----------|---------|---------|
| `isSameDay(date1, date2)` | Check if same day in UTC | `isSameDay(transaction.date, today)` |
| `isToday(date)` | Check if date is today | `isToday(transaction.date)` |
| `isPast(date)` | Check if date is in past | `isPast(dueDate)` |
| `isFuture(date)` | Check if date is in future | `isFuture(scheduledDate)` |

### Validation and Debugging

| Function | Purpose | Example |
|----------|---------|---------|
| `isValidDateString(dateString)` | Validate date string | `isValidDateString('2024-01-15')` |
| `testDateConsistency(orig, stored)` | Test date consistency | `testDateConsistency(input, output)` |
| `validateDateConsistency(op, orig, proc)` | Validate operation consistency | `validateDateConsistency('save', input, saved)` |
| `getTimezoneInfo(date)` | Get timezone debugging info | `getTimezoneInfo(problemDate)` |

## Common Patterns

### Pattern 1: User Input to Data Service (v4)

```typescript
// User provides date string → Store as YYYY-MM-DD string
function createTransaction(data: { date: string, amount: number, description: string }) {
  // Validate date format
  if (!isValidDateString(data.date)) {
    throw new Error(`Invalid date format: ${data.date}`)
  }

  // Store directly as YYYY-MM-DD string
  dataService.addTransaction({
    ...data,
    date: data.date  // Store as YYYY-MM-DD string
  })
}
```

### Pattern 2: Data Service to Display (v4)

```typescript
// Data service YYYY-MM-DD string → Format for display
function getTransactionsForDisplay(accountId: number) {
  const transactions = dataService.getTransactions(accountId)

  return transactions.map(tx => ({
    ...tx,
    displayDate: formatDateForDisplay(tx.date)  // Format for user display
  }))
}
```

### Pattern 3: Balance Calculation (v4)

```typescript
// Calculate balance for specific date using date strings
function getBalanceForDate(accountId: number, dateString: string) {
  // Validate date format
  if (!isValidDateString(dateString)) {
    throw new Error(`Invalid date format: ${dateString}`)
  }

  return dataService.calculateAccountBalance(accountId, dateString)
}
```

## Testing Guidelines

### Test Date Consistency (v4)

```typescript
// ✅ CORRECT: Test date string consistency
it('should maintain date consistency', () => {
  const input = '2024-01-15'
  const stored = dataService.addTransaction({
    description: 'Test',
    amount: -50,
    date: input,
    accountId: 1
  })
  const retrieved = dataService.getTransaction(stored.id)

  expect(retrieved.date).toBe(input)
  expect(testDateConsistency(input, retrieved.date)).toBe(true)
})
```

### Mock Dates Properly (v4)

```typescript
// ✅ CORRECT: Mock with date strings
beforeEach(() => {
  jest.useFakeTimers()
  // Mock getCurrentDate to return consistent test date
  jest.mock('@/lib/utils/date-utils', () => ({
    ...jest.requireActual('@/lib/utils/date-utils'),
    getCurrentDate: () => '2024-01-15'
  }))
})
```

## Migration Strategy for v4

### Phase 1: Port Date Utilities from v3

1. Copy `date-utils.ts` and `v3-date-utils.ts` from v3 to v4
2. Update imports to use v4 path structure
3. Test utilities work correctly in v4 environment

### Phase 2: Replace Date Constructors in v4

```typescript
// Before (v4 current)
const date = new Date().toISOString().split('T')[0]
const displayDate = new Date(dateString).toLocaleDateString()

// After (v4 with utilities)
const date = getCurrentDate()
const displayDate = formatDateForDisplay(dateString)
```

### Phase 3: Update v4 Components

1. Update `TransactionModal.tsx` to use `getCurrentDate()`
2. Update `TransactionsTable.tsx` to use `formatDateForDisplay()`
3. Update `AccountList.tsx` to use proper date handling
4. Test all date inputs and displays work correctly

## Troubleshooting

### Common Issues and Solutions (v4)

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Transactions appear on wrong dates | User adds 9/6 but sees 9/5 | Use `getCurrentDate()` and `formatDateForDisplay()` |
| Date inputs show wrong default | Form shows yesterday's date | Replace `new Date().toISOString().split('T')[0]` with `getCurrentDate()` |
| Date display is inconsistent | Same date shows differently in different places | Use `formatDateForDisplay()` everywhere |
| Tests fail with date issues | Date-dependent tests are flaky | Use consistent date strings in tests |

### Debugging Date Issues (v4)

```typescript
// Debug date consistency issues
const inputDate = '2024-01-15'
const storedTransaction = dataService.addTransaction({
  description: 'Debug test',
  amount: -50,
  date: inputDate,
  accountId: 1
})
const retrievedTransaction = dataService.getTransaction(storedTransaction.id)

console.log({
  inputDate,
  storedDate: storedTransaction.date,
  retrievedDate: retrievedTransaction.date,
  isConsistent: inputDate === retrievedTransaction.date,
  displayDate: formatDateForDisplay(retrievedTransaction.date)
})
```

## Conclusion

Proper date handling is critical for financial applications. FinTrack v4 uses string-based date handling (YYYY-MM-DD format) to ensure data consistency. Always use the provided date utilities instead of raw `new Date()` calls to ensure consistent behavior across all environments and timezones.

**Key Takeaway**: When you add a transaction for 9/6/2025, you should see a transaction for 9/6/2025, not 9/5/2025. This is achieved by using consistent date string handling throughout the application.

For questions or issues with date handling, refer to this guide or the date utility documentation in `src/lib/utils/date-utils.ts`.
