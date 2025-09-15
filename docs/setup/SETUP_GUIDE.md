# FinTrack v5 Setup Guide

## 🚀 **Quick Start (5 minutes)**

### **Prerequisites**
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 15+** - [Download here](https://www.postgresql.org/download/) or `brew install postgresql@15`

### **One-Command Setup**
```bash
# Clone and setup everything
git clone <your-repo>
cd fintrack-platform-v5
npm install
npm run db:setup-local
```

That's it! Your development environment is ready. 🎉

---

## 📋 **Step-by-Step Setup**

### **Step 1: Install Prerequisites**

#### **Node.js 18+**
```bash
# Check if installed
node --version  # Should be 18.17.0 or higher

# macOS with Homebrew
brew install node@18

# Or download from: https://nodejs.org/
```

#### **PostgreSQL 15+**
```bash
# Check if installed
psql --version  # Should be 15.0 or higher

# macOS with Homebrew (recommended)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql-15

# Windows: Download from https://www.postgresql.org/download/
```


### **Step 2: Project Setup**
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate
```

### **Step 3: Database Setup**
```bash
# One-command setup
npm run db:setup-local

# Or manual setup
createdb fintrack_v5_dev    # Create database
npm run db:migrate          # Create schema
npm run db:seed            # Add demo data
```

### **Step 4: Verify Setup**
```bash
# Test database connection
psql fintrack_v5_dev -c "SELECT version();"

# Open database browser
npm run db:studio    # Opens Prisma Studio

# Start development server
npm run dev          # Opens http://localhost:3000
```

---

## 🛠️ **Development Workflow**

### **Daily Commands**
```bash
# Start your day
brew services start postgresql@15  # Start PostgreSQL (macOS)
npm run dev                        # Start app

# End your day
brew services stop postgresql@15   # Stop PostgreSQL (macOS)
```

### **Database Commands**
```bash
npm run db:setup-local  # Setup local PostgreSQL
npm run db:reset        # Reset database (destructive!)
npm run db:migrate      # Run new migrations
npm run db:seed         # Reseed with demo data
npm run db:studio       # Visual database browser
```

### **Development Tools**
- **Prisma Studio**: `http://localhost:5555` (database browser)
- **pgAdmin**: `http://localhost:5050` (admin@fintrack.local / admin123)
- **App**: `http://localhost:3000` (your Next.js app)

---

## 🧪 **Staging Environment Setup**

### **Option 1: Supabase (Recommended)**

#### **Create Account & Project**
1. Go to [supabase.com](https://supabase.com)
2. Create account and new project
3. Choose region closest to your users
4. Note your project URL and API keys

#### **Deploy Schema**
```bash
# Set staging environment
export DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Deploy schema
npm run db:migrate:prod

# Seed with demo data (optional)
npm run db:seed
```

#### **Environment Variables**
```bash
# Create .env.staging
DATABASE_URL="your-supabase-connection-string"
JWT_ACCESS_SECRET="staging-jwt-secret-32-chars-min"
JWT_REFRESH_SECRET="staging-refresh-secret-32-chars"
ENCRYPTION_KEY="staging-encryption-key-32-chars"
NODE_ENV="staging"
```

### **Option 2: Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init fintrack-v5-staging

# Add PostgreSQL
railway add postgresql

# Deploy
railway up
```

---

## 🔧 **Configuration**

### **Environment Files**
- **`.env`** - Local development (auto-created)
- **`.env.staging`** - Staging environment
- **`.env.production`** - Production environment

### **Key Environment Variables**
```bash
# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"

# Security
JWT_ACCESS_SECRET="32-char-minimum-secret"
JWT_REFRESH_SECRET="different-32-char-secret"
ENCRYPTION_KEY="32-char-encryption-key"

# Application
NODE_ENV="development|staging|production"
PORT="3000"
APP_URL="http://localhost:3000"
```

---

## 🐛 **Troubleshooting**

### **Database Issues**
```bash
# Migration failed
npm run db:reset     # Reset and retry (development only)
npm run db:migrate   # Run migrations again

# Prisma client out of sync
npm run db:generate  # Regenerate Prisma client
```

### **Node.js Issues**
```bash
# Wrong Node version
nvm use 18          # If using nvm
# Or install Node 18+ from nodejs.org

# Dependencies issues
rm -rf node_modules package-lock.json
npm install         # Fresh install
```

---

## 📊 **What You Get**

### **Local Development**
- **PostgreSQL 15** with demo data
- **Redis** for sessions and caching
- **pgAdmin** web interface
- **Prisma Studio** database browser
- **Hot reload** development server

### **Demo Data Includes**
- **2 Demo users** with different roles
- **Multiple accounts** (checking, savings, credit)
- **Sample transactions** across different categories
- **Realistic categories** for expenses and income
- **Balance history** for testing charts

### **Development Features**
- **Multi-tenant architecture** ready
- **JWT authentication** configured
- **Rate limiting** middleware
- **Input validation** with Zod
- **TypeScript** throughout
- **Testing setup** with Jest

---

## 🎯 **Next Steps After Setup**

1. **Explore the demo data** in Prisma Studio
2. **Review the API design** in `docs/architecture/`
3. **Check the database schema** in `prisma/schema.prisma`
4. **Start building** your first API endpoint
5. **Set up staging** when ready to deploy

---

## 🆘 **Need Help?**

- **Database issues**: Check `docs/DATABASE_DEPLOYMENT_GUIDE.md`
- **API design**: Check `docs/architecture/api-design.md`
- **Security**: Check `docs/SECURITY_PRD.md`
- **Development roadmap**: Check `docs/development-roadmap.md`

---

**Happy coding! 🚀**
