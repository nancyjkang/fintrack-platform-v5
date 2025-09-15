# Feature: API Updates for New Schema

**Created**: 2025-09-15
**Estimated Start**: 2025-09-17 (after Schema Design completion)
**Priority**: High

---

## 🎯 **Goal**
Update all API endpoints to work with the new simplified schema based on v4.1 structure with multi-tenant support. This is Phase 2 of the complete database rebuild.

## 👥 **User Impact**
Users will experience faster, more reliable API responses with cleaner data structures that match v4.1's proven patterns while supporting multi-tenant features.

**User Story**: As a user, I want all API endpoints to work seamlessly with the new simplified database structure so that the app continues to function correctly.

---

## 📊 **Scope Definition**

### **✅ Must Have (Core Functionality)**
- [x] Create service layer architecture (lib/services/)
- [x] Create base service class with tenant isolation
- [x] Create User/Auth services for authentication
- [x] Create Account services with tenant isolation
- [x] Create Transaction services (simplified structure, no transfer logic)
- [x] Create Category services with tenant isolation
- [x] Update authentication APIs to use services
- [x] Update Account CRUD APIs to use services
- [x] Update Transaction CRUD APIs to use services
- [ ] Update Category CRUD APIs to use services
- [ ] Update balance calculation logic for new schema
- [ ] **Unit tests for service layer** (added to scope)
- [ ] **Tenant isolation testing** (added to scope)
- [ ] **Service error handling tests** (added to scope)

### **⚡ Should Have (Important)**
- [ ] Error handling for multi-tenant scenarios
- [ ] API response validation
- [ ] Performance optimization for tenant queries

### **💡 Nice to Have (If Time Permits)**
- [ ] API documentation updates
- [ ] Request/response logging improvements

### **❌ Out of Scope (For This Version)**
- UI component updates (separate task)
- New API features (focus on existing functionality)
- Advanced multi-tenant features (keep simple)

---

## 🔗 **Dependencies**

### **Prerequisites (Must be done first)**
- [ ] Schema Design feature must be complete
- [ ] New database schema must be working
- [ ] Prisma client must be generated successfully

### **Dependent Features (Blocked by this)**
- Transaction CRUD UI - Needs updated APIs
- Account Management UI - Needs updated APIs
- All future features - Will use these updated APIs

---

## 🛠️ **Technical Approach**

### **Database Changes**
- [ ] No database changes (schema already updated in Phase 1)

### **API Endpoints to Update**

#### **Authentication APIs**
- [ ] `POST /api/auth/register` - Create User + Tenant + Membership
- [ ] `POST /api/auth/login` - Authenticate and return tenant context
- [ ] `GET /api/auth/me` - Return user info with tenant memberships

#### **Account APIs**
- [ ] `GET /api/accounts` - List accounts for current tenant
- [ ] `POST /api/accounts` - Create account in current tenant
- [ ] `GET /api/accounts/[id]` - Get account (with tenant check)
- [ ] `PUT /api/accounts/[id]` - Update account (with tenant check)
- [ ] `DELETE /api/accounts/[id]` - Delete account (with tenant check)

#### **Category APIs**
- [ ] `GET /api/categories` - List categories for current tenant
- [ ] `POST /api/categories` - Create category in current tenant
- [ ] `PUT /api/categories/[id]` - Update category (with tenant check)
- [ ] `DELETE /api/categories/[id]` - Delete category (with tenant check)

#### **Transaction APIs**
- [ ] `GET /api/transactions` - List transactions for current tenant
- [ ] `POST /api/transactions` - Create transaction in current tenant
- [ ] `GET /api/transactions/[id]` - Get transaction (with tenant check)
- [ ] `PUT /api/transactions/[id]` - Update transaction (with tenant check)
- [ ] `DELETE /api/transactions/[id]` - Delete transaction (with tenant check)

#### **Balance APIs**
- [ ] `GET /api/accounts/[id]/balance` - Calculate balance using v4.1 method
- [ ] `POST /api/accounts/[id]/balance-anchor` - Create balance anchor

### **Middleware Updates**
- [ ] Tenant isolation middleware for all data operations
- [ ] Authentication middleware updates for multi-tenant
- [ ] Request validation middleware for new schema

### **Key Changes from Current APIs**

#### **Simplified Transaction Model**
```typescript
// OLD (over-engineered)
interface Transaction {
  id: number;
  // ... many fields including status, notes, import_id, external_id, tags, metadata, created_by
}

// NEW (v4.1 based)
interface Transaction {
  id: number;
  tenant_id: string;
  account_id: number;
  category_id?: number;
  amount: number;
  description: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}
```

#### **Multi-Tenant Context**
```typescript
// All API calls now include tenant context
const transactions = await prisma.transaction.findMany({
  where: {
    tenant_id: currentTenant.id, // Automatic tenant isolation
    // ... other filters
  }
});
```

### **UI Components**
- [ ] No UI changes in this phase (APIs only)

### **Third-party Integrations**
- Prisma ORM - Updated queries for new schema
- JWT - Enhanced with tenant information

### **🏗️ Service Layer Architecture**

**Current Problem**: API routes directly access the database, violating separation of concerns.

**Solution**: Implement a service layer pattern:

```
API Routes → Services (lib/services/) → Prisma Client → Database
```

#### **Service Layer Benefits**
- **Separation of Concerns**: API logic vs business logic vs data logic
- **Reusability**: Services can be used across multiple API endpoints
- **Testability**: Mock services instead of database connections
- **Consistency**: Standardized data access patterns
- **Security**: Centralized tenant isolation and validation

#### **Service Structure**
```typescript
// lib/services/user.service.ts
export class UserService {
  static async createUser(data: CreateUserData): Promise<User> {
    // Business logic + validation
    // Database operations
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    // Tenant-aware queries
  }
}

// lib/services/transaction.service.ts
export class TransactionService {
  static async getTransactions(tenantId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    // Automatic tenant isolation
    // Complex queries and business logic
  }
}
```

#### **Implementation Plan**
1. **Create base service class** with tenant isolation
2. **User/Auth services** for authentication endpoints
3. **Account services** for account management
4. **Transaction services** for transaction CRUD
5. **Category services** for category management
6. **Update API routes** to use services instead of direct Prisma calls

---

## ⏱️ **Estimates**

### **Complexity Assessment**
- **Overall Complexity**: Medium-High
- **Database Work**: 0 hours - Schema already done
- **API Development**: 16 hours - Update all endpoints systematically
- **UI Development**: 0 hours - Not in this phase
- **Testing & Polish**: 4 hours - Comprehensive API testing

### **Time Estimate**
- **Total Estimate**: 3 days (was 2.5 days)
- **Service Layer Testing**: +0.5 days (added to scope)
- **Buffer (20%)**: 0.7 days
- **Final Estimate**: 3.7 days

### **Risk Assessment**
- **Risk Level**: Medium
- **Main Risks**:
  - Breaking changes: APIs might break existing functionality. Mitigation: Update systematically, test each endpoint
  - Tenant isolation bugs: Data leakage between tenants. Mitigation: Comprehensive testing of tenant isolation
  - Performance issues: Multi-tenant queries might be slower. Mitigation: Add indexes as needed

---

## ✅ **Success Criteria**

### **Functional Requirements**
- [ ] All existing API endpoints work with new schema
- [ ] Multi-tenant isolation works correctly (no data leakage)
- [ ] Authentication works with User/Tenant/Membership structure
- [ ] Balance calculations work correctly with new schema
- [ ] Transaction CRUD works with simplified structure (no transfer logic)

### **Performance Requirements**
- [ ] API response times match or exceed current performance
- [ ] Tenant queries complete in < 500ms for typical datasets
- [ ] Balance calculations complete in < 100ms

### **Quality Requirements**
- [ ] All API tests pass
- [ ] No TypeScript errors
- [ ] Proper error handling for multi-tenant scenarios
- [ ] API responses match expected formats

---

## 🧪 **Testing Strategy**

### **Unit Tests** (Expanded Scope)
- [x] **Service Layer Tests** (added to Phase 2)
  - [x] UserService unit tests with mocked Prisma
  - [x] TransactionService unit tests with tenant isolation
  - [x] AccountService unit tests with validation
  - [x] CategoryService unit tests with error handling
  - [x] BaseService tenant isolation tests
- [ ] Tenant isolation middleware tests
- [ ] Individual API endpoint tests
- [ ] Balance calculation tests
- [ ] Authentication flow tests

### **Integration Tests**
- [ ] End-to-end API workflows
- [ ] Multi-tenant data isolation tests
- [ ] Cross-tenant access prevention tests
- [ ] Performance tests with large datasets

### **Manual Testing**
- [ ] Test each API endpoint with Postman/curl
- [ ] Verify tenant isolation works
- [ ] Test authentication flows
- [ ] Test balance calculations
- [ ] Test error scenarios

---

## 📋 **Implementation Plan**

### **Phase 1: Authentication & Middleware** (1 day)
- [ ] Update authentication APIs for multi-tenant
- [ ] Create tenant isolation middleware
- [ ] Update JWT to include tenant information
- [ ] Test authentication flows

### **Phase 2: Core Data APIs + Service Testing** (1.5 days)
- [x] Update Account CRUD APIs with tenant isolation
- [ ] Update Category CRUD APIs with tenant isolation
- [x] Update Transaction CRUD APIs (simplified structure)
- [x] **Create comprehensive service layer unit tests**
- [x] **Test tenant isolation in all services**
- [x] **Test error handling and validation**
- [ ] Test all CRUD operations

### **Phase 3: Balance & Advanced Features** (0.5 days)
- [ ] Update balance calculation APIs
- [ ] Add balance anchor APIs
- [ ] Test balance calculations thoroughly
- [ ] Performance testing and optimization

### **Phase 4: Testing & Validation** (0.5 days)
- [ ] Comprehensive API testing
- [ ] Multi-tenant isolation testing
- [ ] Performance validation
- [ ] Error handling verification

---

## 📊 **Metrics & Monitoring**

### **Success Metrics**
- API test coverage: > 90%
- API response time: < 500ms average
- Tenant isolation: 100% (no data leakage)

### **Monitoring**
- [ ] API response time monitoring
- [ ] Error rate monitoring
- [ ] Tenant isolation audit logging

---

## 📝 **Notes & Decisions**

### **Technical Decisions**
- Tenant isolation via middleware: Simple, effective approach
- JWT includes tenant context: Reduces database queries
- Remove transfer logic: Simplify to v4.1 approach
- Real-time balance calculation: No balance history table needed

### **Open Questions**
- Should we add API versioning for future changes? (Decision: Not needed for fresh start)
- How granular should tenant permissions be? (Decision: Start with simple member/admin/owner)

### **Assumptions**
- Existing UI will work with updated APIs: If wrong, we'll need UI updates
- Performance will be adequate: If wrong, we can add caching/optimization

---

## 🔄 **Review & Approval**

### **Planning Review Checklist**
- [ ] Goal is clear and valuable
- [ ] Scope is well-defined (API updates only)
- [ ] Dependencies are identified (Schema Design must be complete)
- [ ] Estimates seem reasonable (3 days)
- [ ] Success criteria are testable
- [ ] Risks are identified with mitigation plans

### **Approval**
- [ ] **Planning Approved**: [Date] - Ready to start after Schema Design
- [ ] **Priority Confirmed**: High - Critical for app functionality

---

*This is Phase 2 of the Database Schema Rebuild. Depends on: Schema Design. Next phase: Testing & Validation.*
