# FinTrack v5 - Quick Reference Card

> **🔖 Bookmark this page** - Your daily workflow reference

---

## 🚀 **Daily Workflow (Quick Steps)**

### **🌅 Morning (5 minutes)**
1. **Open**: [DAILY_EXECUTION.md](./DAILY_EXECUTION.md)
2. **Plan**: Fill out "Today's Focus" section
3. **Pick Feature**: Check [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) for next priority
4. **Review**: Open current feature's `planning.md`

### **💻 During Development**
- **Commands**: Use [DAILY_EXECUTION.md - Common Commands](./DAILY_EXECUTION.md#️-common-commands)
- **Workflow**: Follow [DAILY_EXECUTION.md - Development Loop](./DAILY_EXECUTION.md#-feature-development-workflow)

### **🌙 Evening (5 minutes)**
- **Log Progress**: Update feature's `execution-log.md` OR use daily log template
- **Plan Tomorrow**: Set tomorrow's priority
- **Commit**: Use targeted file selection (never `git add .`)

---

## 📚 **Key Documents (Bookmarks)**

### **📅 Daily Use**
- **[DAILY_EXECUTION.md](./DAILY_EXECUTION.md)** - Your main daily reference
- **[FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md)** - What to work on next

### **📋 Weekly Use**
- **[WEEKLY_PLANNING.md](./WEEKLY_PLANNING.md)** - Weekly planning and review

### **🛠️ System Reference**
- **[FEATURE_LIFECYCLE_SYSTEM.md](./FEATURE_LIFECYCLE_SYSTEM.md)** - Complete process guide
- **[README.md](./README.md)** - Documentation overview

---

## ⚡ **Quick Commands**

### **Feature Management**
```bash
# Create new feature
./scripts/create-feature.sh transaction-crud

# Document existing feature
./scripts/document-existing-feature.sh account-management "Account Management"

# Check feature status
grep -n "✅ Complete" docs/FEATURE_BACKLOG.md
```

### **Development**
```bash
npm run dev          # Start dev server
npm run test         # Run tests
npm run type-check   # Type checking
npm run lint         # Linting
npm run build        # Production build
```

### **Git (Targeted Selection)**
```bash
git status                    # Check what changed
git add specific-file.ts      # Add specific files only
git commit -m "feat: ..."     # Descriptive commit
```

---

## 🎯 **Decision Tree: "What should I do now?"**

### **Starting a new day?**
→ Open [DAILY_EXECUTION.md](./DAILY_EXECUTION.md) and plan your day

### **Don't know what to work on?**
→ Check [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) for next priority

### **Starting a new feature?**
→ Run `./scripts/create-feature.sh [feature-name]`

### **Working on existing feature?**
→ Open `docs/features/[feature-name]/planning.md`

### **Need to log progress?**
→ Update `docs/features/[feature-name]/execution-log.md`

### **Completed a feature?**
→ Update [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) status to ✅ Complete

### **End of week?**
→ Update [WEEKLY_PLANNING.md](./WEEKLY_PLANNING.md) with progress

---

## 🔍 **Quick Answers**

- **What's my daily workflow?** → [DAILY_EXECUTION.md](./DAILY_EXECUTION.md)
- **What should I work on next?** → [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md)
- **How do I plan a feature?** → [FEATURE_LIFECYCLE_SYSTEM.md](./FEATURE_LIFECYCLE_SYSTEM.md)
- **What's the current status?** → [WEEKLY_PLANNING.md](./WEEKLY_PLANNING.md)
- **How do I implement X?** → [features/fintrack-platform-v5-specification.md](./features/fintrack-platform-v5-specification.md)
- **How do I deploy?** → [deployment/DEPLOYMENT_MANUAL.md](./deployment/DEPLOYMENT_MANUAL.md)

---

## 💡 **Pro Tips**

### **Daily Habits**
- **Morning**: Always start with [DAILY_EXECUTION.md](./DAILY_EXECUTION.md)
- **Evening**: Always log progress before closing
- **Commit**: Use descriptive messages with file lists

### **Weekly Habits**
- **Monday**: Review and update [WEEKLY_PLANNING.md](./WEEKLY_PLANNING.md)
- **Friday**: Update [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) with completed features

### **Feature Development**
- **Never code without planning** - Fill out `planning.md` first
- **Document as you go** - Update `execution-log.md` daily
- **Test early and often** - Don't wait until the end

---

*🔖 **Bookmark this page** for instant access to your daily workflow!*
