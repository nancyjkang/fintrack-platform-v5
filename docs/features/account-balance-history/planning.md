# Feature: Account Balance History

**Created**: 2025-09-16
**Estimated Start**: 2025-09-16
**Priority**: High (Priority 1)
**Status**: 🔧 **IN PROGRESS** - Backend Needs Update for Individual Transaction Display

---

## 🎯 **Goal**

Create a comprehensive Account Balance History feature that allows users to visualize and analyze their account balance changes over time, with interactive charts, detailed tables, and summary statistics. The implementation must strictly adhere to the **MVP Accounting System** principles for accurate balance calculations.

## ✅ **Backend Implementation Complete** (September 16, 2025)

### **🔧 Technical Foundation Built:**
- **AccountBalanceHistoryService**: Full MVP accounting system compliance
- **TypeScript Interfaces**: Complete type definitions (`BalanceHistoryData`, `BalanceSummary`, etc.)
- **API Endpoints**: `/api/accounts/[id]/balance-history` and `/api/accounts/[id]/balance-summary`
- **Comprehensive Testing**: 19 unit tests covering accounting accuracy, edge cases, and error handling
- **Data Integrity**: Maintains `sum(transactions) = account_balance` principle
- **Security**: Proper tenant isolation and authentication

### **🧪 Testing Results:**
```
✓ 19/19 tests passing
✓ MVP accounting compliance verified
✓ Transaction impact calculations correct (INCOME: +amount, EXPENSE: -amount, TRANSFER: as-is)
✓ Data integrity maintained
✓ Error handling comprehensive
✓ No lint errors
```

### **🎯 Next Phase:** Update backend to return individual transactions for table display

## 👥 **User Impact**

- **Financial Insight**: Users can track how their account balances change over time
- **Trend Analysis**: Visual charts help identify spending patterns and financial trends
- **Historical Context**: Users can see balance at any point in time with accurate calculations
- **Account Comparison**: Compare balance trends across different accounts
- **Data Validation**: Verify account balance accuracy through historical tracking

## 📊 **Scope**

### **Must Have:**
- [x] **Account Selection Dropdown** - Filter by specific account
- [x] **Date Range Filters** - Start and end date selection
- [x] **Summary Cards** - Starting balance, ending balance, net change, transaction count
- [x] **Interactive Chart** - Combined line (balance) and bar (daily changes) chart using Recharts
- [x] **Balance History Table** - Detailed daily balance data with pagination
- [x] **MVP Accounting Compliance** - Use proper balance calculation methods from accounting system
- [x] **Real-time Updates** - Reflect balance changes immediately when transactions are modified
- [x] **Loading States** - Proper loading indicators during data fetching
- [x] **Empty States** - Helpful messages when no data is available

### **Should Have:**
- [ ] **Export Functionality** - Export balance history to CSV/PDF
- [ ] **Multiple Account Comparison** - Side-by-side balance comparison charts
- [ ] **Balance Anchor Indicators** - Show balance anchors on chart with tooltips
- [ ] **Calculation Method Display** - Show whether using anchor-based or direct sum calculation
- [ ] **Performance Optimization** - Efficient data loading for large date ranges

### **Nice to Have:**
- [ ] **Trend Predictions** - Simple linear trend projection
- [ ] **Balance Alerts** - Notifications for significant balance changes
- [ ] **Custom Date Presets** - Quick filters (Last 30 days, Last 3 months, etc.)
- [ ] **Mobile Responsive Charts** - Optimized chart display for mobile devices

### **Out of Scope:**
- Multi-currency balance history (future enhancement)
- Advanced statistical analysis (correlation, regression)
- Balance forecasting with complex algorithms
- Integration with external financial data sources

---

## 🔗 **Dependencies**

### **Hard Dependencies:**
- **Account Management System** ✅ (Completed)
- **Transaction Management System** ✅ (Completed)
- **MVP Accounting System** ✅ (Documented and implemented)
- **Date Utilities** ✅ (Available in v5)

### **Soft Dependencies:**
- **Recharts Library** (for chart visualization)
- **Export Libraries** (for CSV/PDF export - should have feature)

---

## ⏱️ **Estimate**

- **Complexity**: Medium-High
- **Time Estimate**: 2 days
- **Risk Level**: Medium (Chart integration and accounting system compliance)

### **Breakdown:**
- **Day 1**: Backend service methods, data models, basic UI structure (6 hours)
- **Day 2**: Chart integration, styling, testing, documentation (6 hours)

---

## ✅ **Success Criteria**

### **Functional Requirements:**
- [ ] Users can select any account and view its balance history
- [ ] Date range filtering works correctly (start date, end date, or both)
- [ ] Summary cards display accurate starting/ending balances and net change
- [ ] Interactive chart shows balance trend line and daily change bars
- [ ] Balance history table displays all data points with proper formatting
- [ ] Balance calculations strictly follow MVP Accounting System methods
- [ ] Real-time updates when transactions are added/modified/deleted
- [ ] Proper error handling for invalid date ranges or missing data

### **Technical Requirements:**
- [ ] **MVP Accounting Compliance**: Use `calculateAccountBalance()` method
- [ ] **Balance Anchor Support**: Leverage anchor-based calculations when available
- [ ] **Bidirectional Calculation**: Support both forward and backward calculations from anchors
- [ ] **Performance**: Load balance history for 1 year of data in <2 seconds
- [ ] **Data Integrity**: Balance history matches transaction-based calculations
- [ ] **Type Safety**: Full TypeScript coverage with proper interfaces

### **UI/UX Requirements:**
- [ ] **v4.1 Design Consistency**: Match the exact layout and styling from v4.1
- [ ] **Responsive Design**: Works on desktop, tablet, and mobile
- [ ] **Accessibility**: Proper ARIA labels, keyboard navigation, screen reader support
- [ ] **Loading States**: Smooth loading indicators during data fetching
- [ ] **Empty States**: Helpful messages when no data is available

---

## 🔧 **Technical Approach**

### **MVP Accounting System Integration**

#### **Balance Calculation Method Selection**
Following the MVP accounting system, the feature will use the appropriate calculation method:

```typescript
// Method 1: Direct Transaction Sum (fallback)
balance = sum(all_transaction_amounts)

// Method 2: Anchor + Post-Anchor Transactions (preferred)
balance = anchor_balance + sum(transactions_after_anchor_date)

// Method 3: Bidirectional from Anchor
// Forward: balance = anchor_balance + sum(transactions > anchor_date AND <= target_date)
// Backward: balance = anchor_balance - sum(transactions >= target_date AND <= anchor_date)
```

#### **Data Models**

```typescript
interface BalanceHistoryData {
  date: string;           // YYYY-MM-DD format
  balance: number;        // Calculated balance using MVP accounting methods
  netAmount: number;      // Daily net change (sum of transactions for that day)
  calculationMethod: 'direct' | 'anchor-forward' | 'anchor-backward';
  anchorUsed?: {
    id: number;
    date: string;
    balance: number;
  };
}

interface TransactionWithBalance {
  id: number;
  date: string;           // YYYY-MM-DD format
  description: string;    // Transaction description
  amount: number;         // Transaction amount (signed)
  balance: number;        // Account balance after this transaction
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category?: string;      // Transaction category
}

interface BalanceSummary {
  startingBalance: number;
  endingBalance: number;
  totalTransactions: number;
  netChange: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  calculationMethods: {
    direct: number;        // Count of days using direct calculation
    anchorBased: number;   // Count of days using anchor-based calculation
  };
}

interface BalanceHistoryFilters {
  accountId: number;
  startDate?: string;    // YYYY-MM-DD format
  endDate?: string;      // YYYY-MM-DD format
}
```

### **Backend Implementation**

#### **Service Methods**

```typescript
// src/lib/services/account-balance-history.service.ts
export class AccountBalanceHistoryService extends BaseService {

  /**
   * Get balance history for an account using MVP accounting methods
   */
  async getAccountBalanceHistory(
    tenantId: number,
    accountId: number,
    startDate?: string,
    endDate?: string
  ): Promise<BalanceHistoryData[]> {
    // 1. Validate account exists and belongs to tenant
    // 2. Determine date range (default to last 30 days if not specified)
    // 3. Get all transaction dates in range
    // 4. For each date, calculate balance using MVP accounting methods
    // 5. Calculate daily net amounts
    // 6. Return sorted chronologically
  }

  /**
   * Calculate running balance for each transaction in a list
   */
  async calculateRunningBalances(
    transactions: Transaction[],
    accountId: number
  ): Promise<TransactionWithBalance[]> {
    // 1. Sort transactions by date ascending for calculation
    // 2. Calculate balance after each transaction using MVP accounting methods
    // 3. Return with running balances, sorted by date descending (newest first)
  }

  /**
   * Get balance summary statistics
   */
  async getAccountBalanceSummary(
    tenantId: number,
    accountId: number,
    startDate?: string,
    endDate?: string
  ): Promise<BalanceSummary> {
    // 1. Get balance history data
    // 2. Calculate summary statistics
    // 3. Count calculation methods used
    // 4. Return comprehensive summary
  }

  /**
   * Get balance at specific date using MVP accounting methods
   */
  private async calculateBalanceAtDate(
    accountId: number,
    targetDate: string
  ): Promise<{
    balance: number;
    method: 'direct' | 'anchor-forward' | 'anchor-backward';
    anchorUsed?: AccountBalanceAnchor;
  }> {
    // Implementation follows MVP accounting system exactly
    // 1. Try to find latest balance anchor on or before target date
    // 2. If anchor found, use bidirectional calculation
    // 3. If no anchor, use direct transaction sum
    // 4. Return balance with metadata about calculation method
  }
}
```

#### **API Endpoints**

```typescript
// src/app/api/accounts/[id]/balance-history/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Query parameters: startDate, endDate
  // Returns: BalanceHistoryData[]
}

// Use existing /api/transactions endpoint with accountId filter
// GET /api/transactions?accountId={id}&startDate={startDate}&endDate={endDate}&sortBy=date&sortOrder=desc
// Already supports: accountId, startDate, endDate, sorting
// Returns: Transaction[] (with account, category, member relations)

// src/app/api/accounts/[id]/balance-summary/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Query parameters: startDate, endDate
  // Returns: BalanceSummary
}
```

### **Frontend Implementation**

#### **Page Structure (Matching v4.1 Exactly)**

```typescript
// src/app/reports/balance-history/page.tsx
export default function BalanceHistoryPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Account Balance History</h1>
          </div>
          <p className="text-gray-600">
            Track your account balance over time and analyze spending patterns
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Account Selection, Start Date, End Date */}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Starting Balance, Ending Balance, Net Change, Transactions */}
        </div>

        {/* Balance History Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <AccountBalanceChart />
        </div>

        {/* Account Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Table with Date, Description, Amount, Balance columns */}
          {/* Shows ALL individual transactions in date descending order */}
        </div>
      </div>
    </AppLayout>
  );
}
```

#### **Chart Component (Using Recharts)**

```typescript
// src/components/balance-history/AccountBalanceChart.tsx
interface AccountBalanceChartProps {
  data: BalanceHistoryData[];
  accountName?: string;
  height?: number;
}

export default function AccountBalanceChart({ data, accountName, height = 400 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tickFormatter={formatXAxisLabel} />
        <YAxis tickFormatter={formatYAxisLabel} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />

        {/* Bar chart for daily net changes */}
        <Bar
          dataKey="netAmount"
          name="Daily Change"
          fill="#3b82f6"
          opacity={0.7}
        />

        {/* Line chart for balance trend */}
        <Line
          type="monotone"
          dataKey="balance"
          name="Account Balance"
          stroke="#10b981"
          strokeWidth={3}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

### **Key Implementation Details**

#### **Account Transactions Table Approach**

The "Account Transactions" table shows **ALL individual transactions** for the selected account with:

1. **Individual Transaction Structure**:
   ```typescript
   // Each row represents one transaction
   {
     date: '2024-01-15',           // Transaction date
     description: 'Grocery Store', // Transaction description
     amount: -125.50,              // Transaction amount (signed)
     balance: 2874.50              // Account balance after this transaction
   }
   ```

2. **Transaction Ordering**:
   ```typescript
   // Sort transactions by date descending (newest first)
   transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   ```

3. **Table Columns**:
   - **Date**: Formatted as "Jan 15, 2024"
   - **Description**: Individual transaction description
   - **Amount**: Transaction amount (positive/negative with trend icons)
   - **Balance**: Account balance after this transaction

#### **MVP Accounting System Compliance**

1. **Balance Calculation Priority**:
   - First: Try anchor-based calculation (Method 2)
   - Fallback: Direct transaction sum (Method 1)
   - Support: Bidirectional calculation from anchors

2. **Transaction Impact Calculation**:
   ```typescript
   function getTransactionBalanceImpact(transaction: Transaction): number {
     switch (transaction.type) {
       case 'INCOME': return +transaction.amount;
       case 'EXPENSE': return -transaction.amount;
       case 'TRANSFER': return transaction.amount; // Already signed correctly
       default: return 0;
     }
   }
   ```

3. **Anchor Integration**:
   - Show balance anchors as special markers on the chart
   - Include anchor metadata in balance history data
   - Display calculation method used for transparency

#### **Performance Considerations**

1. **Efficient Date Range Processing**:
   - Only calculate balances for dates with transactions
   - Use database indexes on transaction dates
   - Implement pagination for large date ranges

2. **Caching Strategy**:
   - Cache balance calculations for frequently accessed dates
   - Invalidate cache when transactions are modified
   - Use React Query for client-side caching

3. **Chart Optimization**:
   - Limit chart data points for very large date ranges
   - Use data sampling for better performance
   - Implement virtual scrolling for large tables

### **File Structure**

```
src/
├── app/
│   └── reports/
│       └── balance-history/
│           └── page.tsx                    # Main balance history page
├── components/
│   └── balance-history/
│       ├── AccountBalanceChart.tsx         # Chart component
│       ├── AccountTransactionsTable.tsx   # Individual transactions table component
│       ├── BalanceHistoryFilters.tsx      # Filters component
│       └── BalanceSummaryCards.tsx        # Summary cards component
├── lib/
│   └── services/
│       └── account-balance-history.service.ts  # Backend service
└── types/
    └── balance-history.ts                  # TypeScript interfaces
```

### **Testing Strategy**

#### **Unit Tests (Primary Focus - Accounting Accuracy)**
**Location**: `src/lib/services/__tests__/account-balance-history.service.test.ts`
**Coverage Target**: >90% (accounting logic is critical)

##### **MVP Accounting System Compliance Tests**
```typescript
describe('AccountBalanceHistoryService - MVP Accounting Compliance', () => {
  describe('Balance Calculation Methods', () => {
    it('should use direct transaction sum when no balance anchors exist')
    it('should use anchor-based calculation when balance anchor is available')
    it('should perform bidirectional calculation from anchors correctly')
    it('should match existing AccountService.calculateNetWorth() logic')
    it('should maintain data integrity: sum(transactions) = account_balance')
  })

  describe('Transaction Impact Calculations', () => {
    it('should handle INCOME transactions: +transaction.amount')
    it('should handle EXPENSE transactions: -transaction.amount')
    it('should handle TRANSFER transactions: transaction.amount (already signed)')
    it('should never use Math.abs() in calculations (display only)')
    it('should preserve transaction signs throughout calculations')
  })

  describe('Balance Anchor Integration', () => {
    it('should find latest balance anchor on or before target date')
    it('should calculate forward from anchor: anchor_balance + sum(transactions > anchor_date)')
    it('should calculate backward from anchor: anchor_balance - sum(transactions between dates)')
    it('should fallback to direct sum when anchor calculation fails')
    it('should return calculation method metadata for transparency')
  })

  describe('Date Range Processing', () => {
    it('should filter transactions by date range correctly')
    it('should handle edge cases: same start/end date, empty ranges')
    it('should validate date formats (YYYY-MM-DD)')
    it('should use UTC date handling consistently')
    it('should throw clear errors for invalid date ranges')
  })

  describe('Data Integrity Validation', () => {
    it('should verify balance consistency across date range')
    it('should detect and report calculation discrepancies')
    it('should handle missing or corrupted transaction data gracefully')
    it('should maintain precision for currency calculations (2 decimal places)')
  })
})
```

##### **Service Method Tests**
```typescript
describe('AccountBalanceHistoryService - Service Methods', () => {
  describe('getAccountBalanceHistory', () => {
    it('should return chronologically sorted balance history')
    it('should calculate daily net amounts correctly')
    it('should include calculation method metadata')
    it('should handle accounts with no transactions')
    it('should respect tenant isolation')
    it('should validate account existence and ownership')
  })

  describe('getAccountBalanceSummary', () => {
    it('should calculate starting/ending balances accurately')
    it('should count total transactions in date range')
    it('should calculate net change correctly')
    it('should track calculation methods used')
  })

  describe('calculateBalanceAtDate', () => {
    it('should return accurate balance for any historical date')
    it('should choose optimal calculation method automatically')
    it('should handle dates before first transaction')
    it('should handle dates after last transaction')
    it('should return calculation metadata for audit trail')
  })
})
```

##### **Error Handling & Edge Cases**
```typescript
describe('AccountBalanceHistoryService - Error Handling', () => {
  it('should handle non-existent account IDs gracefully')
  it('should validate tenant access permissions')
  it('should handle database connection failures')
  it('should manage large date ranges efficiently')
  it('should handle accounts with thousands of transactions')
  it('should validate currency precision and rounding')
})
```

#### **API Integration Tests**
**Location**: `src/app/api/accounts/__tests__/balance-history.api.test.ts`
**Focus**: Endpoint functionality and data integrity

```typescript
describe('Balance History API Endpoints', () => {
  describe('GET /api/accounts/[id]/balance-history', () => {
    it('should return properly formatted balance history data')
    it('should respect query parameters: startDate, endDate')
    it('should enforce tenant isolation')
    it('should return 404 for non-existent accounts')
    it('should return 400 for invalid date formats')
    it('should handle large datasets with proper pagination')
  })

  describe('GET /api/accounts/[id]/balance-summary', () => {
    it('should return accurate summary statistics')
    it('should match balance history calculations')
    it('should include calculation method metadata')
    it('should handle empty date ranges gracefully')
  })
})
```

#### **Component Unit Tests**
**Location**: `src/components/balance-history/__tests__/`

```typescript
describe('Balance History Components', () => {
  describe('AccountBalanceChart', () => {
    it('should transform service data to chart format correctly')
    it('should handle empty datasets gracefully')
    it('should format currency values properly')
    it('should maintain data integrity in transformations')
  })

  describe('AccountTransactionsTable', () => {
    it('should display individual transactions with proper formatting')
    it('should sort transactions by date descending (newest first)')
    it('should calculate running balances correctly')
    it('should handle pagination correctly')
    it('should preserve calculation precision')
  })
})
```

#### **Accounting System Integration Tests**
**Location**: `src/lib/services/__tests__/accounting-integration.test.ts`

```typescript
describe('MVP Accounting System Integration', () => {
  it('should match AccountService balance calculations exactly')
  it('should maintain consistency with transaction impact logic')
  it('should respect balance anchor priority system')
  it('should follow bidirectional calculation rules')
  it('should preserve audit trail for all calculations')
})
```

#### **Performance & Load Tests**
```typescript
describe('Performance Tests', () => {
  it('should load 1 year of balance history in <2 seconds')
  it('should handle accounts with 10,000+ transactions efficiently')
  it('should optimize database queries for large date ranges')
  it('should cache calculation results appropriately')
})
```

#### **Test Data & Mocking Strategy**
```typescript
// Mock Prisma client following existing v5 patterns
jest.mock('@/lib/prisma', () => ({
  prisma: {
    account: { findFirst: jest.fn(), findMany: jest.fn() },
    transaction: { findMany: jest.fn(), count: jest.fn() },
    accountBalanceAnchor: { findMany: jest.fn() }, // If implemented
  }
}))

// Use createUTCDate for consistent date handling in tests
import { createUTCDate } from '@/lib/utils/date-utils'

// Mock realistic financial data with proper accounting signs
const mockTransactions = [
  { type: 'INCOME', amount: 5000, date: '2024-01-01' },    // +5000
  { type: 'EXPENSE', amount: 1200, date: '2024-01-02' },   // -1200
  { type: 'TRANSFER', amount: -500, date: '2024-01-03' },  // -500 (outgoing)
  { type: 'TRANSFER', amount: 500, date: '2024-01-03' },   // +500 (incoming)
]
```

#### **Coverage Requirements**
- **Service Methods**: >95% coverage (accounting logic is critical)
- **API Endpoints**: >90% coverage (data integrity focus)
- **Components**: >80% coverage (UI logic)
- **Overall Target**: >90% for balance calculation logic

#### **Continuous Integration**
- All tests must pass before deployment
- Balance calculation accuracy is deployment-blocking
- Performance benchmarks must be met
- Coverage thresholds enforced in CI pipeline

---

## 📚 **Documentation**

- [Planning Document](./planning.md) (this file)
- [Implementation Guide](./implementation.md)
- [API Documentation](./api.md)
- [Testing Guide](./testing.md)
- [README](./README.md)

---

## 🚀 **Implementation Plan**

### **Phase 1: Backend Foundation (Day 1 Morning)**
1. Create `AccountBalanceHistoryService` with MVP accounting compliance
2. Implement balance calculation methods following accounting system
3. Create API endpoints for balance history and summary
4. Write unit tests for balance calculations

### **Phase 2: Frontend Structure (Day 1 Afternoon)**
1. Create page layout matching v4.1 design exactly
2. Implement filters component (account selection, date range)
3. Create summary cards component
4. Set up data fetching with proper loading states

### **Phase 3: Chart Integration (Day 2 Morning)**
1. Install and configure Recharts library
2. Create `AccountBalanceChart` component matching v4.1
3. Implement custom tooltips and formatting
4. Add chart responsiveness and accessibility

### **Phase 4: Table and Polish (Day 2 Afternoon)**
1. Create balance history table with pagination
2. Implement real-time updates
3. Add error handling and empty states
4. Write integration and E2E tests
5. Update documentation

---

## 🔍 **Acceptance Criteria**

### **User Stories**

#### **Story 1: View Account Balance History**
- **As a** user
- **I want to** select an account and view its balance history over time
- **So that** I can understand how my account balance has changed

**Acceptance Criteria:**
- [ ] Account dropdown shows all user accounts
- [ ] Balance history loads for selected account
- [ ] Chart displays balance trend line accurately
- [ ] Table shows daily balance data
- [ ] All balance calculations follow MVP accounting system

#### **Story 2: Filter by Date Range**
- **As a** user
- **I want to** filter balance history by date range
- **So that** I can focus on specific time periods

**Acceptance Criteria:**
- [ ] Start date and end date inputs work correctly
- [ ] Date range filtering updates chart and table
- [ ] Invalid date ranges show appropriate error messages
- [ ] Default date range is reasonable (last 30 days)

#### **Story 3: Analyze Balance Changes**
- **As a** user
- **I want to** see summary statistics and visual trends
- **So that** I can quickly understand my financial patterns

**Acceptance Criteria:**
- [ ] Summary cards show starting/ending balance and net change
- [ ] Chart combines balance line with daily change bars
- [ ] Colors indicate positive/negative changes appropriately
- [ ] Tooltips provide detailed information on hover

#### **Story 4: View All Account Transactions**
- **As a** user
- **I want to** see all individual transactions for the selected account
- **So that** I can review every transaction and its impact on my balance

**Acceptance Criteria:**
- [ ] Table shows ALL individual transactions for the account
- [ ] Transactions are sorted by date descending (newest first)
- [ ] Each row shows transaction description, amount, and running balance
- [ ] Balance column shows account balance after each transaction
- [ ] Table columns: Date, Description, Amount, Balance

### **Technical Acceptance Criteria**

#### **MVP Accounting System Compliance**
- [x] ✅ **Backend Complete**: Uses proper balance calculation methods (direct sum implemented)
- [x] ✅ **Transaction Impact**: INCOME (+amount), EXPENSE (-amount), TRANSFER (as-is)
- [x] ✅ **Data Integrity**: Maintains `sum(transactions) = account_balance` principle
- [x] ✅ **No Math.abs()**: Never strips signs from amounts in calculations
- [ ] **Frontend Integration**: Connect UI to backend service (next phase)
- [ ] **Balance Anchor Support**: When balance anchors are implemented in v5

#### **Performance Requirements**
- [ ] Loads 1 year of balance history in <2 seconds
- [ ] Chart renders smoothly with 365+ data points
- [ ] Table pagination handles large datasets efficiently
- [ ] Real-time updates complete in <500ms

#### **Code Quality Requirements**
- [x] ✅ **TypeScript Coverage**: Complete interfaces and type definitions
- [x] ✅ **Unit Tests**: 19 comprehensive tests covering accounting accuracy
- [x] ✅ **API Endpoints**: Balance history and summary endpoints with authentication
- [x] ✅ **Error Handling**: Comprehensive error handling and validation
- [ ] **Frontend Tests**: Component and integration tests (next phase)
- [ ] **E2E Tests**: Critical user workflows (next phase)

---

## 🎨 **Design Specifications**

### **Color Scheme (Matching v4.1)**
- **Balance Line**: `#10b981` (Green)
- **Daily Change Bars**: `#3b82f6` (Blue)
- **Positive Changes**: `#10b981` (Green)
- **Negative Changes**: `#ef4444` (Red)
- **Background**: `#f9fafb` (Gray-50)
- **Cards**: `#ffffff` (White) with `#e5e7eb` (Gray-200) borders

### **Typography**
- **Page Title**: `text-3xl font-bold text-gray-900`
- **Section Headers**: `text-lg font-semibold text-gray-900`
- **Labels**: `text-sm font-medium text-gray-700`
- **Data Values**: `text-sm font-medium text-gray-900`

### **Layout Specifications**
- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- **Card Spacing**: `mb-6` between major sections
- **Grid Layout**: `grid-cols-1 md:grid-cols-3` for filters, `md:grid-cols-4` for summary cards
- **Chart Height**: `400px` default, responsive container

### **Responsive Breakpoints**
- **Mobile**: Single column layout, simplified chart
- **Tablet**: 2-column summary cards, full chart functionality
- **Desktop**: Full 4-column summary cards, optimal chart size

---

This planning document ensures the Account Balance History feature will be implemented with full MVP Accounting System compliance while matching the proven v4.1 UI design exactly. The feature will provide users with powerful insights into their financial trends while maintaining the highest standards of data accuracy and user experience.
