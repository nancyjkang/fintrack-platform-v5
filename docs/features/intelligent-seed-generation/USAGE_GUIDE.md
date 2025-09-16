# Intelligent Seed Generation - Usage Guide

## 🎯 **Overview**

The intelligent seed generation system creates realistic financial data based on configurable JSON parameters. It generates transactions, accounts, categories, and users with realistic patterns based on avatar personas.

## ✅ **Current Status**

- **Implementation**: ✅ **COMPLETED** (September 16, 2025)
- **Generated Data**: 1,084 transactions + 90 transfers
- **Avatar**: Young Professional persona
- **Date Range**: July 1, 2024 to September 16, 2025 (today)
- **Database**: Local PostgreSQL (`fintrack_dev`)

---

## 🚀 **How to Regenerate Seed Data**

### **Step 1: Navigate to Project Directory**
```bash
cd fintrack-platform-v5
```

### **Step 2: Clear Existing Data (Optional)**
If you want to start fresh, clear the existing seed data:

```bash
# Reset the database (WARNING: This will delete ALL data)
npm run db:reset

# Or manually delete specific tenant data
psql -d fintrack_dev -c "DELETE FROM transactions WHERE tenant_id = 'demo-tenant';"
psql -d fintrack_dev -c "DELETE FROM accounts WHERE tenant_id = 'demo-tenant';"
psql -d fintrack_dev -c "DELETE FROM categories WHERE tenant_id = 'demo-tenant';"
psql -d fintrack_dev -c "DELETE FROM memberships WHERE tenant_id = 'demo-tenant';"
psql -d fintrack_dev -c "DELETE FROM tenants WHERE id = 'demo-tenant';"
```

### **Step 3: Configure Seed Parameters**
Edit the configuration file to customize your seed data:

```bash
# Edit the seed configuration
code prisma/seed-config.json
```

### **Step 4: Generate New Seed Data**
Run the intelligent seed generator:

```bash
npm run seed:generate
```

### **Step 5: Verify Generated Data**
Check the generated data in Prisma Studio:

```bash
npm run db:studio
```

Or query directly:
```bash
psql -d fintrack_dev -c "SELECT COUNT(*) FROM transactions WHERE tenant_id = 'demo-tenant';"
psql -d fintrack_dev -c "SELECT COUNT(*) FROM accounts WHERE tenant_id = 'demo-tenant';"
```

---

## ⚙️ **Configuration Options**

### **Date Range Configuration**
```json
{
  "dateRange": {
    "startDate": "2024-07-01",     // ISO date or intelligent date
    "endDate": "today"             // "today", "yesterday", "-6months", "+30days"
  }
}
```

**Intelligent Date Examples:**
- `"today"` - Current date
- `"yesterday"` - Previous day
- `"-6months"` - 6 months ago
- `"+30days"` - 30 days from now
- `"2024-01-01"` - Specific ISO date

### **Avatar/Persona Configuration**
```json
{
  "user": {
    "avatar": "young-professional"  // Currently available: young-professional
  }
}
```

**Available Avatars:**
- `young-professional`: Tech worker, $65-75K salary, moderate spending

### **Account Configuration**
```json
{
  "accounts": {
    "checking": {
      "name": "Main Checking",
      "initialBalance": 3200,
      "type": "CHECKING",
      "color": "#3B82F6"
    }
  }
}
```

### **Category Configuration**
```json
{
  "categories": [
    {
      "name": "Salary",
      "type": "INCOME"
    },
    {
      "name": "Food & Dining",
      "type": "EXPENSE"
    }
  ]
}
```

### **Transfer Configuration**
```json
{
  "transfers": {
    "enabled": true,
    "types": [
      {
        "name": "Credit Card Payment",
        "fromAccount": "checking",
        "toAccount": "credit",
        "frequency": "monthly",
        "amount": "variable",
        "description": "Monthly credit card payment"
      }
    ]
  }
}
```

---

## 🎲 **Generated Data Details**

### **Transaction Patterns**
- **Frequency**: 0-5 transactions per day (realistic variety)
- **Amounts**: Category-appropriate ranges (e.g., coffee $4-8, rent $1800-2500)
- **Merchants**: 80+ realistic merchant names per category
- **Types**: Income, Expense, Transfer with proper accounting

### **Account Types**
- **Checking**: Primary spending account
- **Savings**: High-yield savings with regular contributions
- **Credit**: Credit card with monthly payments
- **Investment**: Retirement account (Roth IRA)

### **Transfer System**
- **Paired Transactions**: Each transfer creates 2 transactions (debit + credit)
- **Monthly Frequency**: Recurring transfers like credit card payments
- **Realistic Amounts**: Variable amounts based on spending patterns

---

## 🔧 **Customization Examples**

### **Example 1: Different Date Range**
```json
{
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "-30days"
  }
}
```

### **Example 2: Custom Categories**
```json
{
  "categories": [
    {
      "name": "Freelance Income",
      "type": "INCOME"
    },
    {
      "name": "Business Expenses",
      "type": "EXPENSE"
    }
  ]
}
```

### **Example 3: Different User**
```json
{
  "user": {
    "email": "jane.doe@example.com",
    "name": "Jane Doe",
    "tenantName": "Jane's Finances",
    "avatar": "young-professional"
  }
}
```

---

## 🐛 **Troubleshooting**

### **Database Connection Issues**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if needed
brew services start postgresql

# Check database exists
psql -l | grep fintrack_dev
```

### **Permission Issues**
```bash
# Ensure database user has proper permissions
psql -d fintrack_dev -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fintrack_user;"
```

### **Configuration Errors**
- Verify `prisma/seed-config.json` is valid JSON
- Check that all referenced accounts exist in the config
- Ensure date formats are correct

### **No Data Generated**
- Check console output for errors
- Verify date range is valid (startDate < endDate)
- Ensure at least one category and account are configured

---

## 📊 **Data Verification**

### **Quick Stats Query**
```sql
-- Transaction counts by type
SELECT type, COUNT(*) as count
FROM transactions
WHERE tenant_id = 'demo-tenant'
GROUP BY type;

-- Account balances
SELECT name, balance, type
FROM accounts
WHERE tenant_id = 'demo-tenant';

-- Date range coverage
SELECT
  MIN(date) as earliest_transaction,
  MAX(date) as latest_transaction,
  COUNT(*) as total_transactions
FROM transactions
WHERE tenant_id = 'demo-tenant';
```

### **Expected Results**
- **Transactions**: 800-1200 for 6-month period
- **Transfers**: 30-50 paired transactions
- **Categories**: All configured categories should have transactions
- **Date Coverage**: Should span full configured date range

---

## 🔄 **Regular Maintenance**

### **Monthly Refresh**
Update the configuration to keep data current:

```json
{
  "dateRange": {
    "startDate": "-6months",
    "endDate": "today"
  }
}
```

Then regenerate:
```bash
npm run db:reset && npm run seed:generate
```

### **Testing Different Scenarios**
Create multiple configuration files for different test scenarios:

```bash
# Copy base config
cp prisma/seed-config.json prisma/seed-config-family.json

# Edit for family scenario
# Then generate with different config (future enhancement)
```

---

## 📚 **Related Documentation**

- [Planning Document](./planning.md) - Feature requirements and design
- [Feature Backlog](../../FEATURE_BACKLOG.md) - Project status
- [Database Schema](../../../prisma/schema.prisma) - Data model
- [Deployment Guide](../../deployment/README.md) - Production setup
