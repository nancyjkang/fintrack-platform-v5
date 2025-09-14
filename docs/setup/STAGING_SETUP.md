# FinTrack v5 Staging Environment Setup

## 🎯 **Staging Strategy**

**Purpose**: Test your application with real cloud infrastructure before production deployment.

**Recommended**: **Supabase** (free tier perfect for staging)

---

## 🚀 **Option 1: Supabase (Recommended)**

### **Why Supabase for Staging?**
- ✅ **Free tier**: 500MB database, 2 projects
- ✅ **Zero setup**: Managed PostgreSQL
- ✅ **Built-in features**: Auth, real-time, storage
- ✅ **Great dashboard**: SQL editor, table viewer
- ✅ **Auto backups**: Point-in-time recovery

### **Step 1: Create Supabase Project**

1. **Sign up**: Go to [supabase.com](https://supabase.com)
2. **Create project**:
   - Name: `fintrack-v5-staging`
   - Database password: Generate strong password
   - Region: Choose closest to your users
3. **Wait**: Project creation takes ~2 minutes

### **Step 2: Get Connection Details**

```bash
# In Supabase Dashboard:
# Settings > Database > Connection string

# Copy the connection string (looks like):
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### **Step 3: Deploy Schema**

```bash
# Set staging environment variable
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Deploy your schema
npm run db:migrate:prod

# Seed with demo data (optional)
npm run db:seed
```

### **Step 4: Create Staging Environment File**

```bash
# Create .env.staging
cat > .env.staging << 'EOF'
# FinTrack v5 Staging Environment

# Database - Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# JWT Secrets (generate new ones for staging)
JWT_ACCESS_SECRET="staging-jwt-secret-32-chars-minimum-length"
JWT_REFRESH_SECRET="staging-refresh-secret-32-chars-minimum"

# Encryption Keys (generate new ones for staging)
ENCRYPTION_KEY="staging-encryption-key-32-chars-minimum"

# Application
NODE_ENV="staging"
PORT="3000"
APP_URL="https://your-staging-app.vercel.app"

# Staging Settings
ENABLE_PLAYGROUND="true"
LOG_LEVEL="info"

# Rate Limiting (more restrictive than dev)
RATE_LIMIT_WINDOW_MS="900000"   # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"   # Lower than dev
SESSION_TIMEOUT_MS="3600000"    # 1 hour
EOF
```

### **Step 5: Verify Setup**

```bash
# Test connection
npx prisma db push --preview-feature

# Open Prisma Studio with staging DB
DATABASE_URL="your-staging-url" npx prisma studio

# Check in Supabase dashboard
# Go to Table Editor to see your tables
```

---

## 🚀 **Option 2: Railway**

### **Why Railway?**
- ✅ **Simple**: One-click PostgreSQL
- ✅ **Affordable**: $5/month + usage
- ✅ **GitHub integration**: Auto-deploy from git

### **Setup Steps**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init fintrack-v5-staging

# Add PostgreSQL
railway add postgresql

# Deploy
railway up

# Get database URL
railway variables
```

---

## 🚀 **Option 3: Neon (Serverless)**

### **Why Neon?**
- ✅ **Serverless**: Scales to zero
- ✅ **Branching**: Database per feature branch
- ✅ **Free tier**: 3 projects, 0.5GB each

### **Setup Steps**

1. **Sign up**: Go to [neon.tech](https://neon.tech)
2. **Create project**: `fintrack-v5-staging`
3. **Copy connection string**
4. **Deploy schema**: `npm run db:migrate:prod`

---

## 🔧 **Staging Deployment Workflow**

### **Environment Management**

```bash
# Load staging environment
export $(cat .env.staging | xargs)

# Or use dotenv-cli
npm install -g dotenv-cli
dotenv -e .env.staging -- npm run dev
```

### **Database Operations**

```bash
# Deploy new migrations to staging
DATABASE_URL="your-staging-url" npm run db:migrate:prod

# Reset staging database (careful!)
DATABASE_URL="your-staging-url" npm run db:reset

# Seed staging with fresh data
DATABASE_URL="your-staging-url" npm run db:seed
```

### **Testing Staging**

```bash
# Run tests against staging
DATABASE_URL="your-staging-url" npm test

# Load test staging
# Use tools like Artillery, k6, or Postman
```

---

## 📊 **Staging vs Production Differences**

| Feature | Staging | Production |
|---------|---------|------------|
| **Database** | Supabase Free/Pro | Google Cloud SQL |
| **Logging** | `info` level | `warn` level |
| **Rate Limits** | Relaxed | Strict |
| **Playground** | Enabled | Disabled |
| **Error Details** | Full stack traces | Sanitized |
| **Backups** | Daily | Hourly |

---

## 🔒 **Security Considerations**

### **Staging Security**
- ✅ **Different secrets** from production
- ✅ **Limited access** (team only)
- ✅ **No real user data** (use demo/synthetic data)
- ✅ **SSL/TLS** enabled
- ✅ **IP restrictions** if possible

### **Environment Variables**
```bash
# Never use production secrets in staging!
# Generate new secrets for staging:

# JWT secrets (32+ characters)
JWT_ACCESS_SECRET="staging-specific-secret-32-chars-min"
JWT_REFRESH_SECRET="different-staging-secret-32-chars"

# Encryption keys (32 characters exactly)
ENCRYPTION_KEY="staging-encryption-key-32-chars"
```

---

## 🚀 **Deployment Integration**

### **Vercel Integration**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to staging
vercel --env .env.staging

# Set environment variables in Vercel dashboard
# Project Settings > Environment Variables
```

### **GitHub Actions**

```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
        run: npm run db:migrate:prod

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🧪 **Testing Your Staging Environment**

### **Health Checks**
```bash
# Test database connection
curl https://your-staging-app.vercel.app/api/health

# Test authentication
curl -X POST https://your-staging-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@fintrack.app","password":"demo123"}'

# Test API endpoints
curl -H "Authorization: Bearer <token>" \
  https://your-staging-app.vercel.app/api/accounts
```

### **Load Testing**
```bash
# Install Artillery
npm install -g artillery

# Create test script
cat > staging-load-test.yml << 'EOF'
config:
  target: 'https://your-staging-app.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "API Health Check"
    requests:
      - get:
          url: "/api/health"
EOF

# Run load test
artillery run staging-load-test.yml
```

---

## 📋 **Staging Checklist**

### **Before Each Deployment**
- [ ] **Database migrations** tested locally
- [ ] **Environment variables** updated
- [ ] **Secrets rotated** (if needed)
- [ ] **Dependencies** updated
- [ ] **Tests passing** locally

### **After Each Deployment**
- [ ] **Health checks** passing
- [ ] **Database** accessible
- [ ] **Authentication** working
- [ ] **Core features** functional
- [ ] **Performance** acceptable

### **Weekly Staging Maintenance**
- [ ] **Database cleanup** (remove old test data)
- [ ] **Log review** (check for errors)
- [ ] **Performance monitoring** (response times)
- [ ] **Security scan** (dependency updates)

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Connection Refused**
```bash
# Check connection string format
# Ensure IP is whitelisted (Supabase)
# Verify database is running
```

#### **Migration Failures**
```bash
# Check migration files
# Verify database permissions
# Try manual migration
DATABASE_URL="staging-url" npx prisma migrate deploy --preview-feature
```

#### **Environment Variable Issues**
```bash
# Verify all required variables are set
# Check for typos in variable names
# Ensure secrets are properly encoded
```

---

**Your staging environment is the safety net before production. Test everything here first! 🛡️**
