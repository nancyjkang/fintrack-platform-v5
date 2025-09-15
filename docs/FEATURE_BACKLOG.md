# FinTrack v5 - Feature Backlog

**Last Updated**: September 15, 2025
**Current Sprint**: Foundation & Core Features

This document contains the prioritized list of all features to be implemented, serving as the single source of truth for development planning.

---

## 🎯 **How to Use This Backlog**

1. **Pick Next Feature**: Always work on the highest priority "Ready" feature
2. **Create Feature**: Run `./scripts/create-feature.sh [feature-name]`
3. **Update Status**: Move features through the pipeline as they progress
4. **Weekly Review**: Update priorities and estimates every Friday

### **📅 Date Tracking**
- **Completed**: Date when feature was finished and deployed
- **Last Updated**: Date when feature status/details were last modified
- **Estimate vs Actual**: Track estimation accuracy for future planning

---

## 🚀 **Current Sprint - Foundation & Core Features**

### **🔥 Priority 1: Critical Path (Work on These First)**

- **Schema Design** - ✅ Complete
  - **Estimate**: 2 days (actual: 1 day)
  - **Completed**: 2025-09-15 14:05
  - **Last Updated**: 2025-09-15
  - **Dependencies**: None
  - **Notes**: Phase 1 of Database Schema Rebuild - clean v4.1-based schema with multi-tenant support
  - **Documentation**: [Planning](docs/features/schema-design/planning.md) | [Implementation](docs/features/schema-design/implementation.md) | [Overall Project](docs/features/database-schema-rebuild/planning.md)

- **API Updates for New Schema** - ✅ Complete
  - **Estimate**: 3 days (actual: 1 day)
  - **Completed**: 2025-09-15 16:30
  - **Last Updated**: 2025-09-15
  - **Dependencies**: Schema Design ✅
  - **Notes**: Phase 2 of database rebuild - service layer architecture + API updates + comprehensive unit tests
  - **Documentation**: [Planning](docs/features/api-updates-for-new-schema/planning.md) | [Implementation](docs/features/api-updates-for-new-schema/implementation.md) | [Execution Log](docs/features/api-updates-for-new-schema/execution-log.md)

- **Transaction CRUD** - ✅ Complete (API) / 📋 Ready (UI)
  - **Estimate**: 4 days (API: 0.5 days actual, UI: 3.5 days remaining)
  - **Completed**: 2025-09-15 16:30 (API portion)
  - **Last Updated**: 2025-09-15
  - **Dependencies**: API Updates for New Schema ✅
  - **Notes**: API portion complete with service layer. UI implementation ready to start.
  - **Documentation**: [Planning](docs/features/transaction-crud/planning.md)

- **Account Management UI** - 📋 Ready
  - **Estimate**: 3 days
  - **Dependencies**: Transaction CRUD
  - **Notes**: Complete account views and forms

- **Category Management** - 📋 Ready
  - **Estimate**: 2 days
  - **Dependencies**: Transaction CRUD
  - **Notes**: Basic category CRUD operations

- **CSV Import System** - 📋 Ready
  - **Estimate**: 5 days
  - **Dependencies**: Transaction CRUD, Categories
  - **Notes**: File upload, parsing, duplicate detection

### **⚡ Priority 2: Important Features (Next Up)**

- **Transaction Filtering** - 📋 Ready
  - **Estimate**: 3 days
  - **Dependencies**: Transaction CRUD
  - **Notes**: Advanced search, date ranges, filters

- **Bulk Transaction Operations** - 📋 Ready
  - **Estimate**: 3 days
  - **Dependencies**: Transaction CRUD, Filtering
  - **Notes**: Bulk edit, delete, categorize

- **Account Balance History** - 📋 Ready
  - **Estimate**: 2 days
  - **Dependencies**: Account Management
  - **Notes**: Charts and balance tracking

- **Recurring Transactions** - 📋 Ready
  - **Estimate**: 4 days
  - **Dependencies**: Transaction CRUD
  - **Notes**: Setup and auto-generation

### **💡 Priority 3: Enhancement Features (Nice to Have)**

- **Dashboard Analytics** - 📋 Ready
  - **Estimate**: 3 days
  - **Dependencies**: Transaction CRUD, Categories
  - **Notes**: Spending trends, summaries

- **Data Export** - 📋 Ready
  - **Estimate**: 2 days
  - **Dependencies**: Transaction CRUD
  - **Notes**: JSON/CSV export functionality

- **User Settings & Preferences** - 📋 Ready
  - **Estimate**: 2 days
  - **Dependencies**: None
  - **Notes**: Profile management, app settings

- **Email Verification** - 📋 Ready
  - **Estimate**: 1 day
  - **Dependencies**: None
  - **Notes**: Complete auth flow

---

## 🔄 **v4.1 Migration Features**

These are features that exist in v4.1 and need to be ported to v5's PostgreSQL architecture.

### **🎯 High Priority Migrations**

- **TransactionsTable Component** - 📋 Ready
  - **Estimate**: 3 days
  - **Complexity**: High
  - **Notes**: Complex table with sorting, filtering, pagination

- **Account Balance Calculation** - 📋 Ready
  - **Estimate**: 2 days
  - **Complexity**: Medium
  - **Notes**: Real-time balance updates

- **Category Hierarchy** - 📋 Ready
  - **Estimate**: 2 days
  - **Complexity**: Medium
  - **Notes**: Nested categories and auto-categorization

- **Transaction Search** - 📋 Ready
  - **Estimate**: 2 days
  - **Complexity**: Medium
  - **Notes**: Full-text search and advanced filters

### **🔄 Medium Priority Migrations**

- **Bulk Transaction Updates** - 📋 Ready
  - **Estimate**: 3 days
  - **Complexity**: High
  - **Notes**: Complex UI with scope selection

- **CSV Import with Preview** - 📋 Ready
  - **Estimate**: 4 days
  - **Complexity**: High
  - **Notes**: File parsing, duplicate detection, preview

- **Spending Trend Reports** - 📋 Ready
  - **Estimate**: 3 days
  - **Complexity**: Medium
  - **Notes**: Charts and analytics

- **Account Type Management** - 📋 Ready
  - **Estimate**: 1 day
  - **Complexity**: Low
  - **Notes**: Account types and subtypes

### **💫 Lower Priority Migrations**

- **Advanced Reporting** - 📋 Backlog
  - **Estimate**: 5 days
  - **Complexity**: High
  - **Notes**: Complex charts and analysis

- **Data Validation Rules** - 📋 Backlog
  - **Estimate**: 2 days
  - **Complexity**: Medium
  - **Notes**: Custom validation logic

- **Keyboard Shortcuts** - 📋 Backlog
  - **Estimate**: 1 day
  - **Complexity**: Low
  - **Notes**: Power user features

- **Dark Mode** - 📋 Backlog
  - **Estimate**: 1 day
  - **Complexity**: Low
  - **Notes**: UI theme switching

---

## 🆕 **New v5-Only Features**

These are new features that don't exist in v4.1 but leverage v5's PostgreSQL architecture.

### **🔥 High Value New Features**

- **Authentication System** - ✅ Complete
  - **Estimate**: 4 weeks
  - **Completed**: 2025-09-10 (estimated)
  - **Last Updated**: 2025-09-15
  - **Value**: Critical
  - **Notes**: JWT-based auth with multi-tenant support - **[📁 Docs](./features/authentication-system/)**

- **Multi-Tenant Support** - ✅ Complete
  - **Estimate**: 6 weeks (integrated with auth)
  - **Completed**: 2025-09-12 (estimated)
  - **Last Updated**: 2025-09-15
  - **Value**: Critical
  - **Notes**: Complete data isolation, role-based access - **[📁 Docs](./features/multi-tenant-support/)**

- **Audit Logging** - 📋 Ready
  - **Estimate**: 3 days
  - **Value**: High
  - **Notes**: Track all data changes

- **Real-time Notifications** - 📋 Ready
  - **Estimate**: 4 days
  - **Value**: Medium
  - **Notes**: WebSocket-based updates

- **Advanced Security** - 📋 Ready
  - **Estimate**: 3 days
  - **Value**: High
  - **Notes**: 2FA, session management

### **📊 Analytics & Insights**

- **Spending Insights** - 📋 Backlog
  - **Estimate**: 4 days
  - **Value**: High
  - **Notes**: AI-powered spending analysis

- **Budget Tracking** - 📋 Backlog
  - **Estimate**: 5 days
  - **Value**: High
  - **Notes**: Budget creation and monitoring

- **Financial Goals** - 📋 Backlog
  - **Estimate**: 4 days
  - **Value**: Medium
  - **Notes**: Savings goals and progress

- **Net Worth Tracking** - 📋 Backlog
  - **Estimate**: 3 days
  - **Value**: Medium
  - **Notes**: Asset and liability tracking

### **🔧 Developer & Admin Features**

- **SQL Inspector** - 📋 Backlog
  - **Estimate**: 2 days
  - **Value**: Medium
  - **Notes**: Database query interface

- **System Health Dashboard** - 📋 Backlog
  - **Estimate**: 2 days
  - **Value**: Medium
  - **Notes**: Performance monitoring

- **Data Migration Tools** - 📋 Backlog
  - **Estimate**: 3 days
  - **Value**: Low
  - **Notes**: Import from other apps

- **API Documentation** - 📋 Backlog
  - **Estimate**: 1 day
  - **Value**: Low
  - **Notes**: Auto-generated API docs

---

## 📊 **Status Legend**

- ✅ **Complete** - Feature is done and deployed (includes **Completed** date)
- 🔄 **In Progress** - Currently being developed (includes **Last Updated** date)
- 📋 **Ready** - Planned and ready to start (use `./scripts/create-feature.sh`)
- 🔍 **Research** - Needs investigation before planning
- ⏸️ **Blocked** - Waiting on dependencies
- 📦 **Backlog** - Future feature, not yet prioritized for current sprint
- ❌ **Cancelled** - No longer needed

### **📅 Date Field Usage**
- **Completed**: Only for ✅ Complete features - when they were finished
- **Last Updated**: For all features - when status/details were last changed
- **Estimate vs Actual**: Track for completed features to improve future estimates

---

## 🎯 **Next Feature Selection Guide**

### **How to Pick Your Next Feature:**

1. **Check Current Sprint**: Always prioritize "Priority 1" features first
2. **Check Dependencies**: Make sure all dependencies are complete
3. **Check Estimate**: Pick something that fits your available time
4. **Check Value**: Higher priority = higher business value

### **This Week's Recommendation:**
```bash
# If Transaction CRUD is complete:
./scripts/create-feature.sh account-management-ui

# If Transaction CRUD needs more work:
# Continue with current feature
```

### **Next 2-3 Weeks Pipeline:**
1. **Week 1**: Complete Transaction CRUD
2. **Week 2**: Account Management UI + Category Management
3. **Week 3**: CSV Import System

---

## 🔄 **Weekly Backlog Review**

### **Every Friday: Update This Document**

#### **Review Checklist:**
- [ ] Move completed features to "Complete"
- [ ] Update "In Progress" status
- [ ] Re-prioritize based on learnings
- [ ] Add new features discovered during development
- [ ] Update estimates based on actual time taken
- [ ] Plan next week's features

#### **Questions to Ask:**
- What did we learn this week that changes priorities?
- Are there new dependencies we discovered?
- Should we adjust estimates based on actual time taken?
- Are there new features we need to add?

---

## 📝 **Feature Request Process**

### **Adding New Features:**
1. Add to appropriate section (v4.1 Migration, New v5 Feature, etc.)
2. Set initial status as "🔍 Research" or "📦 Backlog"
3. Estimate complexity and value
4. Identify dependencies
5. Prioritize relative to existing features

### **Changing Priorities:**
1. Update this document with new priority order
2. Update `WEEKLY_PLANNING.md` to reflect changes
3. Communicate changes to team (if applicable)

---

## 🎯 **Success Metrics**

### **Sprint Goals:**
- **Velocity**: Complete 2-3 features per week
- **Quality**: All features fully tested and documented
- **Value**: Focus on high-impact user features first

### **Current Sprint Progress:**
- **Features Completed**: 3/8 (Schema Design ✅, API Updates ✅, Transaction CRUD API ✅)
- **Estimated Completion**: 2 weeks for remaining Priority 1 features
- **Risk Level**: Low (strong foundation established, clear path forward)

---

*This backlog should be the first place you look when deciding what to work on next. Keep it updated and prioritized!*
