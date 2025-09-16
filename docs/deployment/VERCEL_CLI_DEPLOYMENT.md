 # Vercel CLI Deployment Guide

## 🚀 **Direct Deployment to Staging**

This guide covers deploying FinTrack v5 directly to Vercel using the CLI, bypassing GitHub Actions for faster iteration and clearer error messages.

---

## 📋 **Prerequisites**

### **1. Install Vercel CLI**
```bash
# Install globally
npm install -g vercel

# Verify installation
vercel --version
```

### **2. Login to Vercel**
```bash
# Login (opens browser for authentication)
vercel login

# Verify you're logged in
vercel whoami
```

### **3. Link Project (One-time setup)**
```bash
# In your project root
cd /path/to/fintrack-platform-v5

# Link to existing Vercel project
vercel link

# Follow prompts:
# ? Set up "~/fintrack-platform-v5"? [Y/n] y
# ? Which scope should contain your project? [Your Team]
# ? Link to existing project? [Y/n] y
# ? What's the name of your existing project? fintrack-platform-v5
```

---

## 🎯 **Deployment Commands**

### **Deploy to Staging (Preview)**
```bash
# Deploy to preview URL (staging)
vercel

# Or with specific environment variables
vercel --env DATABASE_URL="$STAGING_DATABASE_URL"
```

### **Deploy to Production**
```bash
# Deploy to production domain
vercel --prod

# Or with specific environment variables
vercel --prod --env DATABASE_URL="$PRODUCTION_DATABASE_URL"
```

### **Deploy with Custom Environment**
```bash
# Deploy with staging database
vercel \
  --env DATABASE_URL="postgresql://postgres.xxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres" \
  --env JWT_SECRET="your-jwt-secret" \
  --env NEXTAUTH_SECRET="your-nextauth-secret" \
  --env NEXTAUTH_URL="https://your-preview-url.vercel.app"
```

---

## 🔧 **Environment Variables Setup**

### **Required Environment Variables**
```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="your-jwt-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="https://fintrack-platform-v5.vercel.app"

# Optional: Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"
```

### **Set Environment Variables in Vercel**
```bash
# Set environment variables via CLI
vercel env add DATABASE_URL
# Paste your staging database URL when prompted

vercel env add JWT_SECRET
# Paste your JWT secret when prompted

vercel env add NEXTAUTH_SECRET
# Paste your NextAuth secret when prompted

# List all environment variables
vercel env ls
```

---

## 📝 **Pre-Deployment Checklist**

### **Local Quality Checks**
```bash
# 1. TypeScript compilation
npm run type-check
# ✅ Should pass with no errors

# 2. Build test
npm run build
# ✅ Should complete successfully

# 3. Test suite (optional but recommended)
npm test
# ✅ Should pass all tests

# 4. Lint check (optional)
npm run lint
# ⚠️ May have warnings, but shouldn't block deployment
```

### **Database Readiness**
```bash
# Ensure database is accessible
# Test connection with a simple query
npx prisma db pull --schema=./prisma/schema.prisma
# ✅ Should connect successfully

# Generate Prisma client (if needed)
npx prisma generate
```

---

## 🚀 **3-Step Deployment Workflow (Based on v4.1 Success)**

### **📋 Complete Deployment - 3 Simple Steps**

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
- ✅ **Deployment URLs are automatically updated in documentation**

---

### **STEP 1: Pre-Deployment Verification** 🛡️
```bash
npm run pre-deploy
```

**What this step does:**
- ✅ **Code Quality Checks**: Runs ESLint to catch code quality issues
- ✅ **Type Safety**: Runs TypeScript compiler to verify type correctness
- ✅ **Test Suite**: Executes all unit and integration tests
- ✅ **Production Build**: Creates optimized production build to catch build errors
- ✅ **Git Status Check**: Ensures no uncommitted changes exist

**Why this step is critical:**
- Prevents deploying broken code to production
- Ensures all tests pass before deployment
- Validates that the production build works correctly
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
- ✅ **Release Folder Creation**: Creates `docs/releases/v[version]/` directory
- ✅ **Changelog Generation**: Updates main `CHANGELOG.md` with release summary
- ✅ **Detailed Release Notes**: Creates comprehensive release documentation
- ✅ **Deployment Notes**: Creates deployment-specific instructions

**Files created/updated:**
- `CHANGELOG.md` (root level - user-facing summary)
- `docs/releases/v[version]/CHANGELOG.md` (detailed release notes)
- `docs/releases/v[version]/DEPLOYMENT_NOTES.md` (deployment instructions)

**Why this step is required:**
- Documents what's being deployed for team awareness
- Creates historical record of releases
- Ensures proper release communication
- Must be done BEFORE deployment to capture pre-deployment state

---

### **STEP 3: Deploy to Production** 🚀
```bash
npm run deploy
```

**What this step does:**
- ✅ **Final Git Check**: Double-checks for uncommitted changes
- ✅ **Production Build**: Creates final optimized build for deployment
- ✅ **Git Release Tag**: Creates and pushes release tag (e.g., `v5.0.1-1726186234567`)
- ✅ **Vercel Deployment**: Deploys to Vercel production environment
- ✅ **URL Capture**: Automatically captures the deployed URL from Vercel
- ✅ **Documentation Updates**: Updates `CHANGELOG.md` with live URL
- ✅ **Auto-Commit**: Commits documentation updates to git
- ✅ **Auto-Push**: Pushes changes and tags to remote repository
- ✅ **Deployment Summary**: Displays final deployment information with rollback commands

**Why this step is powerful:**
- Fully automated deployment process
- No manual URL updates required
- Automatic documentation maintenance
- Complete audit trail of deployments
- Immediate availability of live demo links

---

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

#### **Build Failures**
```bash
# Error: TypeScript compilation failed
npm run type-check
# Fix TypeScript errors locally first

# Error: Missing environment variables
vercel env ls
# Verify all required env vars are set
```

#### **Database Connection Issues**
```bash
# Error: Can't connect to database
# Check if DATABASE_URL is correct
vercel env ls | grep DATABASE_URL

# Test connection locally
npx prisma db pull
```

#### **Authentication Issues**
```bash
# Error: JWT/NextAuth errors
# Verify auth secrets are set
vercel env ls | grep SECRET

# Ensure NEXTAUTH_URL matches deployment URL
vercel env add NEXTAUTH_URL
# Set to: https://your-actual-deployment-url.vercel.app
```

### **Debugging Commands**
```bash
# View deployment logs
vercel logs [deployment-url]

# View function logs (for API routes)
vercel logs --follow

# Inspect deployment details
vercel inspect [deployment-url]
```

---

## 📊 **Deployment Status & URLs**

### **Current Deployments**
| Environment | URL | Status | Last Updated |
|-------------|-----|--------|--------------|
| Production | https://fintrack-platform-v5.vercel.app | 🟢 Live | 2025-09-16 |
| Staging | https://fintrack-platform-v5-preview.vercel.app | 🟡 Testing | 2025-09-16 |

### **Quick Status Check**
```bash
# List all deployments
vercel ls

# Get deployment status
vercel inspect [deployment-url]
```

---

## 🎯 **Daily Development Workflow**

### **Feature Development Cycle**
```bash
# 1. Develop feature locally
npm run dev

# 2. Test locally
# Verify feature works as expected

# 3. Quick quality check
npm run build

# 4. Deploy to staging for testing
vercel

# 5. Test on staging URL
# Verify feature works in production environment

# 6. If good, deploy to production
vercel --prod

# 7. Commit and push to git (for backup)
git add .
git commit -m "feat: deploy feature X to production"
git push origin main
```

---

## 🔄 **Migration from GitHub Actions**

### **Disable GitHub Actions (Optional)**
If you want to completely disable the GitHub Actions workflow:

```bash
# Rename the workflow file to disable it
mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled

# Or delete it entirely
rm .github/workflows/deploy.yml

# Commit the change
git add .
git commit -m "disable GitHub Actions deployment - using Vercel CLI"
git push origin main
```

### **Keep GitHub Actions for Quality Checks Only**
Alternatively, modify the workflow to only run quality checks without deployment:

```yaml
# .github/workflows/quality-checks.yml
name: Quality Checks Only
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run type-check
      - run: npm test
      # No deployment step
```

---

## 💡 **Best Practices**

### **Environment Management**
- 🎯 **Always test on staging first** before production
- 🔒 **Keep secrets secure** - use `vercel env add` not hardcoded values
- 📝 **Document environment variables** in this file when adding new ones

### **Deployment Safety**
- ✅ **Run build locally** before deploying
- 🧪 **Test critical paths** on staging before production
- 📱 **Check mobile responsiveness** on staging URL
- 🔄 **Keep git history clean** with meaningful commit messages

### **Performance**
- ⚡ **Vercel CLI is fast** - deployments typically complete in 30-60 seconds
- 🎯 **Preview deployments** are perfect for testing without affecting production
- 📊 **Monitor deployment logs** if issues arise

---

## 🆘 **Emergency Procedures**

### **Rollback Production Deployment**
```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote [previous-deployment-url]
```

### **Quick Hotfix Deployment**
```bash
# Make urgent fix
# Test locally: npm run build

# Deploy directly to production (skip staging for emergencies)
vercel --prod

# Verify fix is live
curl https://fintrack-platform-v5.vercel.app/api/health
```

---

*This deployment method gives you immediate feedback, clear error messages, and full control over when and what gets deployed. No more waiting for GitHub Actions or deciphering cryptic CI logs!*
