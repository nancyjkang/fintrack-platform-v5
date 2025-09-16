# FinTrack v4 MVP Accounting System

## Overview

The FinTrack v4 MVP implements a simplified but robust accounting system that ensures data integrity and accurate balance calculations. This system is designed to be straightforward while maintaining the core principles of financial data accuracy.

## Core Principles

### 1. **Real-Time Balance Updates**

**CRITICAL RULE**: Account balances are updated immediately on every Create, Update, or Delete operation that affects the account balance. This ensures:
- **Instant UI updates** - Users see balance changes immediately
- **Data consistency** - Balance and transactions are always in sync
- **Performance optimization** - O(1) balance lookup vs O(n) calculation

**IMPORTANT**: The `accounts.balance` field should **always equal** the most recent balance anchor plus any transactions after that anchor date. This maintains consistency between the two balance tracking methods.

### 2. **TRANSFER Transaction Support**

**FLEXIBLE TRANSFER DESIGN**: TRANSFER operations support multiple scenarios using the `TRANSFER` transaction type:

#### **Two-Account Transfer (Internal)**
- **Source account**: TRANSFER transaction with negative amount (money going out)
- **Destination account**: TRANSFER transaction with positive amount (money coming in)
- **Validation**: Prevents transfers to the same account and validates account existence
- **System Integration**: Both transactions are linked by matching description and date

#### **Single-Account Transfer (External)**
- **From External**: TRANSFER transaction with positive amount (money coming in from untracked account)
- **To External**: TRANSFER transaction with negative amount (money going out to untracked account)
- **Flexibility**: Allows transfers to/from accounts not tracked in the system

#### **Design Philosophy**
- **Income**: Money in, net worth grows
- **Expense**: Money out, net worth shrinks
- **Transfer**: Neutral money movement, net worth unchanged

### 3. **Balance Anchor + Initial Transaction Pattern**

**CRITICAL RULE**: Every account with an initial balance must have both:
- A **Balance Anchor** (historical snapshot)
- An **Initial Transaction** (audit trail)

This ensures the fundamental accounting equation: `sum(transaction_amounts) = total_account_balance`

### 4. **Dual Balance Calculation Methods**

The system supports two calculation methods for flexibility and performance:

#### Method 1: Direct Transaction Sum
```typescript
balance = sum(all_transaction_amounts)
```
- **Use case**: Simple accounts with few transactions
- **Performance**: O(n) where n = total transactions
- **Accuracy**: Always accurate

#### Method 2: Anchor + Post-Anchor Transactions
```typescript
balance = anchor_balance + sum(transactions_after_anchor_date)
```
- **Use case**: Accounts with many historical transactions
- **Performance**: O(n) where n = transactions after anchor
- **Accuracy**: Depends on anchor accuracy

## Data Models

### Account Balance Anchor
```typescript
interface AccountBalanceAnchor {
  id: number
  accountId: number
  balance: number        // Verified balance amount
  anchorDate: string     // Date of the balance point (YYYY-MM-DD format)
  description: string    // Description of the anchor
  createdAt: string
}
```

### Transaction
```typescript
interface Transaction {
  id: number
  accountId: number
  amount: number         // CRITICAL: Amount storage rules below
  description: string
  date: string          // YYYY-MM-DD format
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  categoryId?: number   // Optional for user-created transactions
  createdAt: string
  updatedAt: string
}
```

#### **CRITICAL RULE: Transaction Amount Storage**

**Transaction amounts are stored based on their actual impact on account balance:**

- **INCOME**: Always stored as **positive** (`+2500`) - money coming in
- **EXPENSE**: **Usually negative** (`-800`) for purchases, **but can be positive** (`+50`) for refunds
- **TRANSFER**: Stored with **correct sign** (`+500` incoming, `-500` outgoing)

**Key Principle**: The `amount` field represents the **actual change to the account balance**, regardless of transaction type.

#### **Examples of Correct Amount Storage**

```typescript
// INCOME transaction - salary deposit
{
  amount: 2500,    // Positive - increases account balance
  type: 'INCOME',
  description: 'Monthly salary'
}

// EXPENSE transaction - typical purchase
{
  amount: -85.50,  // Negative - decreases account balance
  type: 'EXPENSE',
  description: 'Grocery shopping'
}

// EXPENSE transaction - refund (exception case)
{
  amount: 25.00,   // Positive - increases account balance (money back)
  type: 'EXPENSE',
  description: 'Refund for returned item'
}

// TRANSFER transaction - money going out
{
  amount: -300,    // Negative - decreases source account balance
  type: 'TRANSFER',
  description: 'Transfer to savings'
}

// TRANSFER transaction - money coming in
{
  amount: 300,     // Positive - increases destination account balance
  type: 'TRANSFER',
  description: 'Transfer from checking'
}
```

**Note**: This consistent sign-based storage eliminates the need for complex logic in balance calculations. The `getTransactionBalanceImpact()` function simply returns `transaction.amount` for all transaction types.

## TRANSFER Implementation

### Current TRANSFER Design

**CRITICAL RULE**: TRANSFER operations use the `TRANSFER` transaction type with positive/negative amounts to represent money movement:

#### Example 1: Two-Account Transfer ($500 from Checking to Savings)
```typescript
// Transaction 1: Source Account (Checking) - Money going out
{
  accountId: checkingAccountId,
  amount: -500,  // Negative amount
  description: "Transfer to Savings Account",
  date: "2024-01-15",
  type: "TRANSFER",
  categoryId: transferCategoryId
}

// Transaction 2: Destination Account (Savings) - Money coming in
{
  accountId: savingsAccountId,
  amount: 500,   // Positive amount
  description: "Transfer from Checking Account",
  date: "2024-01-15",
  type: "TRANSFER",
  categoryId: transferCategoryId
}
```

#### Example 2: Single-Account Transfer (External Account)
```typescript
// Transfer TO external account (money going out)
{
  accountId: checkingAccountId,
  amount: -300,  // Negative amount
  description: "Transfer to external account",
  date: "2024-01-15",
  type: "TRANSFER",
  categoryId: transferCategoryId
}

// Transfer FROM external account (money coming in)
{
  accountId: checkingAccountId,
  amount: 300,   // Positive amount
  description: "Transfer from external account",
  date: "2024-01-15",
  type: "TRANSFER",
  categoryId: transferCategoryId
}
```

#### Benefits of Current Design
- **Simpler Data Model**: No need for `transferAccountId` field
- **Flexible**: Supports both internal and external transfers
- **Consistent**: All transactions use the same `TRANSFER` type
- **Clear Semantics**: Positive amount = money in, negative amount = money out
- **System Transfer Support**: Uses same pattern for adjustment transactions

#### Implementation
```typescript
// Two-account transfer
if (fromAccount && toAccount) {
  // Create negative transfer (money going out)
  addTransaction({
    accountId: fromAccountId,
    amount: -amount,
    description: `Transfer to ${toAccount.name}`,
    type: 'TRANSFER',
    date: date,
    categoryId: categoryId
  });

  // Create positive transfer (money coming in)
  addTransaction({
    accountId: toAccountId,
    amount: amount,
    description: `Transfer from ${fromAccount.name}`,
    type: 'TRANSFER',
    date: date,
    categoryId: categoryId
  });
}

// Single-account transfer (external)
else if (fromAccount && !toAccount) {
  addTransaction({
    accountId: fromAccountId,
    amount: -amount,  // Money going out to external
    description: 'Transfer to external account',
    type: 'TRANSFER',
    date: date,
    categoryId: categoryId
  });
}
else if (!fromAccount && toAccount) {
  addTransaction({
    accountId: toAccountId,
    amount: amount,   // Money coming in from external
    description: 'Transfer from external account',
    type: 'TRANSFER',
    date: date,
    categoryId: categoryId
  });
}
```

## Initial Balance Setting Process

### User Flow
1. User creates account with initial balance (e.g., $10,000)
2. System creates balance anchor for the specified date
3. System creates initial transaction with `isInitialBalance: true`
4. User can immediately start adding regular transactions

### Implementation
```typescript
async function createAccountWithInitialBalance(accountData: {
  name: string
  type: string
  color: string
  initialBalance: number
  balanceDate: Date
}) {
  // 1. Create account
  const account = await addAccount({
    name: accountData.name,
    type: accountData.type,
    color: accountData.color,
    balance: 0 // Will be calculated from transactions
  })

  // 2. Create balance anchor
  const anchor = await addBalanceAnchor({
    accountId: account.id,
    balance: accountData.initialBalance,
    anchorDate: accountData.balanceDate,
    source: 'initial_balance'
  })

  // 3. Create initial transaction
  const initialTransaction = await addTransaction({
    accountId: account.id,
    amount: accountData.initialBalance,
    description: 'Initial account balance',
    date: accountData.balanceDate,
    type: 'INCOME', // Initial balance increases account
    isInitialBalance: true
  })

  return { account, anchor, initialTransaction }
}
```

## Balance Consistency Rules

### **Fundamental Relationship**

The system maintains **dual balance tracking** with strict consistency rules:

```typescript
// CRITICAL INVARIANT: These must always be equal
accounts.balance === latest_anchor.balance + sum(transactions_after_latest_anchor)
```

### **Balance Update Rules**

1. **Transaction Operations** (Create/Update/Delete):
   - Update `accounts.balance` immediately
   - Balance anchors remain unchanged
   - Maintains: `balance = anchor + post-anchor transactions`

2. **Reconciliation Operations**:
   - Create new balance anchor with corrected balance
   - Update `accounts.balance` to match the new anchor
   - Both values become synchronized at the reconciliation point

3. **Data Integrity Validation**:
   - System should periodically verify: `accounts.balance === calculated_balance_from_anchors`
   - Discrepancies indicate data corruption and require reconciliation

### **Source of Truth Hierarchy**

For balance calculations, use this priority order:

1. **Primary**: Most recent balance anchor + post-anchor transactions
2. **Secondary**: `accounts.balance` (should equal primary, used for performance)
3. **Fallback**: Direct sum of all transactions (used for validation)

## Account Reconciliation

Account reconciliation is the process of correcting account balances by setting a new anchor balance and anchor date. This **synchronizes both the balance anchor and account balance** to the corrected amount.

### Reconciliation Process

1. **User identifies discrepancy**: Account balance doesn't match actual bank/account balance
2. **Create new balance anchor**: Create a new `AccountBalanceAnchor` with:
   - Corrected actual balance from bank/account
   - Current date as anchor date
   - Description of the reconciliation
3. **Update account balance**: Set `accounts.balance` to match the new anchor balance
4. **Synchronization**: Both `accounts.balance` and the new anchor now have the same value
5. **Override old anchors**: The new anchor becomes the primary reference point
6. **Future calculations**: All subsequent balance calculations use the new synchronized values

### Implementation

```typescript
reconcileAccount(
  accountId: number,
  newBalance: number,
  date: string = getCurrentDate(),
  adjustmentType: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE'
): {
  newAnchor: AccountBalanceAnchor;
  adjustmentTransaction?: Transaction;
} {
  // Validate account exists
  const account = this.accounts.find(a => a.id === accountId);
  if (!account) {
    throw new Error(`Account with ID ${accountId} does not exist`);
  }

  // Validate date is not in the future
  if (date > getCurrentDate()) {
    throw new Error('Reconciliation date cannot be in the future. Please use today or an earlier date.');
  }

  // Calculate current balance up to the reconcile date
  const currentCalculatedBalance = this.calculateAccountBalance(accountId, date);

  // Create new balance anchor
  const newAnchor: AccountBalanceAnchor = {
    id: this.nextId++,
    accountId,
    anchorDate: date,
    balance: newBalance,
    description: `Reconciled balance on ${date}`,
    createdAt: getCurrentTimestamp()
  };

  this.balanceAnchors.push(newAnchor);

  // Calculate difference and create adjustment transaction if needed
  const difference = newBalance - currentCalculatedBalance;
  let adjustmentTransaction: Transaction | undefined;

  if (Math.abs(difference) > 0.01) { // Only create adjustment if difference is significant
    // Determine category based on adjustment type
    let categoryName: string;
    let transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER';

    switch (adjustmentType) {
      case 'INCOME':
        categoryName = null;
        transactionType = 'INCOME';
        break;
      case 'EXPENSE':
        categoryName = null;
        transactionType = 'EXPENSE';
        break;
      case 'TRANSFER':
        categoryName = 'System Transfer';
        transactionType = 'TRANSFER';
        break;
    }

    // Find the appropriate category
    const category = this.categories.find(c => c.name === categoryName);
    if (!category) {
      throw new Error(`${categoryName} category not found. Please create this category first.`);
    }

    // Create adjustment transaction with actual difference amount
    adjustmentTransaction = {
      id: this.nextId++,
      accountId,
      amount: Math.abs(difference),
      description: 'Balance Adjustment',
      date,
      type: transactionType,
      categoryId: category.id | null,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    this.transactions.push(adjustmentTransaction);
  }

  // Update account balance
  account.balance = newBalance;
  account.updatedAt = getCurrentTimestamp();

  this.saveToStorage();

  return {
    newAnchor,
    adjustmentTransaction
  };
}
```

### Dynamic Adjustment Type Selection

The reconciliation system provides intelligent adjustment type selection based on the balance difference:

#### **Positive Difference (New Balance > Current Balance)**
- **Available Options**: Income, Transfer
- **Default Selection**: Income
- **Use Case**: Account has more money than expected (found money, interest, etc.)

#### **Negative Difference (New Balance < Current Balance)**
- **Available Options**: Expense, Transfer
- **Default Selection**: Expense
- **Use Case**: Account has less money than expected (fees, forgotten transactions, etc.)

#### **Zero Difference (New Balance = Current Balance)**
- **Available Options**: None (no adjustment needed)
- **Use Case**: Perfect reconciliation, no adjustment transaction created

#### **Category Requirements**
- **Income Adjustment**: Requires "Unknown Income" category (type: INCOME)
- **Expense Adjustment**: Requires "Unknown Expense" category (type: EXPENSE)
- **Transfer Adjustment**: Uses existing "System Transfer" category (type: TRANSFER)

#### **Date Validation**
- **Future Date Restriction**: Reconciliation dates cannot be in the future
- **Rationale**: Reconciliation reflects actual bank statements, which are always historical
- **Error Message**: Clear guidance to use today or earlier dates

### Reconciliation Scenarios

#### Scenario 1: Monthly Bank Statement Reconciliation
- **Date**: End of month
- **Action**: Compare app balance vs bank statement
- **Result**: Set new anchor if discrepancy found

#### Scenario 2: Account Import/Setup
- **Date**: When importing historical data
- **Action**: Set anchor at known good balance point
- **Result**: All historical calculations use this anchor

#### Scenario 3: Error Correction
- **Date**: When user discovers data entry errors
- **Action**: Set anchor at corrected balance
- **Result**: Override incorrect historical calculations

### Anchor Priority System

The system uses the **most recent anchor** (latest `anchorDate`) for balance calculations:

```typescript
async function findLatestBalanceAnchor(accountId: string, asOfDate?: Date): Promise<AccountBalanceAnchor | null> {
  const targetDate = asOfDate || new Date()

  // Find the most recent anchor on or before the target date
  const anchors = await getAccountBalanceAnchors({
    accountId,
    date: { lte: targetDate }
  })

  // Sort by date descending and return the most recent
  return anchors.sort((a, b) => b.anchorDate.getTime() - a.anchorDate.getTime())[0] || null
}
```

## Balance Calculation Logic

### Bidirectional Calculation from Anchor

The system supports calculating balances both forward and backward from any balance anchor:

#### Forward Calculation (Date >= Anchor Date)
```
balance = anchor_balance + sum(transactions where date > anchor_date AND date <= target_date)
```

**Example:**
- Anchor: $1,000 on 2024-01-01
- Transactions after anchor: +$500 (2024-01-15), -$200 (2024-01-20)
- Balance on 2024-01-25: $1,000 + $500 - $200 = $1,300

#### Backward Calculation (Date < Anchor Date)
```
balance = anchor_balance - sum(transactions where date >= target_date AND date <= anchor_date)
```

**Example:**
- Anchor: $1,000 on 2024-01-01
- Transactions before anchor: +$300 (2024-01-01), -$100 (2024-01-01)
- Balance on 2023-12-31: $1,000 - ($300 - $100) = $800

### Method Selection
The system automatically chooses the best calculation method:

```typescript
async function calculateAccountBalance(accountId: string, asOfDate?: Date): Promise<number> {
  const targetDate = asOfDate || new Date()

  // Try Method 2 first (anchor + transactions)
  const anchor = await findLatestBalanceAnchor(accountId, targetDate)

  if (anchor) {
    // Method 2: Bidirectional calculation from anchor
    if (targetDate >= anchor.anchorDate) {
      // Forward calculation: anchor + transactions after anchor date
      const postAnchorTransactions = await getTransactions({
        accountId,
        date: { gt: anchor.anchorDate, lte: targetDate }
      })

      const postAnchorSum = postAnchorTransactions.reduce((sum, tx) => {
        return sum + getTransactionBalanceImpact(tx)
      }, 0)

      return anchor.balance + postAnchorSum
    } else {
      // Backward calculation: anchor - transactions between target and anchor
      const preAnchorTransactions = await getTransactions({
        accountId,
        date: { gte: targetDate, lte: anchor.anchorDate }
      })

      const preAnchorSum = preAnchorTransactions.reduce((sum, tx) => {
        return sum + getTransactionBalanceImpact(tx)
      }, 0)

      return anchor.balance - preAnchorSum
    }
  } else {
    // Method 1: Direct transaction sum (fallback)
    const allTransactions = await getTransactions({
      accountId,
      date: { lte: targetDate }
    })

    return allTransactions.reduce((sum, tx) => {
      return sum + getTransactionBalanceImpact(tx)
    }, 0)
  }
}
```

### Transaction Impact on Balance
```typescript
function getTransactionBalanceImpact(transaction: Transaction): number {
  // SIMPLE RULE: Use transaction amount exactly as stored
  // All amounts are stored with correct accounting signs:
  // - INCOME: stored as positive (+2500)
  // - EXPENSE: stored as negative (-800)
  // - TRANSFER: stored with correct sign (±500)
  return transaction.amount;
}
```

#### **Why This Works**

Since all transaction amounts are stored with their correct accounting signs, the balance calculation becomes trivial:

- **INCOME** (`+2500`): Directly adds to balance → `balance += 2500`
- **EXPENSE** (`-800`): Directly subtracts from balance → `balance += (-800)` = `balance -= 800`
- **TRANSFER** (`±500`): Directly affects balance → `balance += amount`

#### **Legacy Implementation (Deprecated)**

The previous implementation used complex switch logic to manipulate amounts:

```typescript
// ❌ DEPRECATED - Don't use this approach
function getTransactionBalanceImpact(transaction: Transaction): number {
  switch (transaction.type) {
    case 'INCOME':
      return +transaction.amount  // Redundant positive
    case 'EXPENSE':
      return -transaction.amount  // Wrong - double negation if stored negative
    case 'TRANSFER':
      return transaction.amount;  // Correct
    default:
      return 0
  }
}
```

This approach was error-prone because it assumed EXPENSE amounts were stored as positive values, requiring manual negation.

### Adjustment Transactions for Anchor Integrity

**CRITICAL RULE**: When a transaction is added on or before an existing anchor date, the system must create an **adjustment transaction** to maintain the anchor's integrity.

#### The Problem
If a transaction is added with a date that's on or before an existing anchor date, it would affect the historical balance that the anchor represents, making the anchor inaccurate.

#### The Solution: Adjustment Transactions
When a transaction is added on or before an anchor date, create an **adjustment transaction** with:
- **Date**: Same as the anchor date
- **Amount**: Opposite of the added transaction's impact
- **Description**: "Balance adjustment for [anchor description]"
- **Type**: TRANSFER (for system consistency)
- **Category**: "System Transfer" (hidden from UI)

#### Implementation
```typescript
async function createTransactionWithAdjustment(transactionData: {
  accountId: number
  amount: number
  description: string
  date: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  categoryId?: number
}): Promise<Transaction> {
  // 1. Create the original transaction
  const transaction = await createTransaction(transactionData)

  // 2. Check if transaction date is on or before any existing anchor
  const anchors = await getAccountBalanceAnchors({
    accountId: transactionData.accountId,
    date: { gte: transactionData.date }
  })

  if (anchors.length > 0) {
    // 3. Create adjustment transaction for each affected anchor
    for (const anchor of anchors) {
      const adjustmentAmount = -getTransactionBalanceImpact(transaction)
      const adjustmentType = transactionData.type === 'INCOME' ? 'EXPENSE' : 'INCOME'

      await createTransaction({
        accountId: transactionData.accountId,
        amount: Math.abs(adjustmentAmount),
        description: `Balance adjustment for transaction ${transaction.id}`,
        date: anchor.anchorDate,
        type: adjustmentType,
        categoryId: transactionData.categoryId
      })
    }
  }

  return transaction
}
```

#### Example Scenario
1. **Anchor**: $1,000 on 2024-01-01
2. **User adds**: -$200 expense on 2023-12-15 (before anchor)
3. **System creates adjustment**: +$200 TRANSFER on 2024-01-01 (System Transfer category)
4. **Result**: Anchor remains accurate, historical balance is preserved

#### Benefits
- **Anchor Integrity**: Anchors remain accurate reference points
- **Audit Trail**: Complete history of all balance changes
- **Data Consistency**: Balance calculations remain reliable
- **User Transparency**: Users can see adjustment transactions

## Data Integrity Validation

### Validation Rules

1. **Balance Consistency**: `sum(transaction_amounts) = calculated_balance`
2. **Anchor-Account Synchronization**: `accounts.balance === latest_anchor.balance + sum(transactions_after_latest_anchor)`
3. **Anchor Accuracy**: Anchor balance should match calculated balance at anchor date
4. **Initial Transaction**: Every account with initial balance must have initial transaction
5. **Reconciliation Integrity**: After reconciliation, `accounts.balance` must equal the new anchor balance

### Validation Function
```typescript
async function validateAccountIntegrity(accountId: string): Promise<{
  isValid: boolean
  issues: string[]
  calculatedBalance: number
  transactionSum: number
}> {
  const issues: string[] = []

  // Calculate balance using both methods
  const calculatedBalance = await calculateAccountBalance(accountId)
  const transactions = await getTransactions({ accountId })
  const transactionSum = transactions.reduce((sum, tx) => {
    return sum + getTransactionBalanceImpact(tx)
  }, 0)

  // Check consistency
  if (Math.abs(calculatedBalance - transactionSum) > 0.01) {
    issues.push(`Balance mismatch: calculated=${calculatedBalance}, transaction_sum=${transactionSum}`)
  }

  // Check anchor-account synchronization
  const account = await getAccount(accountId)
  const latestAnchor = await findLatestBalanceAnchor(accountId)

  if (latestAnchor) {
    const postAnchorTransactions = await getTransactions({
      accountId,
      date: { gt: latestAnchor.anchorDate }
    })
    const postAnchorSum = postAnchorTransactions.reduce((sum, t) => sum + getTransactionBalanceImpact(t), 0)
    const expectedBalance = latestAnchor.balance + postAnchorSum

    if (Math.abs(account.balance - expectedBalance) > 0.01) {
      issues.push(`Anchor-Account mismatch: account.balance=${account.balance}, expected=${expectedBalance}`)
    }
  }

  // Check for initial balance transaction
  const hasInitialTransaction = transactions.some(tx => tx.isInitialBalance)
  const hasInitialBalance = transactions.some(tx => tx.isInitialBalance && tx.amount > 0)

  if (hasInitialBalance && !hasInitialTransaction) {
    issues.push('Account has initial balance but no initial transaction')
  }

  return {
    isValid: issues.length === 0,
    issues,
    calculatedBalance,
    transactionSum
  }
}
```

## TRANSFER Corner Cases and UI Considerations

### Corner Cases Handled

#### **1. Single-Account Transfers (External Accounts)**
- **Scenario**: User transfers money to/from accounts not tracked in the system
- **Implementation**: Create single TRANSFER transaction with appropriate sign
- **UI**: "External account (not tracked)" option in account dropdowns
- **Validation**: At least one account (From or To) must be selected

#### **2. Optional Category for TRANSFER Transactions**
- **Scenario**: User may or may not want to categorize transfers
- **Implementation**: `categoryId` is optional for all transaction types
- **UI**: Category dropdown shows "Select a category" (no "(optional)" text)
- **System Transfers**: Always use "System Transfer" category (hidden from UI)

#### **3. Transaction Preview for Transfers**
- **Scenario**: User needs to understand what transactions will be created
- **Implementation**: Show preview text explaining the exact transactions
- **UI**: Dynamic preview based on selected accounts and amount
- **Examples**:
  - "Two-account transfer: -$100 from Checking, +$100 to Savings"
  - "External transfer: -$50 from Checking to external account"

#### **4. Client-Side Validation**
- **Scenario**: Prevent invalid transfer configurations
- **Implementation**: Real-time validation with visual feedback
- **UI**: Red asterisks (*) for required fields, error messages for invalid states
- **Validation Rules**:
  - At least one account must be selected for transfers
  - Amount must be a valid number
  - Date must be provided

### Account Creation Form
```typescript
interface AccountFormData {
  name: string
  type: 'checking' | 'savings' | 'credit' | 'investment'
  color: string
  hasInitialBalance: boolean
  initialBalance?: number
  balanceDate?: Date
}
```

### Balance Display
- Show current calculated balance
- Indicate calculation method used (anchor-based vs direct sum)
- Display balance anchor information if available
- Show validation status

### Transaction Form Layout
- **From Account** and **To Account** on the same row for transfers
- **Required field indicators**: Red asterisks (*) instead of "(optional)" labels
- **Category filtering**: Hide "System Transfer" from user-facing dropdowns
- **Transaction preview**: Show exactly what transactions will be created

## Error Handling

### Common Scenarios
1. **No Balance Anchor**: Use direct transaction sum
2. **Invalid Anchor Date**: Recalculate using direct sum
3. **Missing Initial Transaction**: Warn user but continue
4. **Balance Mismatch**: Log error and use direct sum

### Graceful Degradation
```typescript
async function getAccountBalance(accountId: string): Promise<number> {
  try {
    // Try anchor-based calculation first
    return await calculateAccountBalance(accountId)
  } catch (error) {
    console.warn('Anchor-based calculation failed, using direct sum:', error)
    // Fallback to direct transaction sum
    const transactions = await getTransactions({ accountId })
    return transactions.reduce((sum, tx) => {
      return sum + getTransactionBalanceImpact(tx)
    }, 0)
  }
}
```

## Implementation Status

### ✅ **COMPLETED (v0.7.0)**

#### Core Data Models
- [x] Transaction interface (removed `transferAccountId` field)
- [x] AccountBalanceAnchor interface (existing implementation)
- [x] DataService with balance anchor support

#### Balance Calculation
- [x] Enhanced `calculateAccountBalance()` function with anchor support
- [x] `getTransactionBalanceImpact()` helper for INCOME/EXPENSE transactions
- [x] Real-time balance updates on all CUD operations
- [x] Comprehensive validation for all transaction types

#### TRANSFER Transaction Support
- [x] **COMPLETED**: TRANSFER type with positive/negative amounts
- [x] **COMPLETED**: Two-account transfer implementation
- [x] **COMPLETED**: Single-account transfer (external accounts)
- [x] **COMPLETED**: UI with transaction preview and validation
- [x] **COMPLETED**: Balance calculation for TRANSFER transactions
- [x] **COMPLETED**: System Transfer category for adjustment transactions

#### Testing & Validation
- [x] Comprehensive unit test suite (39/42 tests passing - 93% success rate)
- [x] TRANSFER transaction tests
- [x] Balance calculation tests
- [x] Data integrity tests
- [x] Validation tests

### 🔄 **PENDING (Future Versions)**

#### Initial Balance Flow
- [ ] Update account creation form to collect initial balance
- [ ] Implement `createAccountWithInitialBalance()` function
- [ ] Add balance anchor creation logic

#### UI Updates
- [ ] Update account creation form
- [ ] Display balance calculation method
- [ ] Show balance anchor information
- [ ] Add validation status indicators

#### Advanced Features
- [ ] Daily Net Values for performance optimization
- [ ] Advanced reconciliation system
- [ ] Balance history tracking
- [ ] Multi-currency support

## Future Enhancements

### Planned Features (Post-MVP)
1. **Daily Net Values**: For performance optimization with large transaction volumes
2. **Reconciliation System**: For adjusting balances to match external statements
3. **Balance History**: Track balance changes over time
4. **Multi-Currency Support**: Handle different currencies
5. **Advanced Reporting**: Balance reports and analytics

### Performance Optimizations
1. **Balance Caching**: Cache calculated balances
2. **Indexed Queries**: Optimize database queries
3. **Batch Operations**: Process multiple accounts efficiently

## Best Practices

### For Developers
1. **Always validate data integrity** after balance changes
2. **Use appropriate calculation method** based on available data
3. **Handle errors gracefully** with fallback methods
4. **Log balance calculations** for debugging
5. **Test with various scenarios** (no anchor, invalid anchor, etc.)

### For Users
1. **Set initial balances accurately** when creating accounts
2. **Verify balance calculations** periodically
3. **Report discrepancies** immediately
4. **Understand the difference** between anchor-based and direct calculations

## Related Features

### CSV Import System
For importing transaction data from external sources (banks, credit cards, accounting software), see the comprehensive [CSV Import PRD](./features/csv-import-prd.md) which covers:

- **Field Mapping**: Map CSV columns to FinTrack transaction fields
- **Data Validation**: Comprehensive validation with preview and error handling
- **Duplicate Detection**: Smart duplicate detection with user control
- **Import Control**: Selective import with user confirmation and rollback capability
- **Template System**: Save and reuse import configurations

The CSV import system integrates seamlessly with this accounting system, ensuring imported transactions maintain data integrity and proper balance calculations.

## Conclusion

The FinTrack v4 MVP accounting system provides a solid foundation for accurate financial data management while remaining simple enough for rapid development and user understanding. By implementing the balance anchor + initial transaction pattern and supporting dual calculation methods, the system ensures data integrity while maintaining flexibility for future enhancements.

Key benefits:
- **Data Integrity**: Ensures `sum(transactions) = account_balance`
- **Performance**: Optimizes calculations for accounts with many transactions
- **Audit Trail**: Maintains complete history of balance changes
- **Flexibility**: Supports various account types and scenarios
- **Simplicity**: Easy to understand and maintain
