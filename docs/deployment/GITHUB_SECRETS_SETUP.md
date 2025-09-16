# GitHub Secrets Setup for CI/CD

This guide explains how to set up the required GitHub repository secrets for the CI/CD pipeline.

## 🔐 **Required Secrets**

### **Vercel Configuration**
These secrets are required for deploying to Vercel:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Your Vercel organization ID | Run `vercel whoami` or check project settings |
| `VERCEL_PROJECT_ID` | Your project ID | Check Vercel project settings |

### **Database Configuration**
Database URLs for different environments:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STAGING_DATABASE_URL` | Staging database connection | `postgresql://user:pass@host:5432/db_staging` |
| `PRODUCTION_DATABASE_URL` | Production database connection | `postgresql://user:pass@host:5432/db_production` |

### **Optional Secrets**
Additional secrets for enhanced functionality:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `CODECOV_TOKEN` | Code coverage reporting | No |
| `SLACK_WEBHOOK_URL` | Deployment notifications | No |
| `SENTRY_DSN` | Error tracking | No |

## 🛠️ **Setup Instructions**

### **Step 1: Get Vercel Credentials**

1. **Get Vercel Token:**
   ```bash
   # Install Vercel CLI if not already installed
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Get your organization and project info
   vercel whoami
   ```

2. **Create API Token:**
   - Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
   - Click "Create Token"
   - Name it "GitHub Actions CI/CD"
   - Copy the token (you won't see it again!)

3. **Get Organization and Project IDs:**
   ```bash
   # In your project directory
   vercel link

   # This will show your org and project IDs
   # Or check .vercel/project.json after linking
   cat .vercel/project.json
   ```

### **Step 2: Set Up Database URLs**

#### **For Staging (Supabase Free Tier)**
1. Go to [Supabase](https://supabase.com)
2. Create a new project for staging
3. Go to Settings → Database
4. Copy the connection string
5. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

#### **For Production (Recommended: Google Cloud SQL)**
1. Create a Cloud SQL PostgreSQL instance
2. Create a database user
3. Get the connection string
4. Format: `postgresql://[user]:[password]@[host]:5432/[database]`

### **Step 3: Add Secrets to GitHub**

1. **Go to Repository Settings:**
   - Navigate to your GitHub repository
   - Click "Settings" tab
   - Click "Secrets and variables" → "Actions"

2. **Add Each Secret:**
   - Click "New repository secret"
   - Enter the secret name (exactly as shown above)
   - Paste the secret value
   - Click "Add secret"

3. **Required Secrets Checklist:**
   - [ ] `VERCEL_TOKEN`
   - [ ] `VERCEL_ORG_ID`
   - [ ] `VERCEL_PROJECT_ID`
   - [ ] `STAGING_DATABASE_URL`
   - [ ] `PRODUCTION_DATABASE_URL`

## 🧪 **Testing the Setup**

### **Test Staging Deployment**
1. Push to `main` or `develop` branch
2. Check GitHub Actions tab
3. Verify all steps pass
4. Check deployment URL in action logs

### **Test Production Deployment**
1. Ensure staging deployment works
2. Push to `main` branch
3. Manually approve production deployment (if configured)
4. Verify production health checks pass

## 🔒 **Security Best Practices**

### **Secret Management**
- ✅ Use different credentials for each environment
- ✅ Rotate secrets regularly (quarterly)
- ✅ Use least-privilege access
- ✅ Monitor secret usage in audit logs

### **Database Security**
- ✅ Use SSL connections (`?sslmode=require`)
- ✅ Restrict database access by IP
- ✅ Use strong, unique passwords
- ✅ Enable database audit logging

### **Vercel Security**
- ✅ Use scoped tokens (project-specific)
- ✅ Set token expiration dates
- ✅ Monitor deployment logs
- ✅ Enable Vercel security headers

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Invalid Vercel Token"**
```bash
# Verify token is correct
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.vercel.com/v2/user

# Should return user info, not 401/403
```

#### **"Database Connection Failed"**
```bash
# Test database connection locally
psql "YOUR_DATABASE_URL"

# Check if IP is whitelisted
# Check if SSL is required
```

#### **"Project Not Found"**
```bash
# Verify project ID
vercel projects ls

# Make sure VERCEL_ORG_ID and VERCEL_PROJECT_ID match
```

### **Debug Commands**
```bash
# Test Vercel deployment locally
vercel --token YOUR_TOKEN

# Test database migration
npm run migrate:staging -- --dry-run

# Test full deployment pipeline
npm run deploy:staging
```

## 📋 **Environment Variables Checklist**

Copy this checklist and verify each secret is properly set:

### **Vercel Secrets**
- [ ] `VERCEL_TOKEN` - API token from Vercel dashboard
- [ ] `VERCEL_ORG_ID` - Organization ID (starts with `team_` or `user_`)
- [ ] `VERCEL_PROJECT_ID` - Project ID (random string)

### **Database Secrets**
- [ ] `STAGING_DATABASE_URL` - Staging database connection string
- [ ] `PRODUCTION_DATABASE_URL` - Production database connection string

### **Validation**
- [ ] All secrets are added to GitHub repository
- [ ] Secret names match exactly (case-sensitive)
- [ ] Database URLs are accessible from GitHub Actions
- [ ] Vercel token has correct permissions

## 🔄 **Next Steps**

After setting up secrets:

1. **Test the Pipeline:**
   ```bash
   # Make a small change and push
   git add .
   git commit -m "test: trigger CI/CD pipeline"
   git push origin main
   ```

2. **Monitor First Deployment:**
   - Watch GitHub Actions tab
   - Check each step completes successfully
   - Verify staging deployment works

3. **Set Up Monitoring:**
   - Configure health check alerts
   - Set up error tracking (Sentry)
   - Enable deployment notifications

4. **Document Your Setup:**
   - Note which database provider you chose
   - Document any custom configuration
   - Share access with team members (if applicable)

---

**Need Help?** Check the [main deployment guide](./README.md) or [CI/CD workflow documentation](./CI_CD_WORKFLOW.md).
