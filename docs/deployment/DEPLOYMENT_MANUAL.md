# FinTrack v5 Deployment Manual

## 🚀 **Quick Deployment Guide**

This manual covers the practical steps for deploying FinTrack v5 to production with proper rollback capabilities and CI/CD best practices.

### **📋 Complete Deployment Workflow - 3 Simple Steps**

```bash
# STEP 1: Pre-Deployment Verification
npm run pre-deploy

# STEP 2: Generate Release Documentation
npm run release

# STEP 3: Deploy to Production
npm run deploy
```

**Key Points:**
- ✅ **All 3 steps must be run in order**
- ✅ **Each step validates the previous step's requirements**
- ✅ **Includes database migration safety checks**
- ✅ **Environment variables are validated**
- ✅ **Deployment URLs are automatically updated in documentation**

---

## 🔍 **Detailed Step-by-Step Guide**

### **STEP 1: Pre-Deployment Verification** 🛡️
```bash
npm run pre-deploy
```

**What this step does:**
- ✅ **Code Quality Checks**: Runs ESLint to catch code quality issues
- ✅ **Type Safety**: Runs TypeScript compiler to verify type correctness
- ✅ **Test Suite**: Executes all unit and integration tests
- ✅ **Production Build**: Creates optimized production build with Prisma generation
- ✅ **Database Schema Validation**: Verifies Prisma schema integrity
- ✅ **Environment Variables Check**: Validates required environment variables
- ✅ **Data Backup**: Creates backup of current database state
- ✅ **Data Validation**: Verifies data integrity and structure
- ✅ **Git Status Check**: Ensures no uncommitted changes exist

**Why this step is critical:**
- Prevents deploying broken code to production
- Ensures all tests pass before deployment
- Validates that the production build works correctly
- Creates safety backup before any changes
- Enforces clean git state for proper version control

**If this step fails:**
- Fix any linting errors or type issues
- Ensure all tests are passing
- Resolve any build errors
- Commit any uncommitted changes
- Re-run `npm run pre-deploy` until it passes

---

### **STEP 2: Generate Release Documentation** 📝
```bash
npm run release
```

**What this step does:**
- ✅ **Version Detection**: Automatically reads version from `package.json`
- ✅ **Release Documentation**: Creates comprehensive release notes in `docs/releases/`
- ✅ **Migration Notes**: Documents any database schema changes
- ✅ **Environment Changes**: Lists new or modified environment variables
- ✅ **Breaking Changes**: Highlights any breaking changes or required actions
- ✅ **Rollback Instructions**: Provides specific rollback procedures for this release

**Files created/updated:**
- `docs/releases/latest.md` (summary with links to full release notes)
- `docs/releases/release-[version].md` (detailed release documentation)
- Git commit history analysis for change detection
- Database migration documentation (if applicable)

**Why this step is required:**
- Documents what's being deployed for team awareness
- Creates historical record of releases
- Provides QA testing guidelines
- Ensures proper release communication
- Must be done BEFORE deployment to capture pre-deployment state

**If this step fails:**
- Check that `package.json` has a valid version number
- Ensure the version folder doesn't already exist
- Verify write permissions in `docs/releases/` directory

---

### **STEP 3: Deploy to Production** 🚀
```bash
npm run deploy
```

**What this step does:**
- ✅ **Final Git Check**: Double-checks for uncommitted changes
- ✅ **Environment Validation**: Verifies all required environment variables are set
- ✅ **Database Migration Check**: Ensures database schema is up-to-date
- ✅ **Production Build**: Creates final optimized build with Prisma generation
- ✅ **Git Release Tag**: Creates and pushes release tag (e.g., `v5.0.0`)
- ✅ **Vercel Deployment**: Deploys to Vercel production environment
- ✅ **Health Checks**: Validates deployment is accessible and functional
- ✅ **Deployment Info**: Saves deployment metadata for tracking and rollback
- ✅ **Success Notification**: Displays deployment URL and next steps

**Automated documentation updates:**
- Replaces `[Live Demo - URL will be updated after deployment]` in `CHANGELOG.md`
- Updates `docs/deployment/DEPLOYMENT_LOG.md` with deployment record
- Commits these changes with message: "docs: update deployment URLs for v[version]"

**Why this step is powerful:**
- Fully automated deployment process
- No manual URL updates required
- Automatic documentation maintenance
- Complete audit trail of deployments
- Immediate availability of live demo links

**If this step fails:**
- Check Vercel CLI authentication: `vercel whoami`
- Verify internet connection for Vercel deployment
- Ensure no uncommitted changes exist
- Check that build process completes successfully

---

## 🔄 **CI/CD with Database Migrations**

### **✅ Yes, CI/CD with Database Migrations is Feasible!**

FinTrack v5 is designed for safe, automated deployments including database migrations.

#### **🛡️ Safe Migration Strategy**

**1. Non-Destructive Migrations (The Key)**
```sql
-- ✅ SAFE: Add new columns (backward compatible)
ALTER TABLE transactions ADD COLUMN category_id INTEGER;

-- ✅ SAFE: Create new tables
CREATE TABLE categories (...);

-- ❌ DANGEROUS: Drop columns (breaks old code)
ALTER TABLE transactions DROP COLUMN old_field;
```

**2. Two-Phase Migration Pattern**
```bash
# Phase 1: Add new, keep old (deploy code that uses both)
prisma migrate dev --name add_new_email_field

# Phase 2: After code deployment, migrate data and drop old
prisma migrate dev --name remove_old_email_field
```

#### **🚀 Automated CI/CD Pipeline**

**Vercel Deployment with Migrations:**
```bash
# In package.json build script (already configured):
"build": "prisma generate && next build"

# Vercel automatically runs this during deployment
# Prisma generates the client for the current schema
```

**Environment-Specific Migrations:**
- **Development**: `npm run db:migrate` (interactive)
- **Production**: `npm run db:migrate:prod` (non-interactive)
- **Vercel**: Automatic via build script

#### **🔒 Migration Safety Checklist**

Before any migration:
- [ ] **Backup database** (automatic in pre-deploy)
- [ ] **Test migration locally** first
- [ ] **Verify rollback plan** exists
- [ ] **Check for breaking changes**
- [ ] **Validate data integrity** after migration

#### **📊 Database Migration Workflow**

```bash
# 1. Create migration locally
npm run db:migrate

# 2. Test the migration
npm run test

# 3. Deploy (migration runs automatically)
npm run deploy

# 4. Verify in production
# Check logs and test functionality
```

---

## 📋 **Pre-Deployment Checklist**

### **1. Verify Current State**
```bash
# Ensure you're in the project directory
cd fintrack-platform-v5

# Check git status
git status                    # Should be clean
git log --oneline -3         # Verify latest commits

# Run pre-deployment checks
npm run pre-deploy           # Runs: ci-check, backup-data, validate-data, git-status
```

### **2. Version Information**
```bash
# Check current version
cat package.json | grep version

# Check latest release tag
git tag --sort=-version:refname | head -5
```

## 📝 **Release Documentation Generation**

### **Step 1: Generate Release Documentation (Required)**

Before deploying, you must generate the changelog and release documentation:

```bash
# Option 1: Full release workflow (Recommended)
npm run release

# This runs:
# - npm run build          (build verification)
# - npm run type-check     (TypeScript validation)
# - npm audit              (security check)
# - npm run generate-release (changelog generation)
```

**What `npm run release` creates:**
- ✅ **Updates master CHANGELOG.md** (root level summary)
- ✅ **Creates detailed release notes** in `docs/releases/v[version]/CHANGELOG.md`
- ✅ **Generates QA test plan** based on changed files
- ✅ **Creates deployment notes** with rollback procedures

### **Step 2: Manual Release Documentation (Alternative)**

```bash
# Generate release docs for specific version
node scripts/generate-release-docs.js 0.7.3

# Or use the npm script
npm run generate-release
```

**Important:** The deployment script does NOT generate changelog automatically. You must run `npm run release` or `npm run generate-release` before deploying.

---

## 🌐 **Vercel Deployment (Recommended)**

### **Initial Setup (One-time)**
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Link project to Vercel (if not already linked)
vercel link
```

### **🔐 Environment Variables Setup**

**Required Environment Variables for Production:**
```bash
# Authentication (Required)
JWT_ACCESS_SECRET=your-secure-jwt-access-secret-here
JWT_REFRESH_SECRET=your-secure-jwt-refresh-secret-here

# Database (Required)
DATABASE_URL=your-production-database-url

# Application (Required)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Set Environment Variables in Vercel:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each variable with appropriate values
4. Generate secure JWT secrets:
   ```bash
   # Generate secure secrets
   node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   ```

### **Production Deployment**

#### **Option 1: Using Deployment Script (Recommended)**
```bash
# Deploy with full checks and automatic tagging
npm run deploy

# Or for preview deployment
npm run deploy:preview

# Or force deploy (skips pre-checks)
npm run deploy:force
```

#### **Option 2: Manual Vercel Deployment**
```bash
# 1. Ensure all changes are committed and pushed
git push origin main

# 2. Deploy to production
vercel --prod --yes

# 3. The deployment will:
#    - Run "prisma generate && next build"
#    - Deploy to production URL
#    - Provide deployment URL and preview
```

### **Alternative: Deploy from Local Build**
```bash
# If you want to deploy a specific local build
npm run build
vercel --prod --prebuilt
```

## 🏷️ **Release Tagging for Rollbacks**

### **Create Release Tag (Automatic)**
```bash
# This creates a timestamped tag for easy rollback
node scripts/create-release-tag.js

# Push the tag to repository
git push origin --tags

# Generate release documentation
node scripts/generate-release-docs.js 0.7.2
```

### **Manual Release Tag**
```bash
# Create a manual release tag
git tag -a v0.7.2-stable -m "Stable release v0.7.2 with CSV import fixes"
git push origin v0.7.2-stable
```

## 🔄 **Rollback Procedures**

### **Scenario 1: Rollback via Vercel Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your FinTrack project
3. Go to "Deployments" tab
4. Find the previous working deployment
5. Click "..." → "Promote to Production"

### **Scenario 2: Rollback via CLI**
```bash
# Quick rollback using npm script
npm run rollback

# Or manual Vercel rollback
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or rollback to previous deployment
vercel rollback --previous
```

### **Scenario 3: Git-based Rollback**
```bash
# Find the last working commit/tag
git tag --sort=-version:refname | head -5
git log --oneline -10

# Reset to last working state
git reset --hard v0.7.1-stable  # or specific commit hash

# Force deploy the rollback
vercel --prod --force

# Create a rollback commit (recommended)
git commit -m "rollback: revert to v0.7.1 due to critical issue"
git push origin main
```

## 🚨 **Emergency Rollback (Critical Issues)**

### **Immediate Actions**
```bash
# 1. Quick rollback via Vercel
vercel rollback --previous

# 2. Or reset git and redeploy
git reset --hard HEAD~1  # Go back 1 commit
vercel --prod --force

# 3. Notify users (if applicable)
# Update status page or send notifications
```

### **Post-Emergency Actions**
```bash
# 1. Investigate the issue
git diff HEAD~1 HEAD     # See what changed

# 2. Create hotfix branch
git checkout -b hotfix/critical-issue

# 3. Fix the issue
# Make necessary changes

# 4. Test thoroughly
npm run ci-check

# 5. Deploy hotfix
git checkout main
git merge hotfix/critical-issue
vercel --prod
```

## 📊 **Deployment Verification**

### **Post-Deployment Checks**
```bash
# 1. Run deployment verification
npm run deploy-check

# 2. Manual verification checklist:
```

**Manual Testing Checklist:**
- [ ] Application loads without errors
- [ ] Authentication system works (login/register)
- [ ] Main navigation works
- [ ] Dashboard displays correctly
- [ ] Transaction management works
- [ ] Account management functions
- [ ] No console errors
- [ ] Mobile responsiveness works
- [ ] Database connections are stable
- [ ] API endpoints respond correctly

### **Performance Verification**
```bash
# Check build size
npm run build
ls -la .next/static/chunks/

# Lighthouse audit (optional)
npx lighthouse https://your-app.vercel.app --output=html
```

### **📝 Post-Deployment Documentation Updates (AUTOMATED)**

The deployment script **automatically** updates documentation with the deployment URL:

```bash
# ✅ AUTOMATIC: The deploy script now handles this!
# When you run: npm run deploy
# The script automatically:
# 1. Captures the Vercel deployment URL
# 2. Updates CHANGELOG.md with the live demo URL
# 3. Updates docs/deployment/DEPLOYMENT_LOG.md with production URL
# 4. Commits and pushes the documentation updates
```

**What Gets Updated Automatically:**
- ✅ **CHANGELOG.md**: Replaces `*(Update with actual URL after deployment)*` with actual URL
- ✅ **Deployment Log**: Replaces `[Your production URL - update after deployment]` with actual URL
- ✅ **Git Commit**: Auto-commits with descriptive message including the URL
- ✅ **Git Push**: Automatically pushes documentation updates

**Manual Override (if needed):**
```bash
# Only needed if automatic update fails
nano CHANGELOG.md
nano docs/deployment/DEPLOYMENT_LOG.md
git add CHANGELOG.md docs/deployment/DEPLOYMENT_LOG.md
git commit -m "docs: manual deployment URL update for v$(cat package.json | grep version | cut -d'"' -f4)"
git push origin main
```

**Benefits of Automation:**
- ✅ **No human error** - URLs are captured directly from Vercel
- ✅ **Immediate updates** - Documentation updated right after deployment
- ✅ **Consistent format** - Same URL format every time
- ✅ **Zero manual work** - Completely hands-off process

## 🔧 **Alternative Deployment Platforms**

### **Netlify Deployment**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and link
netlify login
netlify link

# Deploy
npm run build
netlify deploy --prod --dir=.next
```

### **GitHub Pages (Static Export)**
```bash
# Modify next.config.js for static export
echo "/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true }
}
module.exports = nextConfig" > next.config.js

# Build and deploy
npm run build
# Upload .next folder to GitHub Pages
```

### **Docker Deployment**
```bash
# Build Docker image
docker build -t fintrack:latest .

# Run locally for testing
docker run -p 3000:3000 fintrack:latest

# Deploy to your container platform
# (AWS ECS, Google Cloud Run, etc.)
```

## 📝 **Deployment History Tracking**

### **Automated Deployment Tracking**

FinTrack v5 automatically tracks deployments in `deployments/` directory:

**Deployment Files Created:**
- `deployments/latest.json` - Current deployment info
- `deployments/deployment-[version].json` - Version-specific deployment record

**Example Deployment Record:**
```json
{
  "version": "5.0.0",
  "url": "https://fintrack-platform-v5.vercel.app",
  "timestamp": "2025-01-15T10:30:00Z",
  "preview": false,
  "commit": "abc123def456"
}
```

**Manual Deployment Log (Optional):**
Create `docs/deployment/DEPLOYMENT_LOG.md` for additional notes:

```markdown
# Deployment History

## v5.0.0 - 2025-01-15
- **Deployed**: 2025-01-15 10:30 UTC
- **Vercel URL**: https://fintrack-platform-v5.vercel.app
- **Git Commit**: abc123def456
- **Release Tag**: v5.0.0
- **Changes**:
  - ✅ Complete rewrite with modern architecture
  - ✅ PostgreSQL database with Prisma ORM
  - ✅ JWT-based authentication
  - ✅ Improved UI/UX with Radix components
  - ✅ Enhanced security and performance
- **Environment Variables**: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, DATABASE_URL
- **Status**: ✅ DEPLOYED SUCCESSFULLY
```

---

## 📋 **Quick Reference: 3-Step Deployment**

### **For Experienced Developers**
```bash
# The complete deployment process in 3 commands:
npm run pre-deploy    # Step 1: Verify everything is ready
npm run release       # Step 2: Generate documentation
npm run deploy        # Step 3: Deploy with automated URL updates
```

### **What Each Step Validates**
- **Step 1** → Code quality, tests, build, git status, data integrity
- **Step 2** → Release documentation, version management, QA plans
- **Step 3** → Final deployment, URL capture, documentation updates

### **Total Time Required**
- **Step 1**: ~2-3 minutes (depends on test suite)
- **Step 2**: ~30 seconds (documentation generation)
- **Step 3**: ~2-3 minutes (Vercel deployment + git operations)
- **Total**: ~5-7 minutes for complete deployment

### **What's Automated**
- ✅ All code quality checks and validations
- ✅ Production build verification
- ✅ Release documentation generation
- ✅ **Git release tag creation and pushing** (during Step 3)
- ✅ Vercel deployment with URL capture
- ✅ Automatic documentation updates with live URLs
- ✅ Git commits and pushes for documentation
- ✅ Complete deployment audit trail

---

## 🛡️ **Deployment Safety Rules**

### **Before Every Deployment**
1. ✅ **Step 1 completed successfully** (`npm run pre-deploy`)
   - All tests pass, build succeeds, no TypeScript/linting errors
   - Git status is clean, data is backed up and validated
2. ✅ **Step 2 completed successfully** (`npm run release`)
   - Release documentation generated for current version
   - Changelog updated, QA test plan created
3. ✅ **Ready for Step 3** (`npm run deploy`)
   - All changes committed, rollback plan identified

### **After Every Deployment**
1. ✅ Verify application loads
2. ✅ Test critical user flows
3. ✅ Check for console errors
4. ✅ Monitor for user reports
5. ✅ Update deployment log

### **Never Deploy If**
- ❌ **Step 1 failed** (`npm run pre-deploy` didn't pass)
- ❌ **Step 2 skipped** (`npm run release` not run)
- ❌ **Uncommitted changes exist** (caught by both Step 1 and Step 3)
- ❌ **No rollback plan identified**
- ❌ **Production environment issues** (Vercel authentication, network, etc.)
- ❌ You're unsure about the changes

## 🔍 **Monitoring & Alerts**

### **Post-Deployment Monitoring**
```bash
# Check Vercel deployment logs
vercel logs

# Monitor application performance
# Use Vercel Analytics or Google Analytics

# Set up error monitoring
# Consider: Sentry, LogRocket, or Vercel's built-in monitoring
```

### **User Data Safety**
Since FinTrack uses localStorage, user data is stored locally. However:

1. **Include data export features** for users
2. **Provide backup/restore functionality**
3. **Test data migration thoroughly**
4. **Include rollback instructions for users** if data format changes

## 📞 **Emergency Contacts & Resources**

### **Quick Reference**
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Repository**: [Your GitHub/GitLab URL]
- **Deployment Logs**: `vercel logs`
- **Rollback Command**: `vercel rollback --previous`

### **Available Deployment Scripts**
The project includes several deployment scripts for convenience:

#### **Database Scripts**
```bash
# Database setup and management
npm run db:setup                 # ./scripts/setup-dev-db.sh
npm run db:start                 # docker compose up -d postgres redis
npm run db:migrate               # prisma migrate dev
npm run db:migrate:prod          # prisma migrate deploy
npm run db:generate              # prisma generate
npm run db:seed                  # tsx prisma/seed.ts
```

#### **Release Documentation Scripts**
```bash
# Full release workflow (run BEFORE deployment)
npm run release                  # pre-release + generate-release

# Generate release documentation only
npm run generate-release         # node scripts/generate-release-docs.js

# Pre-release validation only
npm run pre-release             # build + type-check + audit (no changelog)
```

#### **Deployment Scripts**
```bash
# Full deployment with all checks
npm run deploy                    # ./scripts/deploy-to-vercel.sh

# Preview deployment (staging)
npm run deploy:preview           # ./scripts/deploy-to-vercel.sh --preview

# Force deployment (skip pre-checks)
npm run deploy:force             # ./scripts/deploy-to-vercel.sh --force

# Quick rollback
npm run rollback                 # vercel rollback --previous

# Pre-deployment validation
npm run pre-deploy              # ci-check + backup-data + validate-data + git-status

# Post-deployment verification
npm run deploy-check            # ci-check (smoke tests and validation)
```

#### **Development & Testing Scripts**
```bash
# Code quality and testing
npm run ci-check                 # lint + type-check + test + build
npm run test                     # jest
npm run test:coverage            # jest --coverage
npm run lint                     # next lint
npm run type-check               # tsc --noEmit
```

### **Emergency Rollback Script**
The deployment script automatically creates rollback commands. For manual emergency rollback:
```bash
#!/bin/bash
echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Rolling back to previous deployment..."
npm run rollback
echo "✅ Rollback complete"
echo "🔍 Investigating issue..."
git log --oneline -5
```

## 🎯 **Success Criteria**

A successful deployment means:
- ✅ Application is accessible at production URL
- ✅ All core features work as expected
- ✅ No critical errors in console
- ✅ User data is preserved
- ✅ Performance is acceptable
- ✅ Rollback plan is ready and tested

---

**Remember**: It's better to delay a deployment than to deploy broken code. When in doubt, don't deploy!
