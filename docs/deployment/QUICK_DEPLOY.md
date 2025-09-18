# FinTrack v5 - Quick Deploy Guide

## 🚀 **Fast Track Deployment**

### **Prerequisites** (One-time setup)
```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link
```

---

## **Standard Deployment (No DB Changes)**

```bash
# 1. Pre-flight checks
npm run pre-deploy

# 2. Generate release docs
npm run release

# 3. Deploy
npm run deploy
```

**Done!** ✅ Your app is live.

---

## **Deployment with Database Migration**

### **Step 1: Check if migration needed**
```bash
ls docs/releases/v*/migration.sql
```

If no migration files → use standard deployment above.

### **Step 2: Database Migration**
```bash
# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f docs/releases/v5.x.x/migration.sql

# Verify migration worked
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM transactions;"
```

### **Step 3: Deploy Application**
```bash
# Generate release docs and deploy
npm run pre-deploy
npm run release
npm run deploy
```

**Done!** ✅ Your app is live with database updated.

---

## **Generate QA Test Plan**

```bash
# Generate QA test plan for current version
npm run generate-qa-plan -- --version=5.0.2

# Or generate for all completed features
npm run generate-qa-plan -- --all
```

## **Feature Development Workflow**

```bash
# ALWAYS use this script for new features
./scripts/create-feature.sh feature-name

# Example
./scripts/create-feature.sh user-notifications
```

**Why this matters:**
- ✅ Creates proper directory structure
- ✅ Uses correct QA test case format (required for release validation)
- ✅ Includes all required template files
- ✅ Prevents formatting inconsistencies

**Output**: `docs/releases/v5.0.2/QA_TEST_PLAN.md` - Hand this to QA team

---

## **What Gets Auto-Generated**

When you run `npm run release`, it creates:
- ✅ **Release Notes** → `docs/releases/release-v5.x.x.md`
- ✅ **Deployment Log** → `docs/deployment/DEPLOYMENT_LOG.md` (updated)
- ✅ **Git Tags** → For easy rollback reference

When you run the QA script:
- ✅ **QA Test Plan** → `docs/releases/v5.x.x/QA_TEST_PLAN.md`
- ✅ **All Test Cases** → Extracted from implementation docs

---

## **Emergency Rollback**

```bash
# Rollback deployment
vercel rollback --previous

# Rollback database (if migration was run)
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME --clean backup_YYYYMMDD_HHMMSS.sql
```

---

## **Environment Variables** (One-time setup)

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

---

## **Troubleshooting**

**Build fails?**
```bash
npm run build  # Check errors locally first
```

**Database connection fails?**
```bash
npx prisma db pull  # Test connection
```

**Migration fails?**
```bash
# Check what went wrong
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"
# Restore backup and try again
```

---

**That's it!** For detailed troubleshooting, see [DEVOPS_GUIDEBOOK.md](DEVOPS_GUIDEBOOK.md).
