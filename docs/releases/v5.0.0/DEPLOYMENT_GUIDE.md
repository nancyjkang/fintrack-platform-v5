# FinTrack v5.0.0 Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions for deploying FinTrack v5.0.0, including database schema setup and application deployment.

## 📋 Prerequisites

- [ ] Supabase project created
- [ ] Vercel account with project configured
- [ ] GitHub repository secrets configured
- [ ] Node.js 20+ installed locally

## 🗄️ Database Deployment

### Option 1: Automated SQL Script (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to **SQL Editor**

2. **Run Complete Schema Script**
   ```sql
   -- Copy and paste the entire contents of:
   -- docs/releases/v5.0.0/database-schema-complete.sql
   ```

3. **Verify Deployment**
   - Check that 8 tables were created
   - Verify all indexes and constraints are active
   - Confirm no errors in the output

### Option 2: Prisma Migrations (If Connectivity Works)

```bash
# Set your database URL
export STAGING_DATABASE_URL="your-supabase-connection-string"

# Run migrations
npm run db:migrate:prod
```

## 🚀 Application Deployment

### GitHub Actions (Automatic)

1. **Ensure GitHub Secrets are Set**
   ```
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-org-id
   VERCEL_PROJECT_ID=your-project-id
   STAGING_DATABASE_URL=your-supabase-url
   JWT_SECRET=your-jwt-secret
   NEXTAUTH_SECRET=your-nextauth-secret
   ```

2. **Push to Main Branch**
   ```bash
   git push origin main
   ```

3. **Monitor Deployment**
   - Check GitHub Actions for deployment status
   - Verify Vercel deployment completes successfully

### Manual Deployment

```bash
# Build application
npm run build

# Deploy to Vercel
npm run deploy
```

## 🧪 Post-Deployment Testing

### 1. Database Connectivity Test

```bash
# Test database connection
DATABASE_URL="your-supabase-url" npx prisma db execute --stdin <<< "SELECT 1 as test;"
```

### 2. Application Health Check

Visit your deployed application:
- **Staging**: https://fintrack-platform-v5.vercel.app
- **Production**: https://fintrack.vercel.app

### 3. Authentication Test

1. Navigate to `/auth/register`
2. Create a test account
3. Verify login functionality
4. Check dashboard loads correctly

### 4. Database Operations Test

1. Create a test account (financial account)
2. Add a test transaction
3. Verify data persists correctly
4. Check all CRUD operations work

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors

**Error**: `password column does not exist`
**Solution**: Re-run the complete schema script

**Error**: `Can't reach database server`
**Solution**:
1. Check Supabase project is active
2. Verify connection string is correct
3. Use connection pooling URL (port 6543)

#### Deployment Failures

**Error**: `Project not found`
**Solution**: Update `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` secrets

**Error**: `Build failed`
**Solution**:
1. Check TypeScript compilation locally
2. Run `npm run type-check`
3. Fix any type errors

### Recovery Procedures

#### Database Schema Reset

If the database gets into a bad state:

1. Go to Supabase SQL Editor
2. Run the complete schema script again
3. This will reset everything to a clean state

#### Application Rollback

```bash
# Rollback to previous Vercel deployment
npm run rollback
```

## 📊 Monitoring

### Health Checks

- [ ] Application loads without errors
- [ ] Authentication works
- [ ] Database operations succeed
- [ ] All API endpoints respond correctly

### Performance Checks

- [ ] Page load times < 3 seconds
- [ ] Database queries complete quickly
- [ ] No memory leaks or excessive resource usage

## 🔄 Rollback Plan

If deployment fails:

1. **Application Rollback**
   ```bash
   vercel rollback --previous
   ```

2. **Database Rollback**
   - Restore from backup if available
   - Or re-run previous schema version

## 📝 Release Notes

### v5.0.0 Features

- ✅ Complete database schema with all tables
- ✅ User authentication with password support
- ✅ Multi-tenant architecture
- ✅ Account management with net worth categorization
- ✅ Transaction tracking and categorization
- ✅ Spending goals and budgeting
- ✅ Balance anchoring system

### Database Schema Changes

- Added `password` column to `users` table
- Added `net_worth_category` column to `accounts` table
- Created all foreign key relationships
- Added performance indexes
- Implemented multi-tenant data isolation

### Breaking Changes

- Database schema requires complete reset
- Authentication system updated
- API responses may have changed structure

## 🎉 Success Criteria

Deployment is successful when:

- [ ] All database tables created correctly
- [ ] Application deploys without errors
- [ ] Authentication flow works end-to-end
- [ ] All major features functional
- [ ] No critical errors in logs
- [ ] Performance meets requirements

---

**Version**: v5.0.0
**Date**: 2025-09-16
**Compatibility**: FinTrack v5.0.0+
**Database**: PostgreSQL 15+ (Supabase)
**Runtime**: Node.js 20+
