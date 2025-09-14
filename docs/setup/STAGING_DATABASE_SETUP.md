# Staging Database Setup Guide

## **🎯 Goal**
Set up a cloud PostgreSQL database for the staging environment that will be used by the Vercel deployment.

## **📋 Prerequisites**
- ✅ Local development environment working
- ✅ GitHub repository created and pushed
- ✅ Prisma schema ready

---

## **Option 1: Supabase (Recommended)**

### **Step 1: Create Supabase Account**
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub (recommended for integration)
3. Verify your email

### **Step 2: Create New Project**
1. Click "New Project"
2. **Organization**: Choose your personal organization
3. **Project Name**: `fintrack-v5-staging`
4. **Database Password**: Generate a secure password (save it!)
5. **Region**: Choose closest to your users (US East recommended)
6. Click "Create new project"

### **Step 3: Get Database Connection Details**
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. It will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### **Step 4: Test Connection Locally**
```bash
# Create a temporary .env.staging file
echo "DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\"" > .env.staging

# Test connection
npx prisma db push --schema=./prisma/schema.prisma
```

---

## **Option 2: Railway (Alternative)**

### **Step 1: Create Railway Account**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify your account

### **Step 2: Create PostgreSQL Database**
1. Click "New Project"
2. Select "Provision PostgreSQL"
3. **Project Name**: `fintrack-v5-staging`
4. Wait for deployment

### **Step 3: Get Connection Details**
1. Click on the PostgreSQL service
2. Go to **Variables** tab
3. Copy the `DATABASE_URL` value

---

## **Option 3: Neon (Alternative)**

### **Step 1: Create Neon Account**
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Verify your account

### **Step 2: Create Database**
1. Click "Create a project"
2. **Project Name**: `fintrack-v5-staging`
3. **Database Name**: `fintrack_staging`
4. **Region**: Choose closest region
5. Click "Create project"

### **Step 3: Get Connection String**
1. Go to **Dashboard**
2. Copy the **Connection string**
3. It will be in the format:
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

---

## **🚀 Deploy Schema to Staging Database**

Once you have your staging database connection string:

### **Step 1: Set Environment Variable**
```bash
# Set the staging database URL
export DATABASE_URL="your-staging-database-url-here"
```

### **Step 2: Deploy Schema**
```bash
# Deploy the Prisma schema to staging
npx prisma migrate deploy

# Or if you prefer db push for staging
npx prisma db push
```

### **Step 3: Seed Staging Data**
```bash
# Run the seed script against staging
npx prisma db seed
```

### **Step 4: Verify Setup**
```bash
# Open Prisma Studio connected to staging
npx prisma studio
```

---

## **🔐 Security Configuration**

### **Database Security Settings**

#### **Supabase Security**
1. Go to **Settings** → **Database**
2. **SSL Mode**: Ensure "Require" is selected
3. **Connection Pooling**: Enable if available
4. **IP Restrictions**: Add your IP if needed

#### **Railway Security**
1. **SSL**: Automatically enabled
2. **Private Networking**: Available on paid plans
3. **Backups**: Automatic daily backups

#### **Neon Security**
1. **SSL**: Required by default
2. **IP Allow List**: Configure if needed
3. **Connection Pooling**: Built-in

---

## **📊 Staging Data Strategy**

### **What Data to Include**
- ✅ Demo user accounts (multiple personas)
- ✅ Realistic transaction data
- ✅ Various account types (checking, savings, credit)
- ✅ Different currencies and scenarios
- ✅ Edge cases for testing

### **What NOT to Include**
- ❌ Real user data
- ❌ Production secrets
- ❌ Sensitive information
- ❌ Large datasets (keep it lightweight)

### **Sample Staging Seed Data**
```typescript
// Additional staging users beyond the demo user
const stagingUsers = [
  {
    email: 'demo@fintrack.com',
    name: 'Demo User',
    password: 'demo123456'
  },
  {
    email: 'test.user@example.com',
    name: 'Test User',
    password: 'test123456'
  },
  {
    email: 'power.user@example.com',
    name: 'Power User',
    password: 'power123456'
  }
]
```

---

## **🔗 Next Steps**

After setting up the staging database:

1. ✅ **Database Created**: Cloud PostgreSQL ready
2. 🚧 **Configure Vercel**: Add DATABASE_URL to Vercel environment variables
3. 🚧 **Deploy to Staging**: Connect Vercel to GitHub and deploy
4. 🚧 **Test Staging**: Verify all functionality works
5. 🚧 **Document Access**: Update team with staging URLs and credentials

---

## **💡 Tips**

### **Cost Management**
- **Supabase**: Free tier includes 500MB database
- **Railway**: $5/month for hobby plan
- **Neon**: Free tier includes 3GB database

### **Performance**
- Choose database region close to Vercel deployment region
- Enable connection pooling if available
- Monitor database performance in provider dashboard

### **Backup Strategy**
- Most providers include automatic backups
- Consider manual backup before major changes
- Test restore procedures

---

**Which database provider would you like to use for staging?**
- 🟢 **Supabase** (Recommended - PostgreSQL with great free tier)
- 🔵 **Railway** (Simple setup, good for staging)
- 🟣 **Neon** (Serverless PostgreSQL, generous free tier)

*Choose one and I'll help you set it up!*
