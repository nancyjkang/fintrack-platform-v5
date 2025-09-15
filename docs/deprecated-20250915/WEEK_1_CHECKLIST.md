# Week 1: Foundation & Schema Enhancement - Execution Checklist

## 🎯 **Week 1 Objective**
Set up the foundation for v4.1 → v5 migration with schema updates, development workflow, and migration utilities.

---

## 📋 **Day 1: Schema Analysis & Updates**

### **✅ Task 1.1: Analyze Schema Differences**
```bash
# Compare v4.1 interfaces with v5 Prisma schema
# Files to review:
# - fintrack-platform-v4.1/src/types/core-data.ts
# - fintrack-platform-v5/prisma/schema.prisma
```

**Action Items:**
- [ ] Document v4.1 Transaction interface requirements
- [ ] Document v4.1 Account interface requirements
- [ ] Document v4.1 Category interface requirements
- [ ] Identify missing fields in v5 schema

### **✅ Task 1.2: Update v5 Schema**
```sql
-- Add to prisma/schema.prisma

model Transaction {
  // ... existing fields ...
  recurring     Boolean  @default(false)  // v4.1 compatibility
  // ... rest of model
}

model Account {
  // ... existing fields ...
  balance_date  DateTime?  // v4.1 compatibility - when balance was set
  // ... rest of model
}

model Category {
  // ... existing fields ...
  transaction_type String?  // v4.1 compatibility - INCOME/EXPENSE/TRANSFER
  // ... rest of model
}
```

**Action Items:**
- [ ] Add `recurring` field to Transaction model
- [ ] Add `balance_date` field to Account model
- [ ] Add `transaction_type` field to Category model
- [ ] Run `npx prisma migrate dev --name add-v4-compatibility`
- [ ] Run `npx prisma generate`
- [ ] Test migration on development database

### **✅ Task 1.3: Add Performance Indexes**
```sql
-- Add to migration file
CREATE INDEX idx_transactions_recurring ON transactions(recurring);
CREATE INDEX idx_transactions_date_account ON transactions(date, account_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_categories_transaction_type ON categories(transaction_type);
```

**Action Items:**
- [ ] Add indexes for v4.1 query patterns
- [ ] Test query performance with indexes
- [ ] Document index rationale

---

## 📋 **Day 2: Development Workflow Setup**

### **✅ Task 2.1: Create Migration Branch Strategy**
```bash
# Create main migration branch
git checkout -b migration/v4-to-v5-integration
git push -u origin migration/v4-to-v5-integration

# Create component-specific feature branches (as needed)
git checkout -b feature/transactions-engine
git checkout -b feature/account-management
git checkout -b feature/csv-import
```

**Action Items:**
- [ ] Create migration branch
- [ ] Set up branch protection rules
- [ ] Document branching strategy
- [ ] Create PR template for migration features

### **✅ Task 2.2: Setup Testing Framework**
```typescript
// Create: src/__tests__/migration/v4-compatibility.test.ts
import { describe, test, expect } from '@jest/globals';
import { V4ToV5DataMapper } from '@/lib/migration/v4-to-v5-mapper';

describe('v4.1 Compatibility Tests', () => {
  test('v4.1 transaction maps to v5 structure', () => {
    const v4Transaction = {
      id: 1,
      accountId: 1,
      amount: 100.50,
      description: 'Test transaction',
      date: '2025-01-15',
      type: 'EXPENSE',
      categoryId: 1,
      recurring: false,
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z'
    };

    const mapper = new V4ToV5DataMapper();
    const v5Transaction = mapper.mapTransaction(v4Transaction);

    expect(v5Transaction.amount).toBe(100.50);
    expect(v5Transaction.type).toBe('expense'); // lowercase in v5
    expect(v5Transaction.recurring).toBe(false);
  });
});
```

**Action Items:**
- [ ] Create migration test directory
- [ ] Set up v4.1 compatibility tests
- [ ] Configure Jest for migration tests
- [ ] Create test data fixtures

### **✅ Task 2.3: Component Porting Checklist Template**
```markdown
# Component Porting Checklist Template

## Component: [ComponentName]
**Source**: fintrack-platform-v4.1/src/components/[path]
**Target**: fintrack-platform-v5/src/components/[path]

### Pre-Port Analysis
- [ ] Review component dependencies
- [ ] Identify API calls to adapt
- [ ] Note styling patterns to preserve
- [ ] Document props and state structure

### Porting Steps
- [ ] Copy component file to v5
- [ ] Update import paths for v5 structure
- [ ] Replace v4.1 API calls with v5 equivalents
- [ ] Update styling to match v5 patterns
- [ ] Add proper TypeScript types
- [ ] Update component props interface

### Testing
- [ ] Component renders without errors
- [ ] All functionality works as expected
- [ ] API integration works correctly
- [ ] Styling matches v4.1 appearance
- [ ] No TypeScript errors
- [ ] Unit tests pass

### Documentation
- [ ] Update component documentation
- [ ] Document any breaking changes
- [ ] Note performance improvements
- [ ] Update usage examples
```

**Action Items:**
- [ ] Create component porting template
- [ ] Document porting standards
- [ ] Create component inventory list
- [ ] Prioritize components for porting

---

## 📋 **Day 3: Data Migration Utilities**

### **✅ Task 3.1: Create v4.1 Data Interfaces**
```typescript
// Create: src/lib/migration/v4-interfaces.ts
export interface V4Transaction {
  id: number;
  accountId: number;
  amount: number;
  description: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: number | null;
  recurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface V4Account {
  id: number;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'CASH';
  balance: number;
  balanceDate: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface V4Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface V4ExportData {
  accounts: V4Account[];
  transactions: V4Transaction[];
  categories: V4Category[];
  preferences?: any;
  exportDate: string;
  version: string;
}
```

**Action Items:**
- [ ] Create v4.1 TypeScript interfaces
- [ ] Document data structure differences
- [ ] Create validation schemas
- [ ] Add export data interface

### **✅ Task 3.2: Create Data Mapper Utility**
```typescript
// Create: src/lib/migration/v4-to-v5-mapper.ts
import { V4Transaction, V4Account, V4Category } from './v4-interfaces';
import { Prisma } from '@prisma/client';

export class V4ToV5DataMapper {
  mapAccount(v4Account: V4Account, tenantId: string): Prisma.AccountCreateInput {
    return {
      id: `acc_${v4Account.id}`, // Convert number ID to CUID-like
      tenant: { connect: { id: tenantId } },
      name: v4Account.name,
      type: v4Account.type.toLowerCase(),
      current_balance: v4Account.balance,
      balance_date: new Date(v4Account.balanceDate),
      color: v4Account.color,
      is_active: v4Account.isActive,
      created_at: new Date(v4Account.createdAt),
      updated_at: new Date(v4Account.updatedAt)
    };
  }

  mapTransaction(v4Transaction: V4Transaction, accountMap: Map<number, string>, categoryMap: Map<number, string>): Prisma.TransactionCreateInput {
    return {
      id: `txn_${v4Transaction.id}`,
      account: { connect: { id: accountMap.get(v4Transaction.accountId)! } },
      amount: v4Transaction.amount,
      description: v4Transaction.description,
      date: new Date(v4Transaction.date),
      type: v4Transaction.type.toLowerCase() as 'income' | 'expense' | 'transfer',
      category: v4Transaction.categoryId ? { connect: { id: categoryMap.get(v4Transaction.categoryId)! } } : undefined,
      recurring: v4Transaction.recurring,
      created_at: new Date(v4Transaction.createdAt),
      updated_at: new Date(v4Transaction.updatedAt)
    };
  }

  mapCategory(v4Category: V4Category, tenantId: string): Prisma.CategoryCreateInput {
    return {
      id: `cat_${v4Category.id}`,
      tenant: { connect: { id: tenantId } },
      name: v4Category.name,
      transaction_type: v4Category.type,
      color: v4Category.color,
      created_at: new Date(v4Category.createdAt),
      updated_at: new Date(v4Category.updatedAt)
    };
  }
}
```

**Action Items:**
- [ ] Create data mapping utility
- [ ] Handle ID conversion (number → CUID)
- [ ] Map data types correctly
- [ ] Add validation logic

---

## 📋 **Day 4: Data Export Utility**

### **✅ Task 4.1: Create v4.1 Data Exporter**
```typescript
// Create: src/lib/migration/v4-data-exporter.ts
export class V4DataExporter {
  exportLocalStorageData(): V4ExportData {
    // This would run in v4.1 environment to export localStorage data
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    const preferences = JSON.parse(localStorage.getItem('preferences') || '{}');

    return {
      accounts,
      transactions,
      categories,
      preferences,
      exportDate: new Date().toISOString(),
      version: '4.1'
    };
  }

  exportToFile(data: V4ExportData): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-v4-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

**Action Items:**
- [ ] Create localStorage export utility
- [ ] Add data validation
- [ ] Create export file format
- [ ] Test with sample v4.1 data

### **✅ Task 4.2: Create v5 Data Importer**
```typescript
// Create: src/lib/migration/v5-data-importer.ts
import { prisma } from '@/lib/prisma';
import { V4ExportData } from './v4-interfaces';
import { V4ToV5DataMapper } from './v4-to-v5-mapper';

export class V5DataImporter {
  private mapper = new V4ToV5DataMapper();

  async importV4Data(v4Data: V4ExportData, tenantId: string): Promise<ImportResult> {
    // Validate data first
    const validation = this.validateV4Data(v4Data);
    if (!validation.isValid) {
      throw new Error(`Invalid v4.1 data: ${validation.errors.join(', ')}`);
    }

    // Import in transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      // Import accounts first
      const accountMap = new Map<number, string>();
      for (const v4Account of v4Data.accounts) {
        const v5Account = this.mapper.mapAccount(v4Account, tenantId);
        const created = await tx.account.create({ data: v5Account });
        accountMap.set(v4Account.id, created.id);
      }

      // Import categories
      const categoryMap = new Map<number, string>();
      for (const v4Category of v4Data.categories) {
        const v5Category = this.mapper.mapCategory(v4Category, tenantId);
        const created = await tx.category.create({ data: v5Category });
        categoryMap.set(v4Category.id, created.id);
      }

      // Import transactions
      const transactionIds: string[] = [];
      for (const v4Transaction of v4Data.transactions) {
        const v5Transaction = this.mapper.mapTransaction(v4Transaction, accountMap, categoryMap);
        const created = await tx.transaction.create({ data: v5Transaction });
        transactionIds.push(created.id);
      }

      return {
        accountsImported: accountMap.size,
        categoriesImported: categoryMap.size,
        transactionsImported: transactionIds.length,
        accountMap,
        categoryMap,
        transactionIds
      };
    });
  }

  validateV4Data(v4Data: V4ExportData): ValidationResult {
    const errors: string[] = [];

    // Validate required fields
    if (!v4Data.accounts || !Array.isArray(v4Data.accounts)) {
      errors.push('Missing or invalid accounts data');
    }
    if (!v4Data.transactions || !Array.isArray(v4Data.transactions)) {
      errors.push('Missing or invalid transactions data');
    }
    if (!v4Data.categories || !Array.isArray(v4Data.categories)) {
      errors.push('Missing or invalid categories data');
    }

    // Validate data integrity
    const accountIds = new Set(v4Data.accounts?.map(a => a.id) || []);
    const categoryIds = new Set(v4Data.categories?.map(c => c.id) || []);

    for (const transaction of v4Data.transactions || []) {
      if (!accountIds.has(transaction.accountId)) {
        errors.push(`Transaction ${transaction.id} references non-existent account ${transaction.accountId}`);
      }
      if (transaction.categoryId && !categoryIds.has(transaction.categoryId)) {
        errors.push(`Transaction ${transaction.id} references non-existent category ${transaction.categoryId}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

interface ImportResult {
  accountsImported: number;
  categoriesImported: number;
  transactionsImported: number;
  accountMap: Map<number, string>;
  categoryMap: Map<number, string>;
  transactionIds: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

**Action Items:**
- [ ] Create data import utility
- [ ] Add data validation
- [ ] Handle referential integrity
- [ ] Use database transactions

---

## 📋 **Day 5: Testing & Documentation**

### **✅ Task 5.1: Create Migration Tests**
```typescript
// Create: src/__tests__/migration/data-migration.test.ts
import { V4ToV5DataMapper } from '@/lib/migration/v4-to-v5-mapper';
import { V5DataImporter } from '@/lib/migration/v5-data-importer';

describe('Data Migration', () => {
  test('maps v4.1 account to v5 structure', () => {
    // Test account mapping
  });

  test('maps v4.1 transaction to v5 structure', () => {
    // Test transaction mapping
  });

  test('validates v4.1 data correctly', () => {
    // Test data validation
  });

  test('imports v4.1 data successfully', async () => {
    // Test full import process
  });
});
```

**Action Items:**
- [ ] Create comprehensive migration tests
- [ ] Test data validation logic
- [ ] Test import/export functionality
- [ ] Create test data fixtures

### **✅ Task 5.2: Documentation**
```markdown
# Migration Utilities Documentation

## Overview
Tools for migrating data from FinTrack v4.1 (localStorage) to v5 (PostgreSQL).

## Usage

### Exporting v4.1 Data
```typescript
const exporter = new V4DataExporter();
const data = exporter.exportLocalStorageData();
exporter.exportToFile(data);
```

### Importing to v5
```typescript
const importer = new V5DataImporter();
const result = await importer.importV4Data(v4Data, tenantId);
```

## Data Mapping
- Account IDs: number → CUID-like string
- Transaction types: UPPERCASE → lowercase
- Dates: string → Date objects
```

**Action Items:**
- [ ] Document migration utilities
- [ ] Create usage examples
- [ ] Document data transformations
- [ ] Create troubleshooting guide

---

## 🎯 **Week 1 Success Criteria**

### **✅ Completion Checklist**
- [ ] v5 schema updated with v4.1 compatibility fields
- [ ] Database migration completed successfully
- [ ] Migration utilities created and tested
- [ ] Development workflow established
- [ ] Testing framework set up
- [ ] Documentation completed
- [ ] All tests pass
- [ ] TypeScript compilation clean

### **🚀 Ready for Week 2**
- [ ] Schema supports v4.1 data structures
- [ ] Migration tools are functional
- [ ] Development environment is ready
- [ ] Team can start porting components

---

## 📞 **Support & Troubleshooting**

### **Common Issues**
1. **Migration fails**: Check database connection and permissions
2. **TypeScript errors**: Ensure all interfaces are properly imported
3. **Test failures**: Verify test database is properly seeded
4. **Performance issues**: Check if indexes were created correctly

### **Rollback Procedure**
```bash
# If migration needs to be rolled back
npx prisma migrate reset
git checkout main
npm run build
```

---

*This checklist ensures Week 1 foundation is solid before proceeding to component porting in Week 2.*
