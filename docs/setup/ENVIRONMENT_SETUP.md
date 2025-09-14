# FinTrack v5 Environment Setup

## **Environment Overview**

FinTrack v5 uses a multi-tier environment strategy for safe development and deployment:

### **🏠 Development Environment (Local)**
- **Purpose**: Local development and testing
- **Database**: Local PostgreSQL (`fintrack_dev`)
- **URL**: `http://localhost:3000`
- **Data**: Demo/test data for development

### **🚀 Staging Environment (Vercel + Cloud DB)**
- **Purpose**: Pre-production testing and demos
- **Database**: Cloud PostgreSQL (Supabase/Railway/etc.)
- **URL**: `https://fintrack-platform-v5-staging.vercel.app` (or similar)
- **Data**: Realistic test data, safe to reset

### **🌟 Production Environment (Future)**
- **Purpose**: Live user data
- **Database**: Production PostgreSQL with backups
- **URL**: `https://fintrack.com` (custom domain)
- **Data**: Real user data, requires careful handling

---

## **Current Status (As of $(date))**

### **✅ Development Environment**
- **Status**: ✅ Fully configured and working
- **Database**: Local PostgreSQL 14
  - Host: `localhost:5432`
  - Database: `fintrack_dev`
  - User: `fintrack_dev`
- **Features Working**:
  - ✅ Authentication (JWT-based)
  - ✅ Multi-tenant architecture
  - ✅ Dashboard with demo accounts
  - ✅ API endpoints (auth, accounts, health)
  - ✅ Demo login: `demo@fintrack.com` / `demo123456`

### **🚧 Staging Environment**
- **Status**: 🚧 In Progress (Next Step)
- **Database**: To be configured (Supabase recommended)
- **Deployment**: Vercel connected to GitHub
- **Plan**:
  1. Set up cloud database (Supabase)
  2. Configure environment variables in Vercel
  3. Deploy with staging database
  4. Test full functionality

### **⏳ Production Environment**
- **Status**: ⏳ Future Planning
- **Database**: Not yet configured
- **Considerations**:
  - Custom domain setup
  - Production-grade database with backups
  - Monitoring and alerting
  - Data privacy compliance

---

## **Environment Variables**

### **Development (.env)**
```bash
# Database
DATABASE_URL="postgresql://fintrack_dev:dev_password@localhost:5432/fintrack_dev"

# JWT Secrets
JWT_SECRET="dev-jwt-secret-key-change-in-production"
REFRESH_TOKEN_SECRET="dev-refresh-token-secret-change-in-production"

# Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### **Staging (Vercel Environment Variables)**
```bash
# Database (Cloud)
DATABASE_URL="postgresql://user:password@host:5432/fintrack_staging"

# JWT Secrets (Different from dev)
JWT_SECRET="staging-jwt-secret-key-secure-random"
REFRESH_TOKEN_SECRET="staging-refresh-token-secret-secure-random"

# Environment
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://fintrack-platform-v5.vercel.app"
```

### **Production (Future)**
```bash
# Database (Production with backups)
DATABASE_URL="postgresql://prod_user:secure_password@prod_host:5432/fintrack_prod"

# JWT Secrets (Highly secure)
JWT_SECRET="production-jwt-secret-extremely-secure"
REFRESH_TOKEN_SECRET="production-refresh-token-secret-extremely-secure"

# Environment
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://fintrack.com"
```

---

## **Database Schema Consistency**

All environments use the same Prisma schema but with different data:

### **Development Data**
- Demo user: `demo@fintrack.com`
- Sample accounts (Checking, Savings, Credit Card)
- Test transactions for development

### **Staging Data**
- Realistic test scenarios
- Multiple user personas
- Edge case testing data
- Safe to reset/recreate

### **Production Data**
- Real user accounts
- Encrypted sensitive data
- Regular backups
- Strict access controls

---

## **Deployment Pipeline**

### **Current CI/CD Flow**
1. **Local Development** → Git commit
2. **Pre-commit Hooks** → TypeScript, tests, build
3. **Push to GitHub** → Pre-push hooks (security audit)
4. **GitHub Actions** → Automated CI/CD pipeline
5. **Vercel Deployment** → Staging environment

### **Planned Production Flow**
1. **Staging Testing** → Manual QA and testing
2. **Production Deploy** → Careful deployment with rollback plan
3. **Health Checks** → Automated monitoring
4. **User Notification** → Changelog and updates

---

## **Next Steps**

### **Immediate (Staging Setup)**
1. ✅ GitHub repository created
2. 🚧 Set up Supabase staging database
3. 🚧 Configure Vercel environment variables
4. 🚧 Deploy to staging
5. 🚧 Test staging deployment

### **Short Term (Production Prep)**
1. Custom domain setup
2. Production database selection
3. Monitoring and alerting setup
4. Security audit and penetration testing
5. Performance optimization

### **Long Term (Scale)**
1. Multi-region deployment
2. CDN setup for static assets
3. Database read replicas
4. Advanced monitoring and analytics
5. Automated backup and disaster recovery

---

## **Security Considerations**

### **Environment Separation**
- ✅ Different JWT secrets per environment
- ✅ Separate databases prevent data leakage
- ✅ Environment-specific access controls

### **Secret Management**
- ✅ No secrets in code repository
- ✅ Environment variables for sensitive data
- ✅ Different secrets for each environment

### **Database Security**
- ✅ Connection encryption (SSL)
- ✅ User-specific database credentials
- ✅ Network-level access restrictions

---

## **Monitoring and Health Checks**

### **Health Check Endpoints**
- `/api/health` - Basic application health
- Database connectivity check
- JWT token validation
- Environment configuration validation

### **Planned Monitoring**
- Uptime monitoring (Vercel Analytics)
- Error tracking (Sentry)
- Performance monitoring (Vercel Speed Insights)
- Database performance (provider-specific)

---

*Last Updated: $(date)*
*Environment: Development → Staging (In Progress) → Production (Planned)*
