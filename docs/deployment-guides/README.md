# FinTrack v5 - Deployment Guides

## 🚀 **Overview**

This directory contains **deployment procedures and how-to guides** for FinTrack Platform v5.

> **Note**: For environment status and version tracking, see [`docs/deployment-tracking/`](../deployment-tracking/README.md)

## 📋 **🆕 NEW: Complete Deployment Playbook**

**📖 [DEPLOYMENT_PLAYBOOK.md](./DEPLOYMENT_PLAYBOOK.md)** - **START HERE** for the complete deployment workflow from feature development to production release, including automation strategies.

**🤖 [AUTOMATION_SETUP.md](./AUTOMATION_SETUP.md)** - Guide for setting up automated deployments with GitHub Actions and Vercel integration.

**🗄️ [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Multi-environment Supabase database configuration guide.

---

FinTrack v5 uses a **3-step Vercel CLI deployment process** based on the proven v4.1 workflow. This approach provides immediate feedback, clear error messages, and full control over deployments.

---

## 📋 **Quick Start: 3-Step Deployment**

```bash
# STEP 1: Pre-Deployment Verification
npm run pre-deploy

# STEP 2: Generate Release Documentation
npm run release

# STEP 3: Deploy to Production
npm run deploy
```

**Total Time**: ~5-7 minutes for complete deployment

---

## 📋 **Staging Deployment Resources**

For staging environment deployments, use these specialized guides:

- **[staging-deployment-checklist.md](./staging-deployment-checklist.md)** - Complete step-by-step checklist for staging deployments
- **[staging-deployment-template.md](./staging-deployment-template.md)** - Template for updating deployment documentation

---

## 🎯 **Why We Chose Vercel CLI Over GitHub Actions**

### **Problems with GitHub Actions**
- ❌ **Cryptic error messages** - Hard to debug TypeScript/build failures
- ❌ **Slow feedback loop** - Wait 2-3 minutes to see if deployment failed
- ❌ **Complex configuration** - Multiple environment variables, secrets management
- ❌ **Limited control** - Can't easily test specific steps locally

### **Benefits of Vercel CLI**
- ✅ **Immediate feedback** - See errors instantly with clear messages
- ✅ **Local testing** - Run all checks locally before deploying
- ✅ **Simple setup** - Just `npm install -g vercel` and login
- ✅ **Full control** - Deploy exactly when you want to
- ✅ **Same infrastructure** - Still uses Vercel's excellent platform

---

## 📖 **Detailed Documentation**

### **Complete Guide**
- [Vercel CLI Deployment Guide](VERCEL_CLI_DEPLOYMENT.md) - Comprehensive setup and usage
- [Database Deployment Guide](DATABASE_DEPLOYMENT_GUIDE.md) - Database setup and environment configuration

### **Legacy Documentation**
- [GitHub Actions Workflow](CI_CD_WORKFLOW_DEPRECATED.md) - Deprecated approach (historical reference)
- [v4.1 Deployment Manual](../../fintrack-platform-v4.1/docs/deployment/DEPLOYMENT_MANUAL.md) - Original 3-step process inspiration

---

## 🔧 **Setup Instructions**

### **One-Time Setup**
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link project (in project root)
vercel link
```

### **Environment Variables**
Set these in Vercel dashboard or via CLI:
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

---

## 🚀 **Daily Deployment Workflow**

### **Development → Staging → Production**

```bash
# 1. Develop locally
npm run dev

# 2. Test locally
npm run build

# 3. Deploy to staging for testing
npm run deploy:staging  # vercel (creates preview URL)

# 4. Test staging deployment
# Visit preview URL and verify functionality

# 5. Deploy to production (if staging looks good)
npm run pre-deploy     # Comprehensive checks
npm run release        # Generate documentation
npm run deploy         # Deploy to production
```

---

## 🛡️ **Safety Features**

### **Pre-Deployment Checks**
- ✅ **Git Status**: Ensures no uncommitted changes
- ✅ **TypeScript**: Compilation must pass
- ✅ **Tests**: Full test suite must pass
- ✅ **Build**: Production build must succeed
- ✅ **Database**: Connection verification

### **Automatic Documentation**
- ✅ **Release Notes**: Auto-generated for each version
- ✅ **Deployment Log**: Historical record with rollback commands
- ✅ **URL Updates**: Live URLs automatically updated in docs
- ✅ **Git Tags**: Release tags for easy rollback

### **Rollback Options**
```bash
# Quick rollback
vercel rollback --previous

# Git-based rollback
git reset --hard [previous-tag]
vercel --prod --force
```

---

## 📊 **Deployment Status**

| Environment | URL | Status | Last Updated |
|-------------|-----|--------|--------------|
| Production | https://fintrack-platform-v5.vercel.app | 🟡 Pending | 2025-09-16 |
| Staging | https://fintrack-platform-v5-preview.vercel.app | 🟡 Testing | 2025-09-16 |

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Run locally to see detailed errors
npm run build

# Check TypeScript errors
npm run type-check

# Fix ESLint issues (warnings OK, errors block deployment)
npm run lint
```

#### **Database Connection**
```bash
# Test database connection
npx prisma db pull

# Verify environment variables
vercel env ls
```

#### **Authentication Issues**
```bash
# Re-login to Vercel
vercel login

# Verify project linking
vercel link
```

---

## 📈 **Performance Metrics**

### **Deployment Times**
- **STEP 1** (pre-deploy): ~2-3 minutes
- **STEP 2** (release): ~30 seconds
- **STEP 3** (deploy): ~2-3 minutes
- **Total**: ~5-7 minutes

### **Success Criteria**
- ✅ Application loads without errors
- ✅ All core features functional
- ✅ No console errors
- ✅ Mobile responsiveness works
- ✅ Database connectivity verified

---

## 🎯 **Next Steps**

### **Immediate Actions**
1. **Set up Vercel CLI** following the setup instructions
2. **Test the 3-step process** with a small change
3. **Verify staging deployment** works correctly
4. **Document any project-specific environment variables**

### **Future Improvements**
- **Automated testing** on staging before production
- **Performance monitoring** integration
- **Error tracking** with Sentry or similar
- **Deployment notifications** via Slack/email

---

---

## 🧹 **Documentation Cleanup (September 16, 2025)**

### **Files Removed**
- `GITHUB_SECRETS_SETUP.md` - Obsolete (GitHub Actions deprecated)
- `DEPLOYMENT_MANUAL.md` - Outdated (v4.1 specific, replaced by new guides)

### **Files Kept**
- `README.md` - Main deployment overview (this file)
- `VERCEL_CLI_DEPLOYMENT.md` - Comprehensive Vercel CLI guide
- `DATABASE_DEPLOYMENT_GUIDE.md` - Database setup and configuration
- `staging-deployment-checklist.md` - Step-by-step staging deployment checklist
- `staging-deployment-template.md` - Template for updating deployment documentation
- `CI_CD_WORKFLOW_DEPRECATED.md` - Historical reference

---

*This deployment system provides the reliability of v4.1's proven 3-step process with the simplicity and immediate feedback of direct Vercel CLI deployment.*
