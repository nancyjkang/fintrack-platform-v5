# Feature: Schema Design

**Created**: 2025-09-15
**Estimated Start**: 2025-09-15
**Priority**: High

---

## 🎯 **Goal**
Design and implement a new, clean database schema based on v4.1's proven structure with multi-tenant support. This is Phase 1 of the complete database rebuild.

## 👥 **User Impact**
Developers will have a clean, simple schema to work with that matches v4.1's proven patterns while supporting multi-tenant architecture for future collaboration features.

**User Story**: As a developer, I want a clean database schema based on v4.1's structure so that I can build features without fighting unnecessary complexity.

---

## 📊 **Scope Definition**

### **✅ Must Have (Core Functionality)**
- [ ] New schema.prisma file with v4.1-based structure
- [ ] Multi-tenant models: User, Tenant, Membership
- [ ] Simplified core models: Account, Category, Transaction, AccountBalanceAnchor, SpendingGoal
- [ ] All models have proper tenant_id relationships
- [ ] Database recreation (drop existing, create fresh)
- [ ] Prisma client generation and testing

### **⚡ Should Have (Important)**
- [ ] Proper database constraints and indexes
- [ ] Clear documentation of schema decisions
- [ ] Validation that schema matches v4.1 patterns

### **💡 Nice to Have (If Time Permits)**
- [ ] Schema visualization diagram
- [ ] Performance optimization indexes

### **❌ Out of Scope (For This Version)**
- API updates (separate feature)
- Data migration (fresh start approach)
- UI changes (not needed)

---

## 🔗 **Dependencies**

### **Prerequisites (Must be done first)**
- [ ] Review v4.1 data structures thoroughly
- [ ] Backup any reference data if needed
- [ ] Confirm multi-tenant architecture approach

### **Dependent Features (Blocked by this)**
- API Updates for New Schema - Needs this schema to be complete
- All future features - Will build on this foundation

---

## 🛠️ **Technical Approach**

### **Database Changes**
- [ ] Complete schema rebuild: Drop existing database
- [ ] New schema.prisma based on v4.1 core-data.ts
- [ ] Add User, Tenant, Membership models for multi-tenant support
- [ ] Add tenant_id to all data models (Account, Category, Transaction, etc.)
- [ ] Remove over-engineered fields from current v5 schema

### **Schema Structure (v4.1 + Multi-tenant)**

```prisma
// Multi-tenant foundation
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  password   String
  name       String?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  memberships Membership[]
  @@map("users")
}

model Tenant {
  id         String   @id @default(cuid())
  name       String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  memberships     Membership[]
  accounts        Account[]
  categories      Category[]
  transactions    Transaction[]
  spending_goals  SpendingGoal[]
  balance_anchors AccountBalanceAnchor[]

  @@map("tenants")
}

model Membership {
  id        String @id @default(cuid())
  user_id   String
  tenant_id String
  role      String @default("member") // member, admin, owner

  user   User   @relation(fields: [user_id], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenant_id], references: [id], onDelete: Cascade)

  @@unique([user_id, tenant_id])
  @@map("memberships")
}

// Core data models (based on v4.1)
model Account {
  id           Int      @id @default(autoincrement())
  tenant_id    String
  name         String
  type         String   // CHECKING, SAVINGS, CREDIT, INVESTMENT, CASH
  balance      Decimal  @db.Decimal(12, 2)
  balance_date DateTime
  color        String
  is_active    Boolean  @default(true)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  tenant          Tenant                 @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  transactions    Transaction[]
  balance_anchors AccountBalanceAnchor[]

  @@map("accounts")
}

model Category {
  id         Int      @id @default(autoincrement())
  tenant_id  String
  name       String
  type       String   // INCOME, EXPENSE, TRANSFER
  color      String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  tenant       Tenant        @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@map("categories")
}

model Transaction {
  id           Int      @id @default(autoincrement())
  tenant_id    String
  account_id   Int
  category_id  Int?
  amount       Decimal  @db.Decimal(12, 2)
  description  String
  date         DateTime
  type         String   // INCOME, EXPENSE, TRANSFER
  is_recurring Boolean  @default(false)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  tenant   Tenant    @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  account  Account   @relation(fields: [account_id], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [category_id], references: [id], onDelete: SetNull)

  @@map("transactions")
}

model AccountBalanceAnchor {
  id          Int      @id @default(autoincrement())
  tenant_id   String
  account_id  Int
  balance     Decimal  @db.Decimal(12, 2)
  anchor_date DateTime
  description String?
  created_at  DateTime @default(now())

  tenant  Tenant  @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  account Account @relation(fields: [account_id], references: [id], onDelete: Cascade)

  @@map("account_balance_anchors")
}

model SpendingGoal {
  id                        String   @id @default(cuid())
  tenant_id                 String
  name                      String
  goal_type                 String   // maximum, minimum
  target_amount             Decimal  @db.Decimal(12, 2)
  timeframe                 String   // monthly, quarterly, bi-annual, annual
  start_date                DateTime
  end_date                  DateTime
  status                    String   @default("active") // active, cancelled, expired
  alert_warning_threshold   Int      @default(80)
  alert_critical_threshold  Int      @default(90)

  // Criteria (simplified approach)
  criteria_category_ids     Int[]    @default([])
  criteria_account_ids      Int[]    @default([])
  criteria_recurring        Boolean?
  criteria_transaction_type String   // INCOME, EXPENSE, TRANSFER

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  tenant Tenant @relation(fields: [tenant_id], references: [id], onDelete: Cascade)

  @@map("spending_goals")
}
```

### **API Endpoints Needed**
- [ ] None for this phase (schema design only)

### **UI Components**
- [ ] None for this phase (schema design only)

### **Third-party Integrations**
- Prisma ORM - Schema definition and client generation
- PostgreSQL - Database engine

---

## ⏱️ **Estimates**

### **Complexity Assessment**
- **Overall Complexity**: Medium
- **Database Work**: 8 hours - Schema design, recreation, testing
- **API Development**: 0 hours - Not in this phase
- **UI Development**: 0 hours - Not in this phase
- **Testing & Polish**: 2 hours - Schema validation and Prisma client testing

### **Time Estimate**
- **Total Estimate**: 2 days
- **Buffer (20%)**: 0.5 days
- **Final Estimate**: 2.5 days

### **Risk Assessment**
- **Risk Level**: Low-Medium
- **Main Risks**:
  - Schema complexity: Could take longer to get relationships right. Mitigation: Start with exact v4.1 copy, add multi-tenant incrementally
  - Prisma client issues: Generation might fail. Mitigation: Test incrementally as we build

---

## ✅ **Success Criteria**

### **Functional Requirements**
- [ ] New schema.prisma file exists and is valid
- [ ] Database can be created from schema without errors
- [ ] Prisma client generates successfully
- [ ] All relationships work correctly
- [ ] Schema matches v4.1 structure (with multi-tenant additions)

### **Performance Requirements**
- [ ] Database creation completes in < 30 seconds
- [ ] Prisma client generation completes in < 60 seconds

### **Quality Requirements**
- [ ] No Prisma schema validation errors
- [ ] No TypeScript errors in generated client
- [ ] All foreign key constraints work correctly
- [ ] Database indexes are properly defined

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- [ ] Schema validation tests
- [ ] Prisma client generation tests

### **Integration Tests**
- [ ] Database connection tests
- [ ] Basic CRUD operations on each model
- [ ] Foreign key constraint tests
- [ ] Multi-tenant isolation tests

### **Manual Testing**
- [ ] Create database from schema
- [ ] Generate Prisma client
- [ ] Test basic queries on each model
- [ ] Verify tenant isolation works

---

## 📋 **Implementation Plan**

### **Phase 1: Schema Foundation** (1 day)
- [ ] Create new schema.prisma file
- [ ] Define User, Tenant, Membership models
- [ ] Add basic Account model with tenant_id
- [ ] Test database creation and Prisma client generation

### **Phase 2: Core Models** (0.5 days)
- [ ] Add Category model with tenant isolation
- [ ] Add simplified Transaction model (v4.1 structure)
- [ ] Add AccountBalanceAnchor model
- [ ] Test all relationships work correctly

### **Phase 3: Advanced Models & Testing** (0.5 days)
- [ ] Add SpendingGoal model
- [ ] Add proper indexes and constraints
- [ ] Comprehensive testing of all models
- [ ] Documentation of schema decisions

---

## 📊 **Metrics & Monitoring**

### **Success Metrics**
- Schema validation passes: 100%
- Prisma client generation: Success
- Database creation time: < 30 seconds

### **Monitoring**
- [ ] Schema validation in CI/CD
- [ ] Prisma client generation monitoring

---

## 📝 **Notes & Decisions**

### **Technical Decisions**
- Use v4.1 Transaction structure exactly: Proven to work, no over-engineering
- Multi-tenant via tenant_id: Simple, effective row-level security
- Real-time balance calculation: No AccountBalanceHistory table needed
- String IDs for User/Tenant: Better for multi-tenant architecture
- Integer IDs for data models: Matches v4.1, more efficient

### **Open Questions**
- Should we add any indexes beyond basic foreign keys? (Decision: Start minimal, add as needed)
- Keep import_id/external_id fields for future? (Decision: Not in initial schema, add later if needed)

### **Assumptions**
- v4.1 structure is sufficient: If wrong, we can add fields later
- PostgreSQL performance is adequate: If wrong, we can optimize with indexes

---

## 🔄 **Review & Approval**

### **Planning Review Checklist**
- [ ] Goal is clear and valuable
- [ ] Scope is well-defined (schema design only)
- [ ] Dependencies are identified
- [ ] Estimates seem reasonable (2 days)
- [ ] Success criteria are testable
- [ ] Risks are identified with mitigation plans

### **Approval**
- [ ] **Planning Approved**: [Date] - Ready to start development
- [ ] **Priority Confirmed**: High - Foundation for all other work

---

*This is Phase 1 of the Database Schema Rebuild. Next phases: API Updates, Testing & Validation.*
