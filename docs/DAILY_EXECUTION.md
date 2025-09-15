# FinTrack v5 - Daily Execution Guide

> **📋 Feature Planning**: Use **[FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md)** to pick your next feature
> **🗓️ Weekly Planning**: See **[WEEKLY_PLANNING.md](./WEEKLY_PLANNING.md)** for current sprint focus

---

## 📅 **Today's Focus: [DATE]**

### **🎯 Primary Goal**
[What's the main feature or task that needs to get done today?]

### **📋 Today's Tasks**
- [ ] **Feature Task**: [Specific feature development task]
- [ ] **Documentation**: [Update feature docs or create new specs]
- [ ] **Testing**: [Test completed functionality]

---

## 🚀 **Feature Development Workflow**

### **Starting a New Feature:**
1. [ ] **Pick Feature**: Review [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) for next priority
2. [ ] **Create Feature**: Run `./scripts/create-feature.sh [feature-name]`
3. [ ] **Plan Feature**: Fill out `docs/features/[feature-name]/planning.md`
4. [ ] **Create Branch**: `git checkout -b feature/[feature-name]`

### **Documenting Existing Features:**
1. [ ] **Document Feature**: Run `./scripts/document-existing-feature.sh [feature-name] "Feature Title"`
2. [ ] **Fill Specs**: Complete `implementation.md` with technical details
3. [ ] **Update Backlog**: Add docs link to [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md)

### **Daily Development Loop:**
1. [ ] **Review Planning**: Check `docs/features/[current-feature]/planning.md`
2. [ ] **Code & Test**: Implement according to specification
3. [ ] **Log Progress**: Update `docs/features/[current-feature]/execution-log.md`
4. [ ] **Commit Changes**: Use targeted file selection (see Git Workflow below)

---

## ✅ **End of Day Checklist**

### **Feature Progress:**
- [ ] **Execution Log Updated**: Added today's progress to feature execution-log.md
- [ ] **Implementation Status**: Updated implementation.md if feature completed
- [ ] **Backlog Status**: Updated feature status in FEATURE_BACKLOG.md if needed

### **Code Quality:**
- [ ] **All Code Committed**: Changes pushed to feature branch
- [ ] **Tests Passing**: `npm run test` successful
- [ ] **Type Check**: `npm run type-check` clean
- [ ] **Linting**: `npm run lint` clean

### **Documentation:**
- [ ] **Feature Docs Current**: All feature documentation up to date
- [ ] **Weekly Planning**: Updated WEEKLY_PLANNING.md if weekly milestone reached

---

## 📝 **Daily Log Template**

### **Monday, January 20, 2025**

#### **🎯 Goal**: Document Account Management System
- [ ] Run `./scripts/document-existing-feature.sh account-management "Account Management"`
- [ ] Fill out implementation.md with API endpoints and UI components
- [ ] Update FEATURE_BACKLOG.md with documentation link

#### **✅ Completed**
- ✅ Created account management feature documentation structure
- ✅ Documented GET/POST /api/accounts endpoints
- ✅ Added UI component specifications

#### **🔄 In Progress**
- 🔄 Writing implementation.md - need to add testing section

#### **🚧 Blockers/Issues**
- Need to verify all UI components are documented
- Should test API endpoints to confirm exact behavior

#### **💡 Notes**
- Account management has both API and UI components
- Good example of feature with multiple touchpoints
- Documentation pattern established for future features

#### **🎯 Tomorrow's Priority**
- Complete account management implementation.md
- Start documenting dashboard system
- Update feature backlog with completed docs

---

### **Tuesday, January 21, 2025**

#### **🎯 Goal**: Start Transaction CRUD Feature
- [ ] Run `./scripts/create-feature.sh transaction-crud`
- [ ] Fill out planning.md with API specifications
- [ ] Begin implementation of POST /api/transactions

#### **✅ Completed**
- [Fill in at end of day]

#### **🔄 In Progress**
- [Fill in at end of day]

#### **🚧 Blockers/Issues**
- [Fill in at end of day]

#### **💡 Notes**
- [Fill in at end of day]

#### **🎯 Tomorrow's Priority**
- [Fill in at end of day]

---

## 🛠️ **Common Commands**

### **Feature Management**
```bash
# Create new feature documentation
./scripts/create-feature.sh transaction-crud

# Document existing feature
./scripts/document-existing-feature.sh account-management "Account Management"

# Check feature status
grep -n "✅ Complete" docs/FEATURE_BACKLOG.md
```

### **Development**
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

### **Database**
```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# View database
npx prisma studio
```

### **Git Workflow (Targeted File Selection)**
```bash
# Check what changed
git status

# Add specific files only (NEVER use git add .)
git add src/app/api/accounts/route.ts
git add docs/features/account-management/implementation.md

# Commit with descriptive message
git commit -m "feat: document account management API endpoints

- Add GET/POST /api/accounts specification
- Document request/response interfaces
- Include error handling details
- Files: route.ts, implementation.md"

# Push feature branch
git push -u origin feature/account-management-docs
```

---

## 📊 **Progress Tracking Integration**

### **Weekly Milestone Tracking**
Update these documents at end of each week:

- **[WEEKLY_PLANNING.md](./WEEKLY_PLANNING.md)**: Log completed features and plan next week's priorities
- **[FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md)**: Update feature statuses and priorities

### **Feature Documentation Checklist**
For each completed feature, ensure:
- [ ] **planning.md**: Complete specification for recreation
- [ ] **implementation.md**: Technical details of what was built
- [ ] **execution-log.md**: Development timeline and decisions
- [ ] **FEATURE_BACKLOG.md**: Updated with ✅ Complete and docs link

---

## 🎯 **Current Sprint Focus**

### **This Week's Priorities** (from WEEKLY_PLANNING.md)
1. **Document Existing Features**: Create specs for implemented features
2. **Account Management**: Complete API and UI documentation
3. **Transaction CRUD**: Begin implementation of core transaction features

### **Feature Documentation Pipeline**
- **✅ Complete**: Authentication System, Multi-Tenant Support
- **🔄 In Progress**: [Current feature being documented]
- **📋 Next**: Account Management, Dashboard System, Navigation System

---

## 💡 **Daily Execution Tips**

### **Feature Development Best Practices**
- **Start with Planning**: Always fill out planning.md before coding
- **Document as You Go**: Update execution-log.md daily
- **Test Early**: Verify functionality works before moving on
- **Commit Often**: Small, focused commits with clear messages

### **Documentation Best Practices**
- **Be Specific**: Include exact API contracts and UI specifications
- **Include Examples**: Show how to use APIs and components
- **Think Recreation**: Write specs so someone else could rebuild the feature
- **Link Everything**: Connect related features and dependencies

### **Time Management**
- **Morning**: Review planning docs and set clear daily goals
- **Midday**: Check progress against goals, adjust if needed
- **Evening**: Update documentation and plan tomorrow's priorities

---

*This daily execution guide integrates with the FinTrack v5 feature documentation system to ensure consistent progress tracking and comprehensive feature specifications.*
