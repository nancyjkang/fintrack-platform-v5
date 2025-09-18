# FinTrack v5 - DevOps Guidebook

## 📋 **Overview**

This guidebook provides DevOps teams with comprehensive instructions for deploying, monitoring, and maintaining FinTrack v5 across all environments. This guide is applicable for all releases and provides standardized procedures for consistent deployments.

---

## 🏗️ **System Architecture**

### **Technology Stack**
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with refresh tokens
- **Hosting**: Vercel (recommended) or any Node.js-compatible platform
- **File Storage**: Local filesystem (configurable for cloud storage)

### **Key Components**
- **Web Application**: Next.js full-stack application
- **Database**: PostgreSQL with automated migrations
- **Financial Cube**: Pre-aggregated data for trends analysis
- **CSV Import System**: File processing and transaction import
- **Multi-tenant Architecture**: Isolated data per tenant

---

## 🚀 **Deployment Process**

### **Pre-Deployment Checklist**

#### **Environment Verification**
- [ ] Database connection string configured
- [ ] JWT secrets configured (32+ character random strings)
- [ ] Environment variables validated
- [ ] SSL certificates in place
- [ ] Domain DNS configured

#### **Code Quality Gates**
- [ ] All unit tests passing (320+ tests)
- [ ] TypeScript compilation successful
- [ ] ESLint checks passing (warnings OK, errors block deployment)
- [ ] Build process completes without errors
- [ ] Database migration scripts validated (if applicable)

#### **Security Validation**
- [ ] Environment variables secured (no hardcoded secrets)
- [ ] Database credentials encrypted
- [ ] HTTPS enforced in production
- [ ] CORS policies configured
- [ ] Rate limiting enabled

### **3-Step Deployment Process**

#### **STEP 1: Pre-Deployment Verification**
```bash
# Run comprehensive checks
npm run pre-deploy

# What this does:
# - Verifies git status (no uncommitted changes)
# - Runs TypeScript compilation
# - Executes full test suite
# - Tests production build
# - Validates database connection
```

#### **STEP 2: Release Documentation**
```bash
# Generate release documentation
npm run release

# What this does:
# - Creates release notes with changelog
# - Updates deployment log
# - Creates git tags for rollback
# - Updates version numbers
```

#### **STEP 3: Production Deployment**
```bash
# Deploy to production
npm run deploy

# What this does:
# - Builds production assets
# - Deploys to hosting platform
# - Updates live URLs in documentation
# - NOTE: Database migrations are handled separately (see Migration Management section)
```

#### **STEP 3.5: Database Migration (If Required)**
```bash
# Check if migration is needed
ls docs/releases/v*/migration.sql

# If migration files exist, follow the Manual SQL Migration process:
# 1. Create backup
# 2. Test on staging
# 3. Execute migration script
# 4. Verify results
# See "Migration Management" section for detailed steps
```

### **Environment-Specific Deployments**

#### **Development Environment**
```bash
# Local development
npm run dev
# Runs on http://localhost:3000
```

#### **Staging Environment**
```bash
# Deploy to staging
npm run deploy:staging
# Creates preview URL for testing
```

#### **Production Environment**
```bash
# Full production deployment
npm run pre-deploy && npm run release && npm run deploy
```

---

## 🔧 **Environment Configuration**

### **Required Environment Variables**

#### **Database Configuration**
```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

#### **Authentication Configuration**
```bash
JWT_SECRET="your-32-character-secret-key-here"
JWT_REFRESH_SECRET="your-32-character-refresh-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="https://your-domain.com"
```

#### **Application Configuration**
```bash
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### **Optional Environment Variables**

#### **File Upload Configuration**
```bash
UPLOAD_DIR="/tmp/uploads"  # Default: ./uploads
MAX_FILE_SIZE="10485760"   # Default: 10MB
```

#### **Email Configuration (if enabled)**
```bash
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password"
```

### **Platform-Specific Setup**

#### **Vercel Deployment**
```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

#### **Docker Deployment**
```dockerfile
# Use official Node.js runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### **Traditional Server Deployment**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Deploy application
git clone [repository]
cd fintrack-platform-v5
npm ci
npm run build

# Start with PM2
pm2 start npm --name "fintrack-v5" -- start
pm2 save
pm2 startup
```

---

## 🗄️ **Database Management**

### **Database Setup**

#### **PostgreSQL Installation**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres
```

#### **Database Initialization**
```bash
# Create database
createdb fintrack_v5

# Run migrations
npx prisma migrate deploy

# Seed default data (optional)
npx prisma db seed
```

### **Migration Management**

#### **Identifying When Migrations Are Needed**

**Check for Migration Files:**
```bash
# Look for migration SQL files in release directories
find docs/releases -name "migration.sql" -o -name "*.sql"

# Check release notes for database changes
grep -i "database\|migration\|schema" docs/releases/v*/README.md
```

**Common Scenarios Requiring Migrations:**
- New tables or columns added
- Index changes for performance
- Data type modifications
- Constraint additions/removals
- Financial cube schema updates
- New feature database requirements

**Migration File Locations:**
- `docs/releases/v5.x.x/migration.sql` - Version-specific migrations
- `prisma/migrations/` - Development migration history (reference only)

#### **Development Migrations**
```bash
# Create new migration (development only)
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# Generate migration SQL for review
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

#### **Production Migrations - Manual SQL Approach**

**⚠️ CRITICAL: We use manual SQL scripts for production migrations to ensure safety and control.**

##### **Pre-Migration Steps**
```bash
# 1. Create database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup integrity
pg_restore --list backup_pre_migration_*.sql | head -10

# 3. Test migration on staging database first
psql -h $STAGING_DB_HOST -U $DB_USER -d $STAGING_DB_NAME -f migration_script.sql
```

##### **Migration Execution**
```bash
# 1. Connect to production database
psql -h $PROD_DB_HOST -U $DB_USER -d $PROD_DB_NAME

# 2. Begin transaction for rollback safety
BEGIN;

# 3. Execute migration script
\i /path/to/migration_script.sql

# 4. Verify migration results
SELECT * FROM information_schema.tables WHERE table_name = 'new_table';
SELECT COUNT(*) FROM existing_table;

# 5. If everything looks good, commit
COMMIT;

# 6. If issues found, rollback
ROLLBACK;
```

##### **Post-Migration Verification**
```bash
# 1. Update Prisma schema to match database
npx prisma db pull

# 2. Verify application connectivity
npm run build && npm start

# 3. Run smoke tests
curl -f http://localhost:3000/api/health

# 4. Check application logs for errors
tail -f logs/application.log
```

##### **Migration Script Structure**
```sql
-- Migration: [Description]
-- Date: YYYY-MM-DD
-- Version: v5.x.x
-- Author: [Name]

-- Safety checks
DO $$
BEGIN
    -- Verify we're on the correct database
    IF current_database() != 'fintrack_production' THEN
        RAISE EXCEPTION 'Wrong database! Expected fintrack_production, got %', current_database();
    END IF;
    
    -- Verify prerequisite conditions
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prerequisite_table') THEN
        RAISE EXCEPTION 'Prerequisite table not found. Migration cannot proceed.';
    END IF;
END $$;

-- Begin migration
BEGIN;

-- Your migration SQL here
ALTER TABLE transactions ADD COLUMN new_field VARCHAR(255);
CREATE INDEX idx_transactions_new_field ON transactions(new_field);

-- Verify migration
DO $$
BEGIN
    -- Verify new column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'new_field'
    ) THEN
        RAISE EXCEPTION 'Migration verification failed: new_field column not created';
    END IF;
    
    -- Verify index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'transactions' AND indexname = 'idx_transactions_new_field'
    ) THEN
        RAISE EXCEPTION 'Migration verification failed: index not created';
    END IF;
END $$;

COMMIT;
```

##### **Rollback Procedures**
```bash
# If migration needs to be rolled back:

# 1. Stop application to prevent data corruption
pm2 stop fintrack-v5

# 2. Restore from pre-migration backup
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME --clean backup_pre_migration_*.sql

# 3. Verify rollback
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();"

# 4. Restart application with previous version
git checkout previous-release-tag
npm run build
pm2 start fintrack-v5

# 5. Verify application functionality
curl -f http://localhost:3000/api/health
```

### **Database Backup & Recovery**

#### **Backup Procedures**
```bash
# Create backup
pg_dump -h hostname -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backups
0 2 * * * pg_dump -h hostname -U username -d database_name > /backups/fintrack_$(date +\%Y\%m\%d).sql
```

#### **Recovery Procedures**
```bash
# Restore from backup
psql -h hostname -U username -d database_name < backup_file.sql

# Point-in-time recovery (if supported)
# Follow your PostgreSQL provider's documentation
```

---

## 📊 **Monitoring & Maintenance**

### **Health Checks**

#### **Application Health**
```bash
# Check application status
curl -f http://localhost:3000/api/health || echo "Application down"

# Database connectivity
npx prisma db pull || echo "Database connection failed"

# Build verification
npm run build || echo "Build failed"
```

#### **Performance Monitoring**
- **Response Times**: Monitor API endpoint response times
- **Database Performance**: Track query execution times
- **Memory Usage**: Monitor Node.js memory consumption
- **Error Rates**: Track 4xx/5xx error rates

### **Log Management**

#### **Application Logs**
```bash
# View application logs (PM2)
pm2 logs fintrack-v5

# View application logs (Docker)
docker logs container_name

# View application logs (Vercel)
vercel logs
```

#### **Database Logs**
```bash
# PostgreSQL logs location
tail -f /var/log/postgresql/postgresql-*.log

# Query slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### **Maintenance Tasks**

#### **Daily Tasks**
- [ ] Check application health endpoints
- [ ] Review error logs for critical issues
- [ ] Verify database backup completion
- [ ] Monitor disk space usage

#### **Weekly Tasks**
- [ ] Review performance metrics
- [ ] Update dependencies (security patches)
- [ ] Clean up old log files
- [ ] Verify SSL certificate expiration

#### **Monthly Tasks**
- [ ] Full database backup verification
- [ ] Security audit of environment variables
- [ ] Performance optimization review
- [ ] Capacity planning assessment

---

## 🚨 **Troubleshooting Guide**

### **Common Issues**

#### **Build Failures**
```bash
# Symptom: TypeScript compilation errors
# Solution:
npm run type-check
# Fix TypeScript errors and redeploy

# Symptom: Missing dependencies
# Solution:
rm -rf node_modules package-lock.json
npm install
```

#### **Database Connection Issues**
```bash
# Symptom: Database connection timeout
# Solution:
# 1. Verify DATABASE_URL format
# 2. Check network connectivity
# 3. Verify database server status
# 4. Check connection pool limits

# Test connection
npx prisma db pull
```

#### **Authentication Problems**
```bash
# Symptom: JWT token errors
# Solution:
# 1. Verify JWT_SECRET is set and consistent
# 2. Check token expiration settings
# 3. Verify NEXTAUTH_URL matches deployment URL

# Symptom: CORS errors
# Solution:
# Update CORS configuration in next.config.js
```

#### **Performance Issues**
```bash
# Symptom: Slow API responses
# Solution:
# 1. Check database query performance
# 2. Review financial cube optimization
# 3. Monitor memory usage
# 4. Check for N+1 query problems

# Database query analysis
EXPLAIN ANALYZE SELECT * FROM transactions WHERE tenant_id = 'xxx';
```

### **Emergency Procedures**

#### **Rollback Deployment**
```bash
# Quick rollback (Vercel)
vercel rollback --previous

# Git-based rollback
git reset --hard [previous-tag]
npm run deploy

# Database rollback (if needed)
# Restore from backup - NO automated rollback for data safety
```

#### **Emergency Maintenance Mode**
```bash
# Create maintenance page
echo "Maintenance in progress" > public/maintenance.html

# Redirect traffic (nginx example)
location / {
    return 503 /maintenance.html;
}
```

---

## 🔐 **Security Considerations**

### **Security Checklist**
- [ ] All secrets stored in environment variables
- [ ] Database connections encrypted (SSL)
- [ ] HTTPS enforced in production
- [ ] JWT secrets are cryptographically secure
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS protection enabled
- [ ] CSRF protection implemented

### **Security Monitoring**
- Monitor failed authentication attempts
- Track unusual API usage patterns
- Review database access logs
- Monitor file upload activities
- Check for suspicious user behavior

---

## 📈 **Performance Optimization**

### **Database Optimization**
- **Indexes**: Ensure proper indexing on frequently queried columns
- **Connection Pooling**: Configure appropriate connection pool sizes
- **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
- **Financial Cube**: Leverage pre-aggregated data for trends

### **Application Optimization**
- **Caching**: Implement Redis for session and data caching
- **CDN**: Use CDN for static assets
- **Image Optimization**: Optimize uploaded images
- **Bundle Size**: Monitor and optimize JavaScript bundle size

### **Infrastructure Optimization**
- **Auto-scaling**: Configure auto-scaling based on traffic
- **Load Balancing**: Implement load balancing for high availability
- **Database Scaling**: Consider read replicas for heavy read workloads
- **Monitoring**: Implement comprehensive monitoring and alerting

---

## 📞 **Support & Escalation**

### **Support Levels**
- **Level 1**: Basic application issues, user support
- **Level 2**: Configuration issues, deployment problems
- **Level 3**: Database issues, performance problems, security incidents

### **Escalation Procedures**
1. **Immediate Response** (< 15 minutes): Critical system down
2. **High Priority** (< 2 hours): Major functionality impaired
3. **Medium Priority** (< 24 hours): Minor issues, feature requests
4. **Low Priority** (< 72 hours): Documentation, enhancements

### **Contact Information**
- **Development Team**: [Contact details]
- **Database Administrator**: [Contact details]
- **Security Team**: [Contact details]
- **Infrastructure Team**: [Contact details]

---

## 📚 **Additional Resources**

### **Documentation Links**
- [Vercel CLI Deployment Guide](VERCEL_CLI_DEPLOYMENT.md)
- [Database Deployment Guide](DATABASE_DEPLOYMENT_GUIDE.md)
- [Feature Documentation](../features/)
- [API Documentation](../architecture/api-design.md)

### **External Resources**
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)
- [Vercel Platform Documentation](https://vercel.com/docs)

---

*This guidebook is maintained by the FinTrack development team and updated with each major release. For questions or updates, please contact the development team.*

**Last Updated**: September 2025
**Version**: 5.0.2
**Applicable Releases**: All v5.x releases
