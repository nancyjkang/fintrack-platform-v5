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

## 📝 **Daily Logging Strategy**

### **Where to Record Daily Progress:**

#### **🎯 Daily Planning (Use This Document)**
- **Morning**: Use the "Today's Focus" section above to plan your day
- **Set Goals**: Define specific, actionable tasks for today
- **Choose Feature**: Pick which feature you're working on

#### **📋 Daily Progress Logging (Two Options)**

**Option A: Feature-Specific Logging (Recommended)**
- **Record progress** in the current feature's `execution-log.md`
- **Location**: `docs/features/[current-feature]/execution-log.md`
- **Benefits**: Progress tied to specific features, better organization
- **Use when**: Working on a specific feature

**Option B: General Daily Log (Alternative)**
- **Record progress** directly in this document (see template below)
- **Benefits**: All daily progress in one place
- **Use when**: Working on multiple features or general tasks

---

## 📝 **Daily Log Templates**

### **Template A: Feature-Specific Progress (Recommended)**

**In `docs/features/[feature-name]/execution-log.md`:**
```markdown
## Day [X]: [Date] - [Feature Name]

### 🎯 Today's Goal
[Specific outcome for this feature today]

### 📋 Tasks Completed
- ✅ [Specific task completed]
- ✅ [Another completed task]

### 🔄 In Progress
- seed data criteria need to be clear
- date range where start/end date is not set: Last week,last month, this quarter, last quarter, this half, last half





### 🚧 Blockers/Issues
- [Any problems encountered]

### 💡 Decisions Made
- [Technical decisions or discoveries]

### 🎯 Tomorrow's Priority
- [Next step for this feature]
```

### **Template B: General Daily Log (Alternative)**

**Use this section below for general daily logging:**

---

### **[Today's Date] - Daily Log**

#### **🎯 Goal**: [Today's main objective]
- [ ] [Specific task 1]
- [ ] [Specific task 2]
- [ ] [Specific task 3]

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

*Replace this template with your actual daily log, or use feature-specific logging in execution-log.md files*

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
