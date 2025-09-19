# v5.1 Merchant Field Migration

This release adds merchant parsing functionality to FinTrack v5, enabling merchant-based tooltips in the trends analysis feature.

## 🎯 **Overview**

The merchant field migration adds:
- `merchant` field to the `transactions` table
- `merchant_name` field to the `financial_cube` table
- Automatic parsing of transaction descriptions to extract merchant names
- Performance indexes for fast merchant-based queries
- Tooltip functionality showing merchant breakdowns in trends analysis

## 📁 **Files Included**

### 1. `add_merchant_field_migration.sql`
- **Purpose**: Complete SQL migration script
- **Usage**: Run directly on PostgreSQL database
- **Features**:
  - Adds merchant fields to both tables
  - Creates performance indexes
  - Includes merchant parsing function
  - Populates existing transactions with merchant data
  - Provides verification queries

### 2. `merchant-field-migration.ts`
- **Purpose**: TypeScript implementation for application integration
- **Usage**: Import into Node.js/Next.js application
- **Features**:
  - `extractMerchantName()` function for ongoing parsing
  - `populateMerchantFields()` for batch migration
  - `getMerchantStatistics()` for reporting
  - Test cases and validation

### 3. `MERCHANT_FIELD_MIGRATION.md` (this file)
- **Purpose**: Documentation and usage instructions

## 🚀 **Migration Steps**

### Option A: SQL Migration (Recommended for Production)

1. **Backup your database** (always backup before migrations!)
   ```bash
   pg_dump your_database > backup_before_merchant_migration.sql
   ```

2. **Run the SQL migration**
   ```bash
   psql -d your_database -f add_merchant_field_migration.sql
   ```

3. **Verify the results**
   - Check the verification queries output
   - Ensure merchant coverage is reasonable (typically 70-90%)

### Option B: Application-Based Migration

1. **Copy the TypeScript file** to your project
   ```bash
   cp merchant-field-migration.ts src/lib/migrations/
   ```

2. **Create a migration script**
   ```typescript
   import { PrismaClient } from '@prisma/client'
   import { runMerchantMigration } from './lib/migrations/merchant-field-migration'

   const prisma = new PrismaClient()

   async function main() {
     await runMerchantMigration(prisma)
   }

   main().catch(console.error).finally(() => prisma.$disconnect())
   ```

3. **Run the migration**
   ```bash
   npx tsx migration-script.ts
   ```

## 🔍 **Merchant Parsing Logic**

The merchant extraction follows these rules:

### 1. **Cleanup Steps**
- Remove transaction prefixes (PURCHASE, PAYMENT, DEBIT, etc.)
- Remove card processor prefixes (VISA, MC, AMEX, etc.)
- Remove dates, reference numbers, store numbers
- Remove location codes and corporate suffixes
- Clean up whitespace and convert to title case

### 2. **Special Cases**
- **Walmart**: All "WAL*MART" variations → "Walmart"
- **Target**: All "TARGET" variations → "Target"
- **Amazon**: All "AMAZON" variations → "Amazon"
- **Starbucks**: All "STARBUCKS" variations → "Starbucks"
- **McDonald's**: "MCD" or "MCDONALDS" → "McDonald's"
- **Gas Stations**: Shell, Chevron, ExxonMobil standardization
- **Grocery**: Safeway, Kroger standardization

### 3. **Quality Filters**
- Rejects results shorter than 2 characters
- Rejects generic terms (N/A, UNKNOWN, MISC, OTHER)
- Returns `null` for unparseable descriptions

## 📊 **Expected Results**

### Typical Coverage Rates
- **Credit Card Transactions**: 85-95% (detailed merchant info)
- **Debit Card Transactions**: 80-90% (good merchant info)
- **ACH/Wire Transfers**: 30-50% (often generic descriptions)
- **Cash/Check Transactions**: 10-30% (manual entry dependent)

### Common Merchant Examples
```
Input: "PURCHASE WALMART SUPERCENTER #1234 ANYTOWN CA 12/15"
Output: "Walmart"

Input: "POS DEBIT STARBUCKS STORE #5678 SEATTLE WA"
Output: "Starbucks"

Input: "AMAZON.COM AMZN.COM/BILL WA REF#ABC123456"
Output: "Amazon"
```

## 🧪 **Testing & Validation**

### 1. **Run Test Cases**
```typescript
import { testMerchantParsing } from './merchant-field-migration'
testMerchantParsing() // Runs built-in test cases
```

### 2. **Check Coverage**
```sql
-- Get merchant coverage statistics
SELECT
    COUNT(*) as total_transactions,
    COUNT(merchant) as transactions_with_merchants,
    ROUND(COUNT(merchant) * 100.0 / COUNT(*), 2) as coverage_percent
FROM transactions;
```

### 3. **Review Top Merchants**
```sql
-- See most common merchants
SELECT merchant, COUNT(*) as transaction_count
FROM transactions
WHERE merchant IS NOT NULL
GROUP BY merchant
ORDER BY COUNT(*) DESC
LIMIT 20;
```

## 🔧 **Integration with Application**

### 1. **Update Transaction Creation**
```typescript
import { extractMerchantName } from './lib/migrations/merchant-field-migration'

// When creating new transactions
const merchant = extractMerchantName(transactionData.description)
await prisma.transaction.create({
  data: {
    ...transactionData,
    merchant
  }
})
```

### 2. **Update Financial Cube Population**
Include merchant aggregation in cube generation logic to enable tooltip functionality.

### 3. **Implement Tooltip Feature**
Use the merchant data to show detailed breakdowns when hovering over amounts in the trends table.

## 🚨 **Important Notes**

### Performance Considerations
- Migration processes transactions in batches (1000 at a time)
- Includes small delays to avoid overwhelming the database
- Creates indexes concurrently to minimize downtime

### Data Quality
- Merchant parsing is best-effort; not all transactions will have merchants
- Manual review of top merchants recommended after migration
- Consider creating merchant aliases/mappings for better consistency

### Rollback Plan
```sql
-- If you need to rollback the migration
ALTER TABLE transactions DROP COLUMN IF EXISTS merchant;
ALTER TABLE financial_cube DROP COLUMN IF EXISTS merchant_name;
DROP INDEX IF EXISTS transactions_tenant_id_merchant_idx;
DROP INDEX IF EXISTS financial_cube_tenant_merchant_period_idx;
```

## 📈 **Next Steps After Migration**

1. **Verify Results**: Check coverage and accuracy of merchant parsing
2. **Implement Tooltips**: Add hover functionality to trends table
3. **Update Cube Logic**: Include merchant aggregation in financial cube
4. **Monitor Performance**: Ensure new indexes are being used effectively
5. **Refine Parsing**: Add more merchant standardization rules as needed

## 🐛 **Troubleshooting**

### Low Merchant Coverage
- Review unparsed transaction samples
- Add more parsing rules for your specific data patterns
- Consider manual merchant assignment for important transactions

### Performance Issues
- Ensure indexes are created successfully
- Monitor query performance with `EXPLAIN ANALYZE`
- Consider running migration during low-traffic periods

### Parsing Accuracy Issues
- Review top merchants for inconsistencies
- Add more standardization rules in the parsing function
- Create merchant alias mappings for variations

---

**Migration Status**: Ready for deployment
**Estimated Time**: 5-15 minutes depending on transaction volume
**Risk Level**: Low (adds new fields, doesn't modify existing data)
