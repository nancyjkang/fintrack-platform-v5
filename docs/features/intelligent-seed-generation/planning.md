# Feature: Intelligent Seed Generation

**Created**: 2025-09-16
**Estimated Start**: 2025-09-16
**Priority**: Medium
**Status**: ✅ **COMPLETED** (September 16, 2025)

## 📊 **Implementation Results**

- **Generated Data**: 1,220 transactions + 90 transfers (with accounting fixes)
- **Avatar**: Young Professional persona
- **Date Range**: July 1, 2024 to September 16, 2025 (today)
- **Database**: Local PostgreSQL (`fintrack_dev`)
- **Usage**: `npm run seed:generate`
- **Documentation**: [Usage Guide](./USAGE_GUIDE.md)

### **🔧 Accounting Fixes Applied** (September 16, 2025)
- ✅ **Math.abs() Corrections**: Removed from calculations, proper signed arithmetic
- ✅ **Transfer Categories**: Emergency Fund, Roth IRA, Credit Card Payment (not "System Transfer")
- ✅ **Amount Preservation**: Database values maintain proper signs throughout
- ✅ **Accounting Integrity**: All transfers net to $0.00, paired transactions verified

---

## 🎯 **Goal**
Replace static seed data with an intelligent, configurable system that generates realistic financial data based on user-specified parameters. This solves the problem of having outdated, unrealistic demo data and provides developers with flexible testing scenarios.

## 👥 **User Impact**
Developers and testers can generate realistic financial scenarios for testing, demos, and development. Users will see more believable demo data that reflects real-world financial patterns.

**User Story**: As a developer, I want to generate realistic financial data with configurable date ranges and categories so that I can test different scenarios and create compelling demos.

---

## 📊 **Scope Definition**

### **✅ Must Have (Core Functionality)** - ✅ **COMPLETED**
- [x] JSON configuration file (seed-config.json) with date range and category selection
- [x] Avatar/persona system with 1 predefined user type (young-professional) - expandable
- [x] Realistic transaction description and amount generation based on avatar and category type
- [x] Transfer transactions between accounts (2 linked transactions per transfer)
- [x] Configurable account types and initial balances via JSON config
- [x] User/tenant creation with proper multi-tenant isolation
- [x] Integration with existing Prisma schema and seed system

### **⚡ Should Have (Important)** - ✅ **PARTIALLY COMPLETED**
- [x] Realistic spending frequency patterns (daily coffee vs monthly rent)
- [ ] Seasonal spending adjustments (holidays, summer vacation)
- [x] Recurring transaction generation (salary, bills, subscriptions)
- [ ] Account balance reconciliation over time
- [ ] CLI parameter support (--config=path/to/config.json)

### **💡 Nice to Have (If Time Permits)**
- [ ] Credit card payment automation between accounts
- [ ] Goal-based spending patterns (saving for vacation, etc.)
- [ ] Export generated data to CSV for analysis
- [ ] Additional avatar types (entrepreneur, single-parent, etc.)
- [ ] Performance optimization for large date ranges

### **❌ Out of Scope (For This Version)**
- AI/ML-powered pattern generation (too complex for v1)
- Real bank data import simulation (separate feature)
- Advanced investment account modeling (focus on basic accounts)
- Multi-currency support (USD only for now)

---

## 🔗 **Dependencies**

### **Prerequisites (Must be done first)**
- [x] Existing Prisma schema with multi-tenant support - Already implemented
- [x] Default categories system (docs/reference/default-categories.ts) - Already exists
- [x] Date utilities (src/lib/utils/date-utils.ts) - Already implemented
- [ ] None - This is a standalone development tool

### **Dependent Features (Blocked by this)**
- Better demo experiences - Will have more realistic data for showcasing
- Performance testing - Will enable testing with larger, realistic datasets
- User onboarding - Can provide better initial experience with realistic data

---

## 🛠️ **Technical Approach**

### **Database Changes**
- [ ] No new tables required - Uses existing schema
- [ ] No schema updates needed - Works with current structure
- [ ] Migration required: No - Pure data generation tool

### **API Endpoints Needed**
- [ ] No API endpoints required - This is a CLI/script tool
- [ ] Uses existing Prisma client for database operations

### **UI Components**
- [ ] No UI components - CLI-based tool
- [ ] Future: Could add web interface for configuration

### **Third-party Integrations**
- Existing Prisma Client - Database operations
- Existing date-utils - Date manipulation and UTC handling
- bcrypt - Password hashing for generated users (already in use)

### **Configuration System Design**

#### **JSON Configuration File Structure**
The system will use a `seed-config.json` file with the following structure:

```json
{
  "dateRange": {
    "startDate": "2024-07-01",
    "endDate": "today"
  },
  "categories": [
    {
      "name": "Salary",
      "type": "INCOME"
    },
    {
      "name": "Food & Dining",
      "type": "EXPENSE"
    },
    {
      "name": "Housing",
      "type": "EXPENSE"
    },
    {
      "name": "Bills & Utilities",
      "type": "EXPENSE"
    },
    {
      "name": "Fun Money",
      "type": "EXPENSE"
    }
  ],
  "accounts": {
    "checking": {
      "name": "Main Checking",
      "initialBalance": 2500,
      "type": "CHECKING"
    },
    "savings": {
      "name": "Emergency Fund",
      "initialBalance": 10000,
      "type": "SAVINGS"
    },
    "credit": {
      "name": "Credit Card",
      "initialBalance": -500,
      "type": "CREDIT"
    }
  },
  "patterns": {
    "transactionFrequency": "realistic",
    "seasonalAdjustments": true,
    "recurringTransactions": true
  },
  "transfers": {
    "enabled": true,
    "types": [
      {
        "name": "Credit Card Payment",
        "fromAccount": "checking",
        "toAccount": "credit",
        "frequency": "monthly",
        "amount": "variable"
      },
      {
        "name": "Emergency Fund Contribution",
        "fromAccount": "checking",
        "toAccount": "savings",
        "frequency": "monthly",
        "amount": 500
      }
    ]
  },
  "user": {
    "email": "demo@fintrack.com",
    "name": "Demo User",
    "tenantName": "Demo Household",
    "avatar": "young-professional"
  }
}
```

#### **Avatar/Persona System**
The `avatar` field determines spending patterns, income levels, and financial behaviors:

**Available Avatars:**
- **`young-professional`**: Recent graduate, $60-80k salary, urban lifestyle, tech-savvy spending
- **`family-household`**: Dual income family, $80-120k combined, child expenses, suburban lifestyle
- **`college-student`**: Part-time income, $15-25k, budget-conscious, irregular spending
- **`retiree`**: Fixed income, $40-60k, healthcare focus, conservative spending
- **`freelancer`**: Variable income, $35-70k, irregular payments, business expenses
- **`high-earner`**: Professional, $120k+, luxury spending, investment focus

**Avatar Influences:**
- **Income patterns**: Salary amounts, frequency, bonuses
- **Spending categories**: Category preferences and amounts
- **Account types**: Appropriate account mix for persona
- **Transfer patterns**: Savings rates, investment contributions
- **Transaction descriptions**: Realistic merchant names and descriptions

**Merchant Variety Examples:**
```javascript
// Food & Dining (20 merchants)
["Whole Foods Market", "Starbucks", "DoorDash", "Chipotle", "Trader Joe's",
 "In-N-Out Burger", "Sweetgreen", "Uber Eats", "McDonald's", "Panera Bread", ...]

// Fun Money (21 merchants)
["Netflix", "Amazon", "Target", "AMC Theaters", "Apple App Store", "Steam",
 "Nordstrom", "Zara", "Local Bar", "Concert Venue", ...]

// Services (12 merchants)
["Uber", "Lyft", "Great Clips", "Car Wash", "Auto Repair Shop", "DMV Fees", ...]
```

**Benefits:**
- **Natural Variety**: Random merchant selection creates realistic spending patterns
- **No Fixed Budgets**: Flexible amounts based on merchant type and avatar behavior
- **Realistic Names**: Actual brand names and common business types
- **Scalable**: Easy to add more merchants for different avatar types

#### **Intelligent Date System**
The system supports both static dates and intelligent date values:

**Static Dates**: `"2024-07-01"` (ISO format)

**Intelligent Date Values**:
- **`"today"`**: Current date when script runs
- **`"yesterday"`**: One day before current date
- **Relative Dates**:
  - `"-30days"`: 30 days ago from today
  - `"-6months"`: 6 months ago from today
  - `"-1year"`: 1 year ago from today
  - `"+7days"`: 7 days from today (future dates)

**Examples**:
```json
{
  "dateRange": {
    "startDate": "-6months",  // 6 months ago
    "endDate": "today"        // Up to current date
  }
}

{
  "dateRange": {
    "startDate": "2024-01-01", // Fixed start date
    "endDate": "today"         // Dynamic end date
  }
}
```

**Benefits**:
- **Always Current**: Seed data stays up-to-date automatically
- **Flexible Testing**: Easy to generate data for different time periods
- **Demo Ready**: Perfect for live demos with current data

#### **Configuration Defaults**
- **Default config location**: `prisma/seed-config.json`
- **Fallback behavior**: If no config file exists, use current hardcoded defaults
- **Validation**: Schema validation for required fields and data types
- **Date Resolution**: Intelligent dates resolved at runtime using UTC

#### **Usage**
```bash
# Use default config (prisma/seed-config.json)
npm run seed:generate

# Use custom config location (Should Have feature)
npm run seed:generate --config=custom-config.json
```

#### **Transfer Transaction Implementation**
Transfer transactions will be implemented as **paired transactions** to maintain double-entry accounting principles:

**Example: Credit Card Payment ($300)**
```javascript
// Transaction 1: Debit from checking account
{
  account_id: checkingAccount.id,
  category_id: creditCardPaymentCategory.id,
  amount: -300.00,
  description: "Credit Card Payment",
  type: "TRANSFER",
  transfer_pair_id: "unique-transfer-id"
}

// Transaction 2: Credit to credit card account
{
  account_id: creditCardAccount.id,
  category_id: creditCardPaymentCategory.id,
  amount: 300.00,
  description: "Credit Card Payment",
  type: "TRANSFER",
  transfer_pair_id: "unique-transfer-id"
}
```

**Transfer Types Supported:**
- **Fixed Amount**: Exact amount specified in config (e.g., $500 monthly savings)
- **Variable Amount**: Calculated based on account balances or spending patterns
- **Percentage**: Percentage of account balance or income
- **Frequency**: Daily, weekly, monthly, or custom intervals

---

## ⏱️ **Estimates**

### **Complexity Assessment**
- **Overall Complexity**: Medium-High
- **Core Script Development**: 4 hours - JSON config parsing, basic pattern generation
- **Avatar/Persona System**: 4 hours - 6 avatar types with realistic patterns and data
- **Pattern Intelligence**: 6 hours - Realistic amounts, frequencies, seasonal adjustments
- **Transfer System**: 3 hours - Paired transaction logic, balance reconciliation
- **Configuration System**: 2 hours - JSON schema validation, file parsing
- **Testing & Polish**: 5 hours - Edge cases, avatar validation, transfer validation, documentation

### **Time Estimate**
- **Total Estimate**: 3 days (24 hours)
- **Buffer (20%)**: 0.6 days (5 hours)
- **Final Estimate**: 3.5 days

### **Risk Assessment**
- **Risk Level**: Low
- **Main Risks**:
  - Pattern complexity: Could get too detailed and slow development - Mitigation: Start simple, iterate
  - Performance with large date ranges: Could be slow - Mitigation: Batch operations, progress tracking

---

## ✅ **Success Criteria**

### **Functional Requirements**
- [ ] Reads seed-config.json with date range (startDate, endDate)
- [ ] Supports intelligent date values: "today", "yesterday", relative dates like "-30days"
- [ ] Supports categories array with name and type specification for each category
- [ ] Validates category types (INCOME, EXPENSE, TRANSFER) match transaction generation logic
- [ ] Generates avatar-based realistic transaction patterns (amounts, descriptions, frequencies)
- [ ] Creates transfer transactions as paired transactions (debit from source, credit to destination)
- [ ] Supports configurable transfer types with frequency and amount patterns
- [ ] Adapts account types and balances based on user avatar/persona
- [ ] Creates proper user/tenant/membership relationships from config
- [ ] Maintains account balance integrity over the date range including transfers
- [ ] Validates JSON configuration schema and provides helpful error messages

### **Performance Requirements**
- [ ] Generates 6 months of data in < 30 seconds
- [ ] Handles date ranges up to 2 years without memory issues
- [ ] Shows progress for operations taking > 5 seconds

### **Quality Requirements**
- [ ] All generated data passes Prisma validation
- [ ] No TypeScript errors in the script
- [ ] Comprehensive CLI help and examples
- [ ] Error handling for invalid date ranges and missing categories

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
- [Question 1]: [Context and options]
- [Question 2]: [Context and options]

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
