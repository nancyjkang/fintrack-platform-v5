# Feature: Database Schema Rebuild

**Created**: 2025-09-15
**Estimated Start**: 2025-09-15
**Priority**: High

---

## 🎯 **Goal**
Rebuild the entire database schema from scratch, starting with v4.1's clean, simple structure and adding multi-tenant support. This eliminates the over-engineered complexity that accumulated in the current v5 schema and provides a solid foundation for all future features.

## 👥 **User Impact**
Users will experience faster, more reliable data operations with a cleaner, simpler backend. The multi-tenant architecture will enable future features like team collaboration and data sharing while maintaining data isolation and security.

**User Story**: As a developer, I want a clean, simple database schema based on v4.1's proven structure so that I can build features faster without fighting unnecessary complexity.

---

## 📊 **Scope Definition**

### **✅ Must Have (Core Functionality)**
- [ ] New schema.prisma file based on v4.1 structure
- [ ] Multi-tenant support (User, Tenant, Membership models)
- [ ] Simplified Transaction model (no transfer fields, no metadata bloat)
- [ ] Real-time balance calculation (no AccountBalanceHistory table)
- [ ] All API endpoints updated to match new schema
- [ ] Tenant isolation middleware for data security

### **⚡ Should Have (Important)**
- [ ] Comprehensive seed data for testing
- [ ] Performance testing and optimization
- [ ] API documentation updates

### **💡 Nice to Have (If Time Permits)**
- [ ] Database migration scripts (for future reference)
- [ ] Schema visualization documentation

### **❌ Out of Scope (For This Version)**
- Data migration from current v5 schema (fresh start approach)
- Advanced multi-tenant features like tenant-specific customization
- Import/export functionality (will be added later as separate feature)

---

## 🔗 **Dependencies**

### **Prerequisites (Must be done first)**
- [ ] Backup any important data (if needed for reference)
- [ ] Review v4.1 data structures thoroughly
- [ ] Confirm multi-tenant architecture approach

### **Dependent Features (Blocked by this)**
- Transaction CRUD - Needs new simplified schema
- Account Management - Needs new schema structure
- All future features - Will build on this foundation
- Data import/export features - Need clean schema to work with

---

## 🛠️ **Technical Approach**

### **Database Changes**
- [ ] Complete schema rebuild: Drop existing, create new from scratch
- [ ] New tables: User, Tenant, Membership (multi-tenant support)
- [ ] Simplified tables: Account, Category, Transaction, AccountBalanceAnchor, SpendingGoal
- [ ] Migration required: No (fresh start approach)

### **API Endpoints to Update**
- [ ] `POST /api/auth/register` - Multi-tenant user registration
- [ ] `POST /api/auth/login` - Multi-tenant authentication
- [ ] `GET /api/accounts` - Tenant-isolated account listing
- [ ] `POST /api/accounts` - Account creation with tenant isolation
- [ ] `GET /api/transactions` - Simplified transaction listing
- [ ] `POST /api/transactions` - Simplified transaction creation
- [ ] `PUT /api/transactions/[id]` - Simplified transaction updates
- [ ] `DELETE /api/transactions/[id]` - Transaction deletion

### **UI Components**
- [ ] No UI changes required - schema is backend-only
- [ ] Existing components will work with updated APIs

### **Third-party Integrations**
- Prisma ORM - Database schema and client generation
- PostgreSQL - Database engine (no changes)

---

## ⏱️ **Estimates**

### **Complexity Assessment**
- **Overall Complexity**: Medium
- **Database Work**: 8 hours - Schema design and recreation
- **API Development**: 16 hours - Update all endpoints for new schema
- **UI Development**: 0 hours - No UI changes needed
- **Testing & Polish**: 8 hours - Comprehensive testing and seed data

### **Time Estimate**
- **Total Estimate**: 4 days
- **Buffer (20%)**: 1 day
- **Final Estimate**: 5 days

### **Risk Assessment**
- **Risk Level**: Medium
- **Main Risks**:
  - Schema design complexity: Could take longer than expected. Mitigation: Start with exact v4.1 copy, add multi-tenant incrementally
  - API breaking changes: Extensive updates needed. Mitigation: Update systematically, test each endpoint

---

## ✅ **Success Criteria**

### **Functional Requirements**
- [ ] New schema matches v4.1 structure exactly (with multi-tenant additions)
- [ ] All API endpoints work with new schema
- [ ] Multi-tenant isolation works correctly (users only see their tenant's data)
- [ ] Balance calculations work correctly with new schema
- [ ] Authentication works with new User/Tenant/Membership structure

### **Performance Requirements**
- [ ] Database queries perform as fast or faster than current schema
- [ ] Transaction listing handles 10,000+ records without issues
- [ ] Balance calculations complete in < 100ms

### **Quality Requirements**
- [ ] All API tests pass
- [ ] No TypeScript errors
- [ ] Prisma client generates without errors
- [ ] Database constraints prevent data corruption

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

### **Phase 1: Schema Design & Recreation** (2 days)
- [ ] Create new schema.prisma based on v4.1 structure
- [ ] Add multi-tenant models (User, Tenant, Membership)
- [ ] Drop existing database completely
- [ ] Create fresh database with new schema
- [ ] Generate Prisma client and test connection

### **Phase 2: API Updates** (2 days)
- [ ] Update authentication APIs for multi-tenant structure
- [ ] Update Account CRUD APIs with tenant isolation
- [ ] Update Transaction CRUD APIs (simplified structure)
- [ ] Update Category APIs with tenant isolation
- [ ] Add tenant isolation middleware

### **Phase 3: Testing & Validation** (1 day)
- [ ] Create comprehensive seed data
- [ ] Test all API endpoints thoroughly
- [ ] Verify multi-tenant isolation works
- [ ] Performance testing with large datasets
- [ ] Update API documentation

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
- Fresh start approach: No migration, complete rebuild for simplicity
- Multi-tenant via tenant_id: Simple row-level security approach
- Real-time balance calculation: Proven v4.1 approach, no balance history table
- Simplified Transaction model: Remove all over-engineered fields from current v5

### **Open Questions**
- Should we keep import_id/external_id fields for future CSV import? (Decision: Keep as optional for future use)
- How granular should tenant permissions be? (Decision: Start simple with member/admin/owner roles)

### **Assumptions**
- v4.1 structure is sufficient for all planned features: If wrong, we may need to add fields later
- Multi-tenant isolation via middleware is secure enough: If wrong, may need row-level security policies

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
