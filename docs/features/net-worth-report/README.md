# Net Worth Report

**Status**: 📋 **PLANNED**  
**Priority**: ⚡ Priority 2 (Important - Day After Tomorrow)  
**Estimated Effort**: 2 days  
**Planned Start**: September 19, 2025  

## Quick Overview

The Net Worth Report provides comprehensive financial health tracking by analyzing the sum of account balances across all accounts. Users can gauge their rate of return over selected time periods and drill down into detailed asset and liability breakdowns with interactive visualizations.

## 🎯 Key Features

### **Core Capabilities**
- 📅 **Flexible Time Periods**: This/Last Month, Quarter, Half, Year, plus Custom ranges
- 🏦 **Account Selection**: Filter by specific accounts or account types
- 📈 **Rate of Return**: Calculate performance metrics and growth rates
- 📊 **Interactive Charts**: Net worth trends and asset/liability comparisons
- 💰 **Asset Breakdown**: Pie charts and growth tables for asset allocation
- 📉 **Liability Analysis**: Debt tracking with interest rates and payoff projections

### **Advanced Features**
- 📋 **Summary Cards**: Key metrics at a glance
- 📊 **Historical Comparison**: Period-over-period analysis
- 📤 **Export Options**: PDF reports, CSV data, chart images
- 🎨 **Interactive Visualizations**: Hover details and drill-down capabilities

## 🚀 User Benefits

- **Financial Health Monitoring**: Track net worth trends over time
- **Performance Analysis**: Understand investment and savings growth
- **Asset Allocation**: Visualize portfolio distribution and balance
- **Debt Management**: Monitor liability levels and payoff progress
- **Informed Decisions**: Make financial choices based on comprehensive data

## 📊 Report Layout

### **Time Period Options**
Your specified time periods with auto-populated dates:
- **This Month** → Start: 1st of current month, End: Today
- **Last Month** → Start/End: Previous month boundaries
- **This Quarter** → Start: 1st day of current quarter, End: Today
- **Last Quarter** → Start/End: Previous quarter boundaries
- **This Half** → Start: Jan 1 or Jul 1, End: Today
- **Last Half** → Start/End: Previous half-year boundaries
- **This Year** → Start: Jan 1, End: Today
- **Last Year** → Start/End: Previous year boundaries
- **Custom** → User-selectable date range

### **Visual Components**

#### **📈 Total Net Worth Chart**
- Line chart showing net worth trend over selected period
- Daily data points with smooth interpolation
- Hover tooltips with exact values and dates
- Green for positive, red for negative net worth

#### **📊 Assets vs Liabilities Chart**
- Dual line chart with absolute values
- Blue line for total assets, orange for total liabilities
- Shared Y-axis with appropriate scaling
- Crossover points highlighted

#### **💰 Asset Breakdown**
- **Pie Chart**: Dollar value portion from each asset account
- **Growth Table**: Start value, end value, change ($), change (%)
```
┌─────────────────┬──────────────┬──────────────┬─────────────┬──────────────┐
│ Account         │ Start Value  │ End Value    │ Change ($)  │ Change (%)   │
├─────────────────┼──────────────┼──────────────┼─────────────┼──────────────┤
│ Chase Checking  │ $5,000.00    │ $5,500.00    │ +$500.00    │ +10.0%       │
│ Investment 401k │ $45,000.00   │ $47,800.00   │ +$2,800.00  │ +6.2%        │
└─────────────────┴──────────────┴──────────────┴─────────────┴──────────────┘
```

#### **📉 Liability Breakdown**
- **Pie Chart**: Dollar value portion of debt from each liability account
- **Details Table**: Total debt, interest rate, minimum payment, payoff time
```
┌─────────────────┬──────────────┬──────────────┬─────────────┬──────────────┐
│ Account         │ Total Debt   │ Interest Rate│ Min Payment │ Payoff Time  │
├─────────────────┼──────────────┼──────────────┼─────────────┼──────────────┤
│ Credit Card     │ $2,500.00    │ 18.99%       │ $75.00      │ 4.2 years    │
│ Mortgage        │ $285,000.00  │ 2.75%        │ $1,200.00   │ 22.5 years   │
└─────────────────┴──────────────┴──────────────┴─────────────┴──────────────┘
```

## 🏗️ Technical Implementation

### **Frontend Components**
- `NetWorthReportPage.tsx` - Main report container
- `PeriodSelector.tsx` - Time period selection with auto-dates
- `AccountSelector.tsx` - Multi-select account filtering
- `NetWorthChart.tsx` - Primary trend visualization
- `AssetsLiabilitiesChart.tsx` - Dual-line comparison chart
- `AssetBreakdownPieChart.tsx` - Asset allocation visualization
- `AssetGrowthTable.tsx` - Asset performance table
- `LiabilityBreakdownPieChart.tsx` - Debt distribution chart
- `LiabilityDetailsTable.tsx` - Debt details with rates and payoff

### **Backend Services**
- `NetWorthReportService` - Core calculation and data aggregation
- Balance anchor integration for accurate historical data
- Rate of return calculations (absolute, percentage, annualized)
- Asset/liability classification and breakdown logic

### **Key Calculations**
- **Net Worth**: Sum of all asset balances minus liability balances
- **Rate of Return**: (End Value - Start Value) / Start Value × 100
- **Annualized Return**: Account for time period in performance calculation
- **Asset-to-Liability Ratio**: Total assets divided by total liabilities

## 📊 Success Metrics

- **User Engagement**: 80%+ of users access report monthly
- **Financial Awareness**: 90%+ accuracy in understanding financial position
- **Decision Making**: 70% make financial decisions based on insights
- **Data Accuracy**: 99%+ accuracy using balance anchor system

## 🔗 Dependencies

- **Account Management** ✅ - For account data and classifications
- **Financial Trends Cube** - For historical data aggregation
- **MVP Accounting System** ✅ - For balance anchor integration
- **Balance History** - For transaction-based calculations

## 📁 Documentation

- **[Planning Document](planning.md)** - Detailed feature specifications and layout
- **[Execution Log](execution-log.md)** - Implementation progress tracking (TBD)
- **[Implementation Guide](implementation.md)** - Technical implementation details (TBD)

## 🎯 Implementation Phases

### **Day 1: Core Functionality**
- Time period selection with auto-date population
- Basic net worth calculation service
- Summary cards and net worth trend chart
- Account filtering and selection

### **Day 2: Detailed Breakdowns**
- Assets vs liabilities comparison chart
- Asset breakdown pie chart and growth table
- Liability breakdown pie chart and details table
- Export functionality and performance optimization

## 🎨 User Interface

### **Page Layout**
```
┌─────────────────────────────────────────────────────────────────┐
│ Net Worth Report                                                │
├─────────────────────────────────────────────────────────────────┤
│ Period: [This Month ▼]  Accounts: [All Accounts ▼]  [Export ▼] │
├─────────────────────────────────────────────────────────────────┤
│ [Net Worth] [Period Change] [Total Assets] [Total Liabilities]  │
├─────────────────────────────────────────────────────────────────┤
│ Net Worth Trend Chart (Full Width)                             │
├─────────────────────────────────────────────────────────────────┤
│ Assets vs Liabilities Chart (Full Width)                       │
├─────────────────────────────────────────────────────────────────┤
│ Asset Breakdown          │ Liability Breakdown                  │
│ [Pie Chart]              │ [Pie Chart]                          │
│ [Growth Table]           │ [Details Table]                      │
└─────────────────────────────────────────────────────────────────┘
```

---

*This feature will provide users with comprehensive insights into their financial health and help them make informed decisions about their wealth management strategy.*
