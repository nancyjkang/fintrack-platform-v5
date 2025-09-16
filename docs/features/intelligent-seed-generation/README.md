# Intelligent Seed Generation Feature

## Overview

The Intelligent Seed Generation feature creates realistic financial data for testing and demonstration purposes. Unlike static seed files, this system generates dynamic, configurable data based on user-specified parameters.

**Status**: ✅ **COMPLETED** (September 16, 2025)

## 📚 **Documentation**

- **[Usage Guide](./USAGE_GUIDE.md)** - Complete guide on how to regenerate seed data
- **[Planning Document](./planning.md)** - Feature requirements and implementation details
- **[Configuration File](../../../prisma/seed-config.json)** - JSON configuration for seed generation

## Features

### 🎯 **Configurable Parameters**
- **Date Range**: Specify how far back to generate transaction history
- **Categories**: Choose which expense/income categories to include
- **Account Types**: Configure different account types and balances
- **Transaction Patterns**: Realistic spending patterns based on category types
- **Recurring Transactions**: Automatic generation of recurring bills and income

### 🧠 **Intelligence Features**
- **Realistic Amounts**: Category-appropriate transaction amounts
- **Seasonal Patterns**: Higher spending during holidays, vacation seasons
- **Frequency Patterns**: Daily coffee vs monthly rent patterns
- **Account Relationships**: Credit card payments, transfers between accounts
- **Balance Calculations**: Maintains realistic account balances over time

## Configuration Options

### Basic Configuration
```typescript
interface SeedConfig {
  // Date range for transaction generation
  dateRange: {
    startDate: Date;
    endDate: Date;
  };

  // Categories to include (from default-categories.ts)
  categories: {
    income: string[];      // e.g., ['Salary', 'Side Hustle']
    expenses: string[];    // e.g., ['Food & Dining', 'Bills & Utilities']
    transfers: string[];   // e.g., ['Credit Card Payment', 'Roth IRA']
  };

  // Account configuration
  accounts: AccountConfig[];

  // User/tenant information
  user: {
    email: string;
    name: string;
    tenantName: string;
  };
}
```

### Account Configuration
```typescript
interface AccountConfig {
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN';
  netWorthCategory: 'ASSET' | 'LIABILITY' | 'EXCLUDED';
  initialBalance: number;
  color: string;

  // Transaction generation rules
  transactionRules?: {
    primarySpendingAccount?: boolean;  // Main account for expenses
    recurringIncome?: boolean;         // Receives salary/income
    creditCardPayments?: boolean;      // Receives payments from checking
  };
}
```

## Usage Examples

### Example 1: 6-Month Demo Data
```bash
npm run seed:intelligent -- \
  --start-date="2024-07-01" \
  --end-date="2025-01-01" \
  --categories="salary,food-dining,bills-utilities,fun-money" \
  --user-email="demo@fintrack.com" \
  --user-name="Demo User"
```

### Example 2: Full Year with All Categories
```bash
npm run seed:intelligent -- \
  --start-date="2024-01-01" \
  --end-date="2025-01-01" \
  --categories="all" \
  --accounts="checking,savings,credit,investment" \
  --user-email="test@example.com"
```

### Example 3: Custom Configuration File
```bash
npm run seed:intelligent -- --config=./seed-configs/demo-user.json
```

## Generated Data Patterns

### Transaction Frequency by Category
- **Daily**: Coffee shops, gas stations, small purchases
- **Weekly**: Groceries, entertainment, dining out
- **Monthly**: Rent, utilities, subscriptions, salary
- **Quarterly**: Insurance payments, tax payments
- **Annual**: Property taxes, annual subscriptions

### Realistic Amount Ranges
- **Coffee/Small purchases**: $3-15
- **Groceries**: $50-200 per trip
- **Dining out**: $25-100 per meal
- **Utilities**: $80-300 per month
- **Rent/Mortgage**: $1,200-3,500 per month
- **Salary**: $3,000-8,000 per month

### Seasonal Adjustments
- **December**: Higher spending (holidays, gifts)
- **Summer**: Vacation-related expenses
- **Back-to-school**: Education, supplies
- **Tax season**: Tax payments, refunds

## File Structure

```
scripts/
├── intelligent-seed-generator.ts     # Main generator script
├── seed-configs/                     # Configuration templates
│   ├── demo-user.json              # Demo configuration
│   ├── test-user.json              # Test configuration
│   └── full-demo.json              # Comprehensive demo
└── seed-patterns/                   # Transaction pattern definitions
    ├── spending-patterns.ts         # Category-based spending rules
    ├── seasonal-adjustments.ts     # Seasonal spending modifications
    └── recurring-patterns.ts       # Recurring transaction rules
```

## Integration with Existing System

### Compatibility
- ✅ Works with existing Prisma schema
- ✅ Respects multi-tenant architecture
- ✅ Uses existing category system from `docs/reference/default-categories.ts`
- ✅ Maintains referential integrity
- ✅ Compatible with existing seed.ts (can run both)

### Database Safety
- 🔒 **Upsert operations**: Won't duplicate existing data
- 🔒 **Tenant isolation**: Each generated user gets their own tenant
- 🔒 **Rollback support**: Can clean up generated data by tenant ID
- 🔒 **Validation**: Ensures data integrity before insertion

## CLI Commands

### Generate Seed Data
```bash
# Quick demo (last 3 months)
npm run seed:demo

# Custom date range
npm run seed:intelligent --start-date="2024-01-01" --end-date="2025-01-01"

# From configuration file
npm run seed:intelligent --config="./seed-configs/demo-user.json"

# Clean up generated data
npm run seed:cleanup --tenant-id="generated-tenant-123"
```

### Configuration Management
```bash
# List available configurations
npm run seed:list-configs

# Validate configuration file
npm run seed:validate --config="./seed-configs/demo-user.json"

# Generate configuration template
npm run seed:create-config --output="./my-seed-config.json"
```

## Advanced Features

### Custom Transaction Patterns
Users can define custom spending patterns for specific categories:

```typescript
// Custom pattern example
const customPatterns = {
  'Food & Dining': {
    frequency: 'daily',
    amountRange: [15, 85],
    peakDays: ['friday', 'saturday'], // Higher spending on weekends
    seasonalMultiplier: {
      'december': 1.3,  // 30% more during holidays
      'summer': 1.1     // 10% more during summer
    }
  }
};
```

### Balance Reconciliation
The system automatically:
- Calculates running balances for each account
- Ensures credit card payments don't exceed balances
- Maintains realistic account balance trajectories
- Creates balance anchor points for historical accuracy

### Data Export
Generated data can be exported for analysis:
```bash
# Export generated transactions to CSV
npm run seed:export --tenant-id="demo-tenant" --format="csv"

# Export account summaries
npm run seed:export --tenant-id="demo-tenant" --type="accounts" --format="json"
```

## Future Enhancements

### Planned Features
- 🔮 **AI-powered patterns**: Use ML to create even more realistic spending patterns
- 📊 **Goal simulation**: Generate data showing progress toward financial goals
- 🏦 **Bank import simulation**: Mimic real bank CSV import scenarios
- 📱 **Mobile spending patterns**: Different patterns for mobile vs desktop usage
- 🎯 **Budget adherence**: Generate data that shows budget compliance/violations

### Integration Opportunities
- **Testing**: Automated test data generation for different scenarios
- **Demos**: Dynamic demo data for sales presentations
- **Onboarding**: Help new users understand the app with realistic data
- **Performance**: Generate large datasets for performance testing

## Technical Implementation

### Core Components
1. **Configuration Parser**: Handles CLI args and config files
2. **Pattern Engine**: Applies realistic spending patterns
3. **Date Generator**: Creates appropriate transaction dates
4. **Amount Calculator**: Generates realistic amounts per category
5. **Balance Manager**: Maintains account balance integrity
6. **Data Validator**: Ensures generated data meets constraints

### Performance Considerations
- **Batch operations**: Efficient database insertions
- **Memory management**: Streams large datasets
- **Progress tracking**: Shows generation progress for large date ranges
- **Parallel processing**: Generates multiple accounts simultaneously

---

*This feature significantly enhances the development and demonstration experience by providing realistic, configurable financial data that reflects real-world usage patterns.*
