# Net Worth Report - Planning Document

**Feature**: Net Worth Report
**Status**: 📋 **PLANNED**
**Priority**: ⚡ Priority 2 (Important - Day After Tomorrow)
**Estimated Effort**: 2 days
**Planned Start**: September 19, 2025
**Dependencies**: Account Management ✅, Financial Trends Cube, MVP Accounting System ✅

## Overview

The Net Worth Report provides comprehensive financial health tracking by analyzing the sum of account balances across all accounts. Users can gauge their rate of return over selected time periods and drill down into asset and liability breakdowns with detailed analytics and visualizations.

## 🎯 Business Objectives

### **Primary Goals**
- **Financial Health Tracking**: Monitor net worth trends over time
- **Performance Analysis**: Calculate rate of return for selected periods and accounts
- **Asset Management**: Visualize asset allocation and growth
- **Liability Monitoring**: Track debt levels and interest obligations
- **Investment Insights**: Understand portfolio performance and allocation

### **Success Metrics**
- **User Engagement**: 80%+ of users access net worth report monthly
- **Financial Awareness**: Users report 90%+ accuracy in understanding their financial position
- **Decision Making**: 70% of users make financial decisions based on report insights
- **Data Accuracy**: 99%+ accuracy in net worth calculations using balance anchors

## 📋 Feature Requirements

### **Core Requirements**

#### **1. Time Period Selection** 📅
- **Predefined Periods**:
  - **This Month**: Auto-populate start (1st of current month) and end (today)
  - **Last Month**: Auto-populate start (1st of previous month) and end (last day of previous month)
  - **This Quarter**: Auto-populate start (1st day of current quarter) and end (today)
  - **Last Quarter**: Auto-populate start/end of previous quarter
  - **This Half**: Auto-populate start (Jan 1 or Jul 1) and end (today)
  - **Last Half**: Auto-populate start/end of previous half-year
  - **This Year**: Auto-populate start (Jan 1) and end (today)
  - **Last Year**: Auto-populate start/end of previous year
  - **Custom**: User-selectable start and end dates

#### **2. Account Selection** 🏦
- **Account Filtering**:
  - Select all accounts (default)
  - Select specific accounts for analysis
  - Filter by account type (Assets, Liabilities, Excluded)
  - Save account selection preferences
  - Multi-select with search functionality

#### **3. Rate of Return Calculation** 📈
- **Performance Metrics**:
  - Absolute change in net worth
  - Percentage change calculation
  - Annualized rate of return
  - Compound annual growth rate (CAGR)
  - Period-over-period comparison
  - Benchmark against previous periods

### **Visual Components**

#### **4. Total Net Worth Chart** 📊
- **Primary Visualization**:
  - Line chart showing net worth trend over selected period
  - Daily data points with smooth interpolation
  - Hover tooltips with exact values and dates
  - Zoom and pan functionality for detailed analysis
  - Color coding: Green for positive, Red for negative net worth
  - Milestone markers for significant changes

#### **5. Assets vs Liabilities Chart** 📈
- **Dual Line Chart**:
  - Two separate lines for total assets and total liabilities
  - Both values shown in absolute terms (positive values)
  - Different colors: Blue for assets, Orange for liabilities
  - Shared Y-axis with appropriate scaling
  - Legend with current values and period change
  - Crossover points highlighted when liability exceeds assets

#### **6. Asset Breakdown** 💰
- **Pie Chart Visualization**:
  - Show dollar value portion from each asset account
  - Interactive segments with hover details
  - Color-coded by account type or custom colors
  - Percentage labels on significant segments
  - Legend with account names and values
  - Option to hide accounts below threshold (e.g., < 1%)

- **Asset Growth Table**:
  ```
  ┌─────────────────┬──────────────┬──────────────┬─────────────┬──────────────┐
  │ Account         │ Start Value  │ End Value    │ Change ($)  │ Change (%)   │
  ├─────────────────┼──────────────┼──────────────┼─────────────┼──────────────┤
  │ Chase Checking  │ $5,000.00    │ $5,500.00    │ +$500.00    │ +10.0%       │
  │ Savings Account │ $25,000.00   │ $26,200.00   │ +$1,200.00  │ +4.8%        │
  │ Investment 401k │ $45,000.00   │ $47,800.00   │ +$2,800.00  │ +6.2%        │
  │ Stock Portfolio │ $15,000.00   │ $14,200.00   │ -$800.00    │ -5.3%        │
  └─────────────────┴──────────────┴──────────────┴─────────────┴──────────────┘
  ```

#### **7. Liability Breakdown** 📉
- **Pie Chart Visualization**:
  - Show dollar value portion of debt from each liability account
  - Interactive segments with hover details
  - Color-coded with red/orange tones for debt visualization
  - Percentage labels on significant segments
  - Legend with account names and debt amounts

- **Liability Details Table**:
  ```
  ┌─────────────────┬──────────────┬──────────────┬─────────────┬──────────────┐
  │ Account         │ Total Debt   │ Interest Rate│ Min Payment │ Payoff Time  │
  ├─────────────────┼──────────────┼──────────────┼─────────────┼──────────────┤
  │ Credit Card     │ $2,500.00    │ 18.99%       │ $75.00      │ 4.2 years    │
  │ Auto Loan       │ $18,000.00   │ 3.5%         │ $320.00     │ 5.8 years    │
  │ Mortgage        │ $285,000.00  │ 2.75%        │ $1,200.00   │ 22.5 years   │
  │ Student Loan    │ $12,000.00   │ 4.2%         │ $150.00     │ 8.1 years    │
  └─────────────────┴──────────────┴──────────────┴─────────────┴──────────────┘
  ```

### **Advanced Requirements**

#### **8. Summary Cards** 📋
- **Key Metrics Display**:
  - Current Net Worth (large, prominent)
  - Period Change (absolute and percentage)
  - Total Assets (current value)
  - Total Liabilities (current value)
  - Asset-to-Liability Ratio
  - Monthly Net Worth Velocity (trend indicator)

#### **9. Historical Comparison** 📊
- **Period-over-Period Analysis**:
  - Compare current period with previous equivalent period
  - Year-over-year comparison
  - Best/worst performing periods
  - Seasonal trend analysis
  - Growth trajectory indicators

#### **10. Export and Sharing** 📤
- **Report Export Options**:
  - PDF report generation with charts and tables
  - CSV data export for external analysis
  - PNG/SVG chart exports
  - Email report scheduling
  - Print-friendly formatting

## 🏗️ Technical Architecture

### **Frontend Components**

#### **NetWorthReportPage.tsx**
```typescript
interface NetWorthReportProps {
  initialPeriod?: TimePeriod
  initialAccounts?: number[]
}

interface TimePeriod {
  type: 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' |
        'this_half' | 'last_half' | 'this_year' | 'last_year' | 'custom'
  startDate: string
  endDate: string
  label: string
}
```

#### **PeriodSelector.tsx**
```typescript
interface PeriodSelectorProps {
  selectedPeriod: TimePeriod
  onPeriodChange: (period: TimePeriod) => void
  customDateRange?: { start: string; end: string }
}
```

#### **AccountSelector.tsx**
```typescript
interface AccountSelectorProps {
  accounts: Account[]
  selectedAccountIds: number[]
  onSelectionChange: (accountIds: number[]) => void
  groupByType?: boolean
}
```

#### **NetWorthChart.tsx**
```typescript
interface NetWorthChartProps {
  data: NetWorthDataPoint[]
  period: TimePeriod
  height?: number
  showMilestones?: boolean
}

interface NetWorthDataPoint {
  date: string
  netWorth: number
  totalAssets: number
  totalLiabilities: number
}
```

#### **AssetsLiabilitiesChart.tsx**
```typescript
interface AssetsLiabilitiesChartProps {
  data: NetWorthDataPoint[]
  period: TimePeriod
  height?: number
}
```

#### **AssetBreakdownPieChart.tsx**
```typescript
interface AssetBreakdownProps {
  accounts: AccountBreakdown[]
  totalAssets: number
  onAccountClick?: (accountId: number) => void
}

interface AccountBreakdown {
  accountId: number
  accountName: string
  currentValue: number
  startValue: number
  change: number
  changePercent: number
  color: string
}
```

#### **AssetGrowthTable.tsx**
```typescript
interface AssetGrowthTableProps {
  accounts: AccountBreakdown[]
  sortBy?: 'name' | 'value' | 'change' | 'changePercent'
  sortOrder?: 'asc' | 'desc'
}
```

#### **LiabilityBreakdownPieChart.tsx**
```typescript
interface LiabilityBreakdownProps {
  accounts: LiabilityBreakdown[]
  totalLiabilities: number
  onAccountClick?: (accountId: number) => void
}

interface LiabilityBreakdown {
  accountId: number
  accountName: string
  currentDebt: number
  interestRate?: number
  minimumPayment?: number
  payoffTime?: number
  color: string
}
```

#### **LiabilityDetailsTable.tsx**
```typescript
interface LiabilityDetailsTableProps {
  accounts: LiabilityBreakdown[]
  sortBy?: 'name' | 'debt' | 'rate' | 'payment' | 'payoff'
  sortOrder?: 'asc' | 'desc'
}
```

### **Backend Services**

#### **NetWorthReportService**
```typescript
class NetWorthReportService extends BaseService {
  async getNetWorthData(
    tenantId: string,
    startDate: string,
    endDate: string,
    accountIds?: number[]
  ): Promise<NetWorthReportData>

  async calculateRateOfReturn(
    tenantId: string,
    startDate: string,
    endDate: string,
    accountIds?: number[]
  ): Promise<RateOfReturnData>

  async getAssetBreakdown(
    tenantId: string,
    date: string,
    accountIds?: number[]
  ): Promise<AccountBreakdown[]>

  async getLiabilityBreakdown(
    tenantId: string,
    date: string,
    accountIds?: number[]
  ): Promise<LiabilityBreakdown[]>

  async getHistoricalNetWorth(
    tenantId: string,
    startDate: string,
    endDate: string,
    accountIds?: number[]
  ): Promise<NetWorthDataPoint[]>
}
```

#### **Data Interfaces**
```typescript
interface NetWorthReportData {
  currentNetWorth: number
  periodChange: number
  periodChangePercent: number
  totalAssets: number
  totalLiabilities: number
  assetLiabilityRatio: number
  rateOfReturn: RateOfReturnData
  historicalData: NetWorthDataPoint[]
  assetBreakdown: AccountBreakdown[]
  liabilityBreakdown: LiabilityBreakdown[]
}

interface RateOfReturnData {
  absoluteChange: number
  percentChange: number
  annualizedReturn: number
  compoundAnnualGrowthRate: number
  periodDays: number
}
```

### **Database Queries**

#### **Net Worth Calculation**
```sql
-- Get net worth for a specific date using balance anchors
WITH account_balances AS (
  SELECT
    a.id as account_id,
    a.name as account_name,
    a.type as account_type,
    a.net_worth_category,
    COALESCE(
      -- Use most recent balance anchor before or on the target date
      (SELECT aba.balance
       FROM account_balance_anchors aba
       WHERE aba.account_id = a.id
         AND aba.anchor_date <= $1::date
       ORDER BY aba.anchor_date DESC
       LIMIT 1),
      0
    ) +
    -- Add transactions after the most recent anchor
    COALESCE(
      (SELECT SUM(t.amount)
       FROM transactions t
       WHERE t.account_id = a.id
         AND t.date > COALESCE(
           (SELECT aba.anchor_date
            FROM account_balance_anchors aba
            WHERE aba.account_id = a.id
              AND aba.anchor_date <= $1::date
            ORDER BY aba.anchor_date DESC
            LIMIT 1),
           '1900-01-01'::date
         )
         AND t.date <= $1::date
         AND t.deleted_at IS NULL),
      0
    ) as balance
  FROM accounts a
  WHERE a.tenant_id = $2
    AND a.deleted_at IS NULL
    AND ($3::integer[] IS NULL OR a.id = ANY($3::integer[]))
)
SELECT
  SUM(CASE WHEN net_worth_category = 'ASSET' THEN balance ELSE 0 END) as total_assets,
  SUM(CASE WHEN net_worth_category = 'LIABILITY' THEN ABS(balance) ELSE 0 END) as total_liabilities,
  SUM(CASE
    WHEN net_worth_category = 'ASSET' THEN balance
    WHEN net_worth_category = 'LIABILITY' THEN balance
    ELSE 0
  END) as net_worth
FROM account_balances;
```

#### **Historical Net Worth Trend**
```sql
-- Generate daily net worth data for the selected period
WITH date_series AS (
  SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as report_date
),
daily_net_worth AS (
  SELECT
    ds.report_date,
    -- Calculate net worth for each date (similar to above query)
    -- ... (net worth calculation logic for each date)
  FROM date_series ds
)
SELECT * FROM daily_net_worth ORDER BY report_date;
```

## 🎨 User Interface Design

### **Page Layout Structure**
```
┌─────────────────────────────────────────────────────────────────┐
│ Net Worth Report                                                │
├─────────────────────────────────────────────────────────────────┤
│ Period: [This Month ▼]  Accounts: [All Accounts ▼]  [Export ▼] │
├─────────────────────────────────────────────────────────────────┤
│ Summary Cards Row:                                              │
│ [Net Worth] [Period Change] [Total Assets] [Total Liabilities]  │
├─────────────────────────────────────────────────────────────────┤
│ Net Worth Trend Chart (Full Width)                             │
├─────────────────────────────────────────────────────────────────┤
│ Assets vs Liabilities Chart (Full Width)                       │
├─────────────────────────────────────────────────────────────────┤
│ Asset Breakdown:                    │ Liability Breakdown:      │
│ ┌─────────────────────────────────┐ │ ┌───────────────────────┐ │
│ │ Asset Pie Chart                 │ │ │ Liability Pie Chart   │ │
│ └─────────────────────────────────┘ │ └───────────────────────┘ │
│ ┌─────────────────────────────────┐ │ ┌───────────────────────┐ │
│ │ Asset Growth Table              │ │ │ Liability Details     │ │
│ └─────────────────────────────────┘ │ └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **Color Scheme**
- **Net Worth Positive**: #4CAF50 (Green)
- **Net Worth Negative**: #F44336 (Red)
- **Assets**: #2196F3 (Blue)
- **Liabilities**: #FF9800 (Orange)
- **Background**: #FAFAFA (Light Gray)
- **Cards**: #FFFFFF (White)
- **Text Primary**: #212121
- **Text Secondary**: #757575

### **Responsive Design**
- **Desktop**: Two-column layout for asset/liability breakdowns
- **Tablet**: Single column with stacked components
- **Mobile**: Simplified charts with horizontal scrolling tables

## 🔄 User Experience Flow

### **Initial Load**
1. User navigates to Net Worth Report
2. Default period (This Month) and all accounts selected
3. Summary cards load with current values
4. Charts render with loading states
5. Data populates progressively

### **Period Selection**
1. User clicks period dropdown
2. Predefined options with auto-calculated dates
3. Custom option opens date range picker
4. Selection triggers data refresh
5. Charts update with smooth transitions

### **Account Filtering**
1. User clicks account selector
2. Multi-select dropdown with search
3. Account types grouped (Assets, Liabilities)
4. Selection updates all visualizations
5. Summary cards recalculate

### **Interactive Elements**
1. Chart hover shows detailed tooltips
2. Pie chart segments clickable for drill-down
3. Table sorting by clicking column headers
4. Export options in dropdown menu
5. Print-friendly view available

## 🧪 Testing Strategy

### **Unit Tests**
- Net worth calculation accuracy
- Rate of return formulas
- Date range generation
- Account filtering logic
- Chart data transformation

### **Integration Tests**
- End-to-end report generation
- Balance anchor integration
- Multi-account calculations
- Period comparison accuracy
- Export functionality

### **Performance Tests**
- Large dataset handling (1000+ accounts)
- Historical data processing
- Chart rendering performance
- Real-time data updates
- Memory usage optimization

## 📊 Analytics & Monitoring

### **Usage Metrics**
- Report access frequency
- Most used time periods
- Account selection patterns
- Export usage statistics
- User engagement time

### **Performance Metrics**
- Page load time
- Chart rendering speed
- Data calculation time
- Export generation time
- Error rates and types

## 🚀 Implementation Phases

### **Phase 1: Core Functionality (Day 1)**
- Period selection and date calculation
- Basic net worth calculation service
- Summary cards implementation
- Net worth trend chart

### **Phase 2: Detailed Breakdowns (Day 2)**
- Assets vs liabilities chart
- Asset breakdown pie chart and table
- Liability breakdown pie chart and table
- Account filtering and selection

## 🔗 Integration Points

### **Dependencies**
- **Account Management**: For account data and balance calculations
- **Financial Trends Cube**: For historical data aggregation
- **MVP Accounting System**: For balance anchor integration
- **Balance History**: For transaction-based calculations

### **Future Integrations**
- **Budgeting**: Net worth impact of budget adherence
- **Investment Tracking**: Portfolio performance integration
- **Goal Setting**: Net worth targets and milestones
- **Notifications**: Net worth milestone alerts

## 📝 Implementation Notes

### **Technical Considerations**
- Efficient balance calculation using balance anchors
- Caching strategy for historical data
- Real-time updates when transactions change
- Responsive chart design for mobile devices

### **User Experience Priorities**
- Fast loading with progressive data display
- Intuitive period and account selection
- Clear visual hierarchy and information architecture
- Accessible color choices and contrast ratios

### **Performance Targets**
- Initial page load: < 3 seconds
- Period change: < 1 second
- Chart interactions: < 200ms
- Export generation: < 10 seconds
