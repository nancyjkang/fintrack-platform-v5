# Feature: Savings Trend Report

**Created**: 2025-09-19
**Estimated Start**: 2025-09-20
**Priority**: High

---

## 🎯 **Goal**
Create a comprehensive savings trend analysis tool that shows users not just how much they're saving, but WHY their savings changed. This solves the critical problem of users not understanding what drives their savings patterns - whether changes are due to income fluctuations, expense increases, or transfer adjustments.

## 👥 **User Impact**
Users gain deep insights into their savings patterns with actionable intelligence:
- **Savings Decomposition**: Understand if savings changes are due to income, expenses, or transfers
- **Trend Visualization**: See savings patterns over time with interactive charts
- **Attribution Analysis**: Identify exactly what caused savings to increase or decrease
- **Goal Tracking**: Monitor progress toward savings targets with rate calculations
- **Optimization Insights**: Discover specific opportunities to improve savings
- **Realistic Goal Setting**: Use historical data to set achievable savings goals for emergency funds, debt payoff, retirement, and other financial objectives

**Primary User Story**: As a FinTrack user, I want to analyze my savings trends with detailed breakdowns of income, expenses, and transfers so that I can understand what drives my savings changes and make informed decisions to optimize my financial health.

**Secondary User Story**: As a FinTrack user, I want to use my historical savings data to set realistic and achievable financial goals (emergency fund, debt payoff, retirement) so that I can create actionable plans based on my actual savings capacity rather than unrealistic aspirations.

---

## 📊 **Scope Definition**

### **✅ Must Have (Core Functionality)**
- [ ] **Main Stacked Area Chart**: Income (positive), Expenses (negative), Net Transfers, with Net Savings line overlay
- [ ] **Period Controls**: Monthly/Quarterly/Yearly breakdown with date range selection
- [ ] **Savings Rate Chart**: Secondary chart showing savings rate percentage over time
- [ ] **Change Attribution Table**: "What Changed Your Savings" breakdown comparing current vs previous period
- [ ] **Key Metrics Display**: Current savings, savings rate, period-over-period changes
- [ ] **Interactive Tooltips**: Hover details for each data point showing component breakdowns
- [ ] **Responsive Design**: Mobile-optimized layout with stacked components

### **⚡ Should Have (Important)**
- [ ] **Key Insights Panel**: Best/worst months, goal progress, biggest impacts, optimization opportunities
- [ ] **Drill-Down Capabilities**: Click on Income/Expenses/Transfers to see category breakdowns
- [ ] **Comparison Modes**: Year-over-year, budget vs actual, planned vs actual savings
- [ ] **Export Functionality**: Chart and data export to CSV/Excel/PNG
- [ ] **Savings Goal Integration**: Set and track progress toward monthly/annual savings targets
- [ ] **Realistic Goal Setting Wizard**: Data-driven goal creation for emergency funds, debt payoff, retirement
- [ ] **Goal Feasibility Analysis**: Show if proposed goals are achievable based on historical savings patterns
- [ ] **Color Coding & Visual Indicators**: Clear visual distinction between positive/negative changes

### **💡 Nice to Have (If Time Permits)**
- [ ] **Advanced Filtering**: Include/exclude transfers, one-time income, irregular expenses
- [ ] **Seasonal Analysis**: Identify seasonal savings patterns and trends
- [ ] **Forecasting**: Predict future savings based on historical trends
- [ ] **Email Reports**: Automated monthly/quarterly savings reports
- [ ] **Social Sharing**: Share savings achievements and insights
- [ ] **Custom Time Periods**: Flexible date range selection beyond standard periods

### **❌ Out of Scope (For This Version)**
- Investment performance analysis (separate investment tracking feature)
- Tax impact analysis on savings (separate tax feature)
- Automated savings recommendations (part of Financial Insights Engine)
- Integration with external savings accounts (separate banking integration)
- Savings goal automation and transfers (separate automation feature)

---

## 🔗 **Dependencies**

### **Prerequisites (Must be done first)**
- [ ] [Feature X] - [Why it's needed]
- [ ] [API Y] - [Why it's needed]
- [ ] [Database change Z] - [Why it's needed]

### **Dependent Features (Blocked by this)**
- [Feature A] - [How it depends on this]
- [Feature B] - [How it depends on this]

---

## 🛠️ **Technical Approach**

### **Database Changes**
- [ ] No new tables required - leverages existing financial_cube and transactions
- [ ] Potential cube optimization for savings-specific queries
- [ ] Migration required: No (uses existing data structure)

### **API Endpoints Needed**
- [ ] `GET /api/savings/trends` - Get savings trend data with income/expense/transfer breakdown
- [ ] `GET /api/savings/attribution` - Get period-over-period change attribution analysis
- [ ] `GET /api/savings/insights` - Get key insights (best/worst months, optimization opportunities)
- [ ] `GET /api/savings/goals` - Get and manage savings goals and progress tracking
- [ ] `POST /api/savings/goals/analyze` - Analyze goal feasibility based on historical savings data
- [ ] `GET /api/savings/capacity` - Calculate realistic savings capacity for goal setting

### **UI Components**
- [ ] `SavingsTrendPage` - Main page container with all charts and controls
- [ ] `SavingsStackedChart` - Primary stacked area chart with income/expenses/transfers
- [ ] `SavingsRateChart` - Secondary line chart showing savings rate percentage
- [ ] `ChangeAttributionTable` - Table showing what changed savings period-over-period
- [ ] `KeyInsightsPanel` - Right sidebar with insights and optimization tips
- [ ] `PeriodControls` - Filter controls for time periods and date ranges
- [ ] `SavingsMetricsCards` - Key metrics display (current savings, rate, changes)
- [ ] `SavingsExportButton` - Export functionality for charts and data
- [ ] `GoalSettingWizard` - Modal wizard for creating realistic savings goals
- [ ] `GoalFeasibilityIndicator` - Component showing if goals are achievable based on data

### **Third-party Integrations**
- **Recharts** - For interactive charts (ComposedChart, Area, Line, ReferenceLine components)
- **date-fns** - For date manipulation and period calculations
- **jsPDF/html2canvas** - For chart export functionality (optional)

### **Chart Implementation Details**

#### **Main Stacked Area Chart**
```typescript
interface SavingsTrendData {
  period: string
  income: number
  expenses: number
  transfers: number
  netSavings: number
  savingsRate: number
  previousPeriod?: {
    income: number
    expenses: number
    transfers: number
    netSavings: number
  }
}
```

#### **Chart Configuration**
- **ComposedChart** with stacked areas and overlay line
- **Area components**: Income (green), Expenses (red), Transfers (yellow)
- **Line component**: Net Savings (blue, bold)
- **ReferenceLine**: Zero line and savings goal line
- **Interactive tooltips**: Show detailed breakdown on hover
- **Responsive design**: Adapts to mobile with simplified view

#### **Color Scheme**
- 🟢 Income: `#10B981` (Green-500)
- 🔴 Expenses: `#EF4444` (Red-500)
- 🟡 Transfers: `#F59E0B` (Amber-500)
- 🔵 Net Savings: `#3B82F6` (Blue-500)
- ⚫ Zero Line: `#6B7280` (Gray-500)
- 🎯 Goal Line: `#8B5CF6` (Purple-500, dashed)

---

## ⏱️ **Estimates**

### **Complexity Assessment**
- **Overall Complexity**: Low/Medium/High
- **Database Work**: [X hours] - [Reason]
- **API Development**: [X hours] - [Reason]
- **UI Development**: [X hours] - [Reason]
- **Testing & Polish**: [X hours] - [Reason]

### **Time Estimate**
- **Total Estimate**: [X days]
- **Buffer (20%)**: [X days]
- **Final Estimate**: [X days]

### **Risk Assessment**
- **Risk Level**: Low/Medium/High
- **Main Risks**:
  - [Risk 1]: [Impact and mitigation plan]
  - [Risk 2]: [Impact and mitigation plan]

---

## ✅ **Success Criteria**

### **Functional Requirements**
- [ ] User can [specific action 1]
- [ ] User can [specific action 2]
- [ ] [Specific behavior] works correctly
- [ ] Error handling works for [scenario]

### **Performance Requirements**
- [ ] Page loads in < [X] seconds
- [ ] Handles [X] records without performance issues
- [ ] Works on mobile devices

### **Quality Requirements**
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No accessibility issues
- [ ] Responsive design works

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- [ ] [Component/Function] - [What to test]
- [ ] [API endpoint] - [What to test]

### **Integration Tests**
- [ ] [Workflow] - [End-to-end scenario]
- [ ] [API integration] - [Data flow test]

### **Manual Testing**
- [ ] [User workflow 1] - [Steps to test]
- [ ] [User workflow 2] - [Steps to test]
- [ ] [Edge case] - [How to test]

---

## 📋 **Implementation Plan**

### **Phase 1: Foundation** ([X] days)
- [ ] Database schema updates
- [ ] Basic API endpoints
- [ ] Core data models

### **Phase 2: Core Features** ([X] days)
- [ ] Main UI components
- [ ] API integration
- [ ] Basic functionality working

### **Phase 3: Polish & Testing** ([X] days)
- [ ] Error handling
- [ ] Loading states
- [ ] Testing and bug fixes
- [ ] Performance optimization

---

## 📊 **Metrics & Monitoring**

### **Success Metrics**
- [Metric 1]: [How to measure]
- [Metric 2]: [How to measure]

### **Monitoring**
- [ ] Error tracking set up
- [ ] Performance monitoring
- [ ] User behavior tracking (if applicable)

---

## 📝 **Notes & Decisions**

### **Technical Decisions**
- [Decision 1]: [Rationale]
- [Decision 2]: [Rationale]

### **Open Questions**
- **Savings Calculation**: Should transfers be included in savings calculation by default, or made optional?
- **Goal Setting**: Should savings goals be integrated into this feature or kept separate?
- **Mobile Chart Interaction**: How to handle chart interactions on mobile devices with limited screen space?

### **Detailed UI Wireframe**

#### **Desktop Layout**
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 💰 Savings Trend Analysis                                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Period: [Monthly ▼] | Range: [Last 12 Months ▼] | [Custom...]                     │
│ Include: ☑ Transfers ☑ One-time Income ☑ Irregular Expenses                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│ ┌─────────────────────────────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Main Stacked Area Chart                     │ │ 💡 Key Insights                │ │
│ │                                             │ │                                 │ │
│ │ $3,000 ┌─────────────────────────────────┐  │ │ 📈 Best Savings Month           │ │
│ │        │           Income Area           │  │ │ March: $1,200 (28.5% rate)     │ │
│ │ $2,000 │                                 │  │ │                                 │ │
│ │        │                                 │  │ │ 📉 Lowest Savings Month         │ │
│ │ $1,000 │                                 │  │ │ August: $150 (3.2% rate)       │ │
│ │        │                                 │  │ │                                 │ │
│ │     $0 ├─────────────────────────────────┤  │ │ 🎯 Savings Goal Progress        │ │
│ │        │                                 │  │ │ Target: $800/month              │ │
│ │ -$1,000│         Expenses Area           │  │ │ Average: $675/month             │ │
│ │        │                                 │  │ │ ▓▓▓▓▓▓▓░░░ 84% of goal          │ │
│ │ -$2,000│                                 │  │ │                                 │ │
│ │        └─────────────────────────────────┘  │ │ 🔍 Biggest Impact This Period   │ │
│ │         Jan Feb Mar Apr May Jun Jul Aug     │ │ Dining out increased by $180    │ │
│ │                                             │ │ (reduced savings by $180)       │ │
│ │ Legend: [Income] [Expenses] [Savings] [T]   │ │                                 │ │
│ └─────────────────────────────────────────────┘ │ 💡 Optimization Opportunity     │ │
│                                                 │ Reduce subscriptions by $45/mo  │ │
│ ┌─────────────────────────────────────────────┐ │ = +$540 annual savings          │ │
│ │ Savings Rate Trend                          │ └─────────────────────────────────┘ │
│ │                                             │                                     │
│ │ 40% ┌─────────────────────────────────────┐ │                                     │
│ │     │     ●                               │ │                                     │
│ │ 30% │       ●     ●                       │ │                                     │
│ │     │         ●     ●   ●                 │ │                                     │
│ │ 20% │           ●     ●   ●   ●           │ │                                     │
│ │     │                   ●   ●   ●         │ │                                     │
│ │ 10% │                           ●   ●     │ │                                     │
│ │     │                               ●     │ │                                     │
│ │  0% └─────────────────────────────────────┘ │                                     │
│ │     Jan Feb Mar Apr May Jun Jul Aug         │                                     │
│ │                                             │                                     │
│ │ Target: 20% | Average: 18.5% | Current: 15.2% │                                 │
│ └─────────────────────────────────────────────┘                                     │
│                                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │ What Changed Your Savings This Month?                                           │ │
│ ├─────────────────────┬─────────┬─────────┬─────────┬─────────────────────────────┤ │
│ │ Component           │ Last    │ This    │ Change  │ Impact                      │ │
│ ├─────────────────────┼─────────┼─────────┼─────────┼─────────────────────────────┤ │
│ │ 💰 Total Income     │ $4,200  │ $4,500  │ +$300   │ +$300 💚                    │ │
│ │ 💸 Total Expenses   │ $3,200  │ $3,600  │ +$400   │ -$400 🔴                    │ │
│ │ 🔄 Net Transfers    │ -$200   │ -$150   │ +$50    │ +$50 💚                     │ │
│ ├─────────────────────┼─────────┼─────────┼─────────┼─────────────────────────────┤ │
│ │ 💎 Net Savings      │ $800    │ $750    │ -$50    │ -$50 🔴                     │ │
│ │ 📊 Savings Rate     │ 19.0%   │ 16.7%   │ -2.3%   │                             │ │
│ └─────────────────────┴─────────┴─────────┴─────────┴─────────────────────────────┘ │
│                                                                                     │
│ [📊 Export Chart] [📋 Export Data] [🎯 Set Savings Goal] [📧 Email Report]        │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### **Mobile Layout (Stacked)**
```
┌─────────────────────────┐
│ 💰 Savings Analysis     │
├─────────────────────────┤
│ Current: $750 (-$50)    │
│ Rate: 16.7% (-2.3%)     │
├─────────────────────────┤
│                         │
│   [Simplified Chart]    │
│                         │
├─────────────────────────┤
│ What Changed:           │
│ 💰 Income: +$300        │
│ 💸 Expenses: -$400      │
│ 🔄 Transfers: +$50      │
├─────────────────────────┤
│ 💡 Key Insight:         │
│ Dining out increased    │
│ by $180 this month      │
├─────────────────────────┤
│ [View Full Report]      │
│ [Export] [Set Goal]     │
└─────────────────────────┘
```

#### **Interactive Features**
- **Chart Hover**: Show detailed breakdown for each period
- **Click on Areas**: Drill down to category-level details
- **Period Selection**: Brush selection for custom date ranges
- **Comparison Toggle**: Switch between different comparison modes
- **Export Options**: PNG, PDF, CSV formats
- **Goal Setting**: Modal dialog for setting/updating savings targets

### **Goal Setting Wizard Integration**

#### **Data-Driven Goal Creation**
The savings trend report serves as the primary entry point for setting realistic financial goals by providing users with their actual savings capacity data.

#### **Goal Setting Wizard Flow**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🎯 Set Your Savings Goal                                       │
├─────────────────────────────────────────────────────────────────┤
│ Based on your savings history:                                 │
│                                                                 │
│ 📊 Your Savings Capacity:                                      │
│ • Average Monthly Savings: $675                                │
│ • Best Month: $1,200 (March)                                   │
│ • Worst Month: $150 (August)                                   │
│ • Consistency Score: 72% (Good)                                │
│                                                                 │
│ 🎯 Goal Type:                                                  │
│ ○ Emergency Fund (3-6 months expenses)                         │
│ ○ Debt Payoff (Credit cards, loans)                           │
│ ○ Retirement Savings (401k, IRA)                              │
│ ○ Major Purchase (House, car, vacation)                       │
│ ○ Custom Goal                                                  │
│                                                                 │
│ 💰 Goal Details:                                               │
│ Target Amount: [$_____] (e.g., $10,000)                       │
│ Target Date: [MM/YYYY] (e.g., 12/2025)                        │
│                                                                 │
│ 🔍 Feasibility Analysis:                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✅ ACHIEVABLE                                               │ │
│ │                                                             │ │
│ │ Required: $625/month for 16 months                         │ │
│ │ Your Average: $675/month                                    │ │
│ │ Buffer: $50/month (8% cushion)                             │ │
│ │                                                             │ │
│ │ 💡 Tips to Stay on Track:                                  │ │
│ │ • Your best savings months are Mar-May                     │ │
│ │ • Watch dining expenses in summer months                   │ │
│ │ • Consider automatic transfers of $625/month               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Cancel] [Save Goal & Track Progress]                          │
└─────────────────────────────────────────────────────────────────┘
```

#### **Goal Types & Smart Defaults**

**Emergency Fund Goals:**
- Automatically calculate 3-6 months of average expenses
- Show timeline based on current savings rate
- Highlight importance of consistency

**Debt Payoff Goals:**
- Calculate payoff timeline with current savings capacity
- Show interest savings from faster payoff
- Suggest optimal payment strategy

**Retirement Goals:**
- Use age and income to suggest contribution amounts
- Show compound growth projections
- Integrate with existing retirement accounts

**Major Purchase Goals:**
- Break down large purchases into monthly savings targets
- Show impact on other financial goals
- Suggest timeline adjustments based on savings patterns

#### **Feasibility Indicators**
```typescript
interface GoalFeasibility {
  status: 'achievable' | 'challenging' | 'unrealistic'
  requiredMonthlySavings: number
  userAverageSavings: number
  confidenceScore: number // 0-100
  recommendations: string[]
  alternativeTimelines?: {
    conservative: { months: number, monthlySavings: number }
    aggressive: { months: number, monthlySavings: number }
  }
}
```

#### **Integration with Existing Goals**
- Show how new goals impact existing savings targets
- Suggest priority adjustments when goals conflict
- Display total savings commitment vs. capacity
- Warn when combined goals exceed realistic savings rate

### **Assumptions**
- [Assumption 1]: [Impact if wrong]
- [Assumption 2]: [Impact if wrong]

---

## 🔄 **Review & Approval**

### **Planning Review Checklist**
- [ ] Goal is clear and valuable
- [ ] Scope is well-defined
- [ ] Dependencies are identified
- [ ] Estimates seem reasonable
- [ ] Success criteria are testable
- [ ] Risks are identified with mitigation plans

### **Approval**
- [ ] **Planning Approved**: [Date] - Ready to start development
- [ ] **Priority Confirmed**: [High/Medium/Low] - [Rationale]

---

*Copy this template for each new feature and fill it out completely before starting development.*
