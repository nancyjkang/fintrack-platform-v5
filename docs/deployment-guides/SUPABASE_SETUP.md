# Supabase Multi-Environment Setup Guide

## 🎯 **Current Configuration**

FinTrack v5 uses a **2-database setup** for optimal development workflow:

- **Development**: `fintrack-v5-development` (isolated for local dev)
- **Staging + Production**: `fintrack-v5-staging` (shared environment)

## 📋 **Environment Variables Setup**

### **1. Local Development (.env.local)**
```bash
# Development Database (separate project)
DATABASE_URL_DEVELOPMENT="postgresql://postgres:[DEV_PASSWORD]@db.[DEV_PROJECT_REF].supabase.co:5432/postgres"

# Staging Database (shared with production)
DATABASE_URL_STAGING="postgresql://postgres:[STAGING_PASSWORD]@db.[STAGING_PROJECT_REF].supabase.co:5432/postgres"

# Optional: Set production to same as staging for now
DATABASE_URL_PRODUCTION="postgresql://postgres:[STAGING_PASSWORD]@db.[STAGING_PROJECT_REF].supabase.co:5432/postgres"
```

### **2. Vercel Environment Variables**
Configure in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL_DEVELOPMENT` | `postgresql://postgres:[DEV_PASSWORD]@db.[DEV_REF].supabase.co:5432/postgres` | Development |
| `DATABASE_URL_STAGING` | `postgresql://postgres:[STAGING_PASSWORD]@db.[STAGING_REF].supabase.co:5432/postgres` | Preview |
| `DATABASE_URL_PRODUCTION` | `postgresql://postgres:[STAGING_PASSWORD]@db.[STAGING_REF].supabase.co:5432/postgres` | Production |

## 🔧 **Getting Your Database URLs**

### **From Supabase Dashboard:**
1. Go to your Supabase project
2. Navigate to **Settings** → **Database**
3. Copy the **Connection string** → **URI**
4. Replace `[YOUR-PASSWORD]` with your actual database password

### **Example URLs:**
```bash
# Development Project
DATABASE_URL_DEVELOPMENT="postgresql://postgres:your_dev_password@db.abcdefghijklmnop.supabase.co:5432/postgres"

# Staging Project (shared with production)
DATABASE_URL_STAGING="postgresql://postgres:your_staging_password@db.qrstuvwxyzabcdef.supabase.co:5432/postgres"
DATABASE_URL_PRODUCTION="postgresql://postgres:your_staging_password@db.qrstuvwxyzabcdef.supabase.co:5432/postgres"
```

## 🚀 **Setup Steps**

### **Step 1: Get Database URLs**
1. **Development**: Get URL from `fintrack-v5-development` project
2. **Staging**: Get URL from `fintrack-v5-staging` project
3. **Production**: Use same URL as staging for now

### **Step 2: Update Local Environment**
```bash
# Create/update .env.local
echo "DATABASE_URL_DEVELOPMENT=postgresql://postgres:[DEV_PASSWORD]@db.[DEV_REF].supabase.co:5432/postgres" >> .env.local
echo "DATABASE_URL_STAGING=postgresql://postgres:[STAGING_PASSWORD]@db.[STAGING_REF].supabase.co:5432/postgres" >> .env.local
echo "DATABASE_URL_PRODUCTION=postgresql://postgres:[STAGING_PASSWORD]@db.[STAGING_REF].supabase.co:5432/postgres" >> .env.local
```

### **Step 3: Update Vercel Environment Variables**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. **Remove** the existing `DATABASE_URL` (if it exists for all environments)
3. **Add** the three new environment-specific variables

### **Step 4: Test Configuration**
```bash
# Test local development
npm run dev

# Check health endpoint
curl http://localhost:3000/api/health
```

## 🔍 **Verification**

### **Check Environment Detection:**
The `/api/health` endpoint will show which database is being used:

```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "development",
  "version": "5.1.0"
}
```

### **Console Logs:**
Watch for these logs during startup:
```bash
🔗 Using development database          # Local development
🔗 Using staging database             # Staging deployments
🔗 Using production database (shared with staging)  # Production deployments
```

## 🎯 **Benefits of This Setup**

### **✅ Advantages:**
- **Isolated Development**: Local dev won't affect staging/production
- **Shared Staging/Production**: Consistent data for testing production deployments
- **Cost Effective**: Only 2 Supabase projects instead of 3
- **Simple Migration**: Easy to separate production later when needed

### **🔄 Future Migration:**
When ready to separate production:
1. Create `fintrack-v5-production` project
2. Export schema/data from staging
3. Update `DATABASE_URL_PRODUCTION` in Vercel
4. Deploy production with new database

## 🛠 **Schema Management**

### **Development Database Setup:**
```bash
# Apply schema to development database
npx prisma db push --schema=./prisma/schema.prisma

# Seed with test data
npm run seed:dev
```

### **Staging Database:**
- Keep current schema and data (already working)
- This will be used for both staging and production deployments

## 🚨 **Important Notes**

1. **Password Security**: Never commit database passwords to git
2. **Environment Isolation**: Development is completely separate
3. **Shared Production**: Production and staging share the same database for now
4. **Migration Path**: Easy to separate production database later

---

**Next Steps:** Get your database URLs and update the environment variables!
