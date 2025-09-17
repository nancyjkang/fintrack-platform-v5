# Enhanced Recurring Transactions - Feature Planning

**Feature ID**: enhanced-recurring-transactions
**Priority**: Medium-High (Financial Planning Core Feature)
**Estimate**: 6 days
**Dependencies**: Transaction CRUD ✅, Category Management ✅

---

## 🎯 **Feature Overview**

### **Problem Statement**
Users need to track recurring transactions with specific frequency patterns to:
- **Identify** recurring income and expenses automatically
- **Expect** upcoming transactions based on historical patterns
- **Prepare** for future financial obligations and income
- **Plan** budgets around predictable transaction schedules
- **Detect** when expected recurring transactions are missing or delayed

### **Solution Summary**
Comprehensive recurring transaction system that tracks frequency patterns, predicts future transactions, and helps users manage their recurring financial obligations with smart scheduling and variance detection.

---

## 🔧 **Core Requirements**

### **FR1: Frequency Pattern Management**
**Description**: Track and manage various recurring transaction frequencies

**Acceptance Criteria**:
- Support multiple frequency types: Weekly, Bi-weekly, Monthly, Quarterly, Semi-annually, Annually
- Allow custom frequency patterns (e.g., "Every 3 months", "Every 45 days")
- Store next expected date for each recurring transaction
- Handle frequency changes and updates
- Support start and end dates for recurring patterns

**User Stories**:
- As a user, I want to mark my salary as "Monthly" recurring so I can expect it every month
- As a user, I want to set my car insurance as "Semi-annually" so I can prepare for the payment
- As a user, I want to mark quarterly tax payments so I don't forget them

### **FR2: Future Transaction Forecasting**
**Description**: Predict and display upcoming recurring transactions

**Acceptance Criteria**:
- Generate forecast of upcoming transactions for next 3, 6, and 12 months
- Show expected dates and amounts for each recurring transaction
- Allow users to view upcoming transactions in calendar format
- Provide cash flow projections based on recurring patterns
- Handle date adjustments for weekends/holidays

**User Stories**:
- As a user, I want to see all my expected transactions for the next 3 months
- As a user, I want to know when my next rent payment is due
- As a user, I want to see my projected cash flow including all recurring items

### **FR3: Variance Detection and Alerts**
**Description**: Detect when recurring transactions deviate from expected patterns

**Acceptance Criteria**:
- Alert when expected recurring transaction is overdue
- Detect amount variations in recurring transactions
- Notify when recurring pattern appears to have changed
- Allow users to confirm or adjust recurring patterns
- Track accuracy of recurring transaction predictions

**User Stories**:
- As a user, I want to be notified if my salary is late
- As a user, I want to know if my utility bill amount has changed significantly
- As a user, I want to confirm when a recurring transaction pattern changes

### **FR4: Template Management**
**Description**: Create and manage recurring transaction templates

**Acceptance Criteria**:
- Create templates from existing transactions
- Pre-populate transaction details from templates
- Support template categories and descriptions
- Allow template modifications without affecting existing transactions
- Enable bulk creation of recurring transactions from templates

**User Stories**:
- As a user, I want to create a template for my monthly rent payment
- As a user, I want to quickly add a new recurring expense using a template
- As a user, I want to update my salary template when I get a raise

---

## 🏗️ **Technical Implementation**

### **Database Schema Updates**

#### **Design Philosophy: Simplified Approach**
This implementation uses a **simplified schema** that avoids the complexity of a separate `recurring_transaction_history` table. Instead, we track basic variance information directly in the `recurring_patterns` table. This approach:

- ✅ **Covers 80% of use cases** with much simpler implementation
- ✅ **Easier to maintain** and understand
- ✅ **Still provides core functionality**: overdue detection, basic variance tracking, pattern adjustments
- ✅ **Extensible**: Can add history table later if advanced analytics are needed

#### **Enhanced Transaction Table**
```sql
-- Add recurring fields to existing transactions table
ALTER TABLE transactions ADD COLUMN is_recurring BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN recurring_pattern_id INTEGER REFERENCES recurring_patterns(id);
```

#### **New Recurring Patterns Table**
```sql
CREATE TABLE recurring_patterns (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(30) NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL, -- "Monthly Salary", "Quarterly Taxes"
  description TEXT,

  -- Pattern Definition
  frequency_type VARCHAR(20) NOT NULL, -- 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annually', 'annually', 'custom'
  frequency_value INTEGER DEFAULT 1, -- For custom frequencies (e.g., every 3 months = 3)
  frequency_unit VARCHAR(20), -- 'days', 'weeks', 'months', 'years' for custom frequencies

  -- Transaction Template
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  category_id INTEGER REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'INCOME', 'EXPENSE', 'TRANSFER'
  description_template VARCHAR(255),

  -- Schedule Information
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for indefinite
  next_expected_date DATE NOT NULL,
  last_generated_date DATE,

  -- Simple Variance Tracking
  last_variance_days INTEGER DEFAULT 0, -- Days variance from last occurrence
  last_variance_amount DECIMAL(12,2) DEFAULT 0.00, -- Amount variance from last occurrence
  consecutive_late_count INTEGER DEFAULT 0, -- Track consecutive late occurrences
  amount_variance_threshold DECIMAL(5,2) DEFAULT 10.00, -- Percentage threshold for amount alerts
  date_variance_threshold INTEGER DEFAULT 3, -- Days threshold for date alerts

  -- Status and Metadata
  is_active BOOLEAN DEFAULT true,
  auto_generate BOOLEAN DEFAULT false, -- Whether to auto-create transactions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_tenant_active (tenant_id, is_active),
  INDEX idx_next_expected (next_expected_date),
  INDEX idx_frequency (frequency_type)
);
```


### **API Endpoints**

#### **Recurring Patterns Management**
```typescript
// GET /api/recurring-patterns - List all recurring patterns
// POST /api/recurring-patterns - Create new recurring pattern
// GET /api/recurring-patterns/:id - Get specific pattern
// PUT /api/recurring-patterns/:id - Update pattern
// DELETE /api/recurring-patterns/:id - Delete pattern (with cleanup options)

// POST /api/recurring-patterns/:id/generate - Generate next transaction
// GET /api/recurring-patterns/:id/forecast - Get future predictions
// POST /api/recurring-patterns/:id/adjust - Adjust pattern based on variance
```

#### **Forecasting and Planning**
```typescript
// GET /api/recurring-transactions/forecast?months=3 - Get upcoming transactions
// GET /api/recurring-transactions/calendar?start=2025-01&end=2025-03 - Calendar view
// GET /api/recurring-transactions/cash-flow?period=monthly - Cash flow projections
// GET /api/recurring-transactions/overdue - Get overdue patterns
```

### **Frontend Components**

#### **RecurringPatternManager.tsx**
- List all recurring patterns with status indicators
- Create/edit recurring pattern forms
- Frequency selection with visual calendar preview
- Template management interface

#### **RecurringTransactionCalendar.tsx**
- Calendar view of upcoming recurring transactions
- Color-coded by category and transaction type
- Click to view details or mark as completed
- Drag-and-drop to adjust expected dates

#### **CashFlowForecast.tsx**
- Chart showing projected income and expenses
- Based on recurring transaction patterns
- Interactive timeline with different forecast periods
- Scenario planning with pattern adjustments

#### **VarianceAlerts.tsx**
- Dashboard widget showing variance alerts
- Overdue recurring patterns
- Amount variance notifications
- Pattern adjustment suggestions based on recent variance

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- Frequency calculation algorithms
- Date generation for various patterns
- Simple variance tracking logic
- Template creation and management
- Overdue pattern detection

### **Integration Tests**
- Recurring pattern CRUD operations
- Transaction generation from patterns
- Forecast calculation accuracy
- Calendar integration
- Variance update when transactions are created

### **Manual Testing Scenarios**
- Create recurring patterns for various frequencies
- Verify forecast accuracy over time
- Test variance tracking with late/early transactions
- Validate overdue pattern detection
- Test pattern adjustment suggestions

---

## 📊 **Success Metrics**

### **User Adoption**
- Percentage of users creating recurring patterns
- Number of recurring patterns per active user
- Forecast accuracy rate (predicted vs actual)

### **Feature Effectiveness**
- Reduction in missed recurring transactions
- Improved budget accuracy through forecasting
- User satisfaction with simple variance tracking and overdue alerts

### **Technical Performance**
- Forecast generation time (<500ms for 12 months)
- Pattern matching accuracy (>95%)
- Calendar view load time (<2 seconds)

---

## 🚀 **Implementation Phases**

### **Phase 1: Core Recurring Patterns (2 days)**
- Database schema implementation
- Basic recurring pattern CRUD
- Frequency calculation engine
- Simple pattern creation UI

### **Phase 2: Forecasting Engine (2 days)**
- Future transaction prediction algorithms
- Cash flow projection calculations
- Forecast API endpoints
- Basic forecast display UI

### **Phase 3: Simple Variance Tracking (1 day)**
- Basic variance calculation and storage
- Overdue pattern detection
- Simple alert system for late patterns
- Variance notification UI

### **Phase 4: Advanced Features (1 day)**
- Calendar view implementation
- Template management system
- Advanced forecasting options
- Performance optimization

---

## 🔮 **Future Enhancements**

### **Advanced Features**
- Machine learning for pattern detection
- Automatic recurring pattern suggestions
- Integration with external calendar systems
- Enhanced variance analytics (could add history table back)

### **Business Intelligence**
- Recurring transaction analytics
- Pattern effectiveness reporting
- Cash flow optimization suggestions
- Advanced variance trend analysis

---

## 💡 **User Experience Flow**

### **Creating a Recurring Pattern**
1. User identifies a recurring transaction (salary, rent, etc.)
2. Clicks "Make Recurring" on transaction or creates new pattern
3. Selects frequency (monthly, quarterly, etc.)
4. Sets start date and optional end date
5. Configures variance thresholds
6. Enables auto-generation if desired
7. Pattern is created and next expected date calculated

### **Managing Recurring Transactions**
1. User views recurring patterns dashboard
2. Sees upcoming transactions in calendar view
3. Reviews variance alerts and overdue items
4. Adjusts patterns based on changes
5. Views cash flow forecasts for planning

### **Variance Handling**
1. System detects variance when transaction is created (late/early or different amount)
2. Pattern variance fields are updated (last_variance_days, last_variance_amount, consecutive_late_count)
3. User receives notification if variance exceeds thresholds
4. User can adjust pattern expected date/amount based on recent variance
5. System suggests pattern adjustments for consistently late transactions

---

## 🔗 **Integration Points**

### **Transaction CRUD Integration**
- Mark existing transactions as recurring
- Auto-populate transaction forms from patterns
- Link generated transactions to patterns

### **Category Management Integration**
- Use category defaults for recurring patterns
- Support category-based recurring transaction rules
- Auto-categorization for generated transactions

### **Financial Planning Integration**
- Include recurring forecasts in budget planning
- Cash flow analysis with recurring patterns
- Goal tracking with recurring income/expenses

---

**This enhanced recurring transactions feature will transform FinTrack from a passive transaction tracker into an active financial planning tool that helps users anticipate, prepare for, and manage their recurring financial obligations.**
