# FinTrack v5 Database Deployment Guide

## 🏗️ **Environment Setup Strategy**

### **📊 Cost & Feature Comparison**

| Environment | Solution | Monthly Cost | Features | Recommended For |
|-------------|----------|--------------|----------|-----------------|
| **Development** | Docker Local | $0 | Full PostgreSQL + Redis | All developers |
| **Staging** | Supabase Free | $0 | 500MB, 2 projects | MVP/Testing |
| **Staging Pro** | Supabase Pro | $25 | 8GB, backups, auth | Pre-production |
| **Production** | Google Cloud SQL | $12 | Managed, HA, connection pooling | **Recommended** |
| **Production Alt** | DigitalOcean | $15 | Simple, reliable | Cost-conscious |
| **Production Alt** | AWS RDS | $17 | Enterprise features | Complex requirements |

---

## 🔧 **Development Environment**

### **Quick Start (Recommended)**
```bash
# Clone and setup
git clone <repo>
cd fintrack-platform-v5

# One-command setup
npm run db:setup
```

### **Manual Setup**
```bash
# Start containers
npm run db:start

# Setup database
npm run db:migrate
npm run db:seed

# Access tools
npm run db:studio  # Prisma Studio
# pgAdmin: http://localhost:5050 (admin@fintrack.local / admin123)
```

### **Development Commands**
```bash
npm run db:start     # Start PostgreSQL + Redis
npm run db:stop      # Stop containers
npm run db:reset     # Reset database (destructive)
npm run db:migrate   # Run migrations
npm run db:seed      # Seed with demo data
npm run db:studio    # Open Prisma Studio
```

---

## 🧪 **Staging Environment**

### **Option 1: Supabase (Recommended)**

#### **Setup Steps:**
1. **Create Supabase Project**
   ```bash
   # Visit: https://supabase.com/dashboard
   # Create new project: fintrack-v5-staging
   ```

2. **Get Connection String**
   ```bash
   # Settings > Database > Connection string
   DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
   ```

3. **Deploy Schema**
   ```bash
   # Set environment
   export DATABASE_URL="your-supabase-url"

   # Deploy migrations
   npm run db:migrate:prod
   npm run db:seed
   ```

#### **Supabase Benefits:**
- ✅ **Free tier**: 500MB database
- ✅ **Built-in auth**: Can integrate later
- ✅ **Real-time**: WebSocket subscriptions
- ✅ **Dashboard**: SQL editor, table viewer
- ✅ **Auto-backups**: Point-in-time recovery

### **Option 2: Railway**

#### **Setup Steps:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add postgresql
railway deploy
```

### **Option 3: Neon (Serverless)**

#### **Setup Steps:**
```bash
# Visit: https://neon.tech
# Create project: fintrack-v5-staging
# Copy connection string
```

**Benefits:**
- ✅ **Serverless**: Scales to zero
- ✅ **Branching**: Database per PR
- ✅ **Cost-effective**: Pay per use

---

## 🚀 **Production Environment**

### **Option 1: Google Cloud SQL (Recommended)**

#### **Setup via Google Cloud Console:**
1. **Create Cloud SQL Instance**
   ```
   Engine: PostgreSQL 15
   Instance: db-f1-micro (0.6GB RAM)
   Storage: 20GB SSD
   Region: us-central1 (or closest to your app)
   High Availability: Regional persistent disk
   Backup: Automated daily backups
   ```

2. **Security Configuration**
   ```
   Authorized Networks: Add your app server IPs
   SSL: Require SSL connections
   Private IP: Enable for VPC access
   ```

3. **Connection String**
   ```bash
   DATABASE_URL="postgresql://fintrack_prod:[password]@[instance-ip]:5432/fintrack_v5_prod?sslmode=require"
   ```

#### **Setup via gcloud CLI:**
```bash
# Create Cloud SQL instance
gcloud sql instances create fintrack-v5-prod \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=20GB \
  --storage-type=SSD \
  --backup-start-time=03:00 \
  --availability-type=REGIONAL \
  --require-ssl

# Create database
gcloud sql databases create fintrack_v5_prod \
  --instance=fintrack-v5-prod

# Create user
gcloud sql users create fintrack_prod \
  --instance=fintrack-v5-prod \
  --password=[SECURE_PASSWORD]

# Get connection info
gcloud sql instances describe fintrack-v5-prod
```

#### **Setup via Terraform (Infrastructure as Code):**
```hcl
# terraform/cloudsql.tf
resource "google_sql_database_instance" "fintrack_prod" {
  name             = "fintrack-v5-prod"
  database_version = "POSTGRES_15"
  region          = "us-central1"

  settings {
    tier = "db-f1-micro"

    disk_size = 20
    disk_type = "PD_SSD"

    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }

    ip_configuration {
      require_ssl = true
    }

    availability_type = "REGIONAL"
  }

  deletion_protection = true
}

resource "google_sql_database" "fintrack_db" {
  name     = "fintrack_v5_prod"
  instance = google_sql_database_instance.fintrack_prod.name
}

resource "google_sql_user" "fintrack_user" {
  name     = "fintrack_prod"
  instance = google_sql_database_instance.fintrack_prod.name
  password = var.db_password
}
```

### **Option 2: AWS RDS (Enterprise Alternative)**

#### **Setup via AWS Console:**
1. **Create RDS Instance**
   ```
   Engine: PostgreSQL 15
   Instance: db.t3.micro (1 vCPU, 1GB RAM)
   Storage: 20GB GP2 SSD
   Multi-AZ: Yes (for HA)
   Backup: 7 days retention
   ```

2. **Security Configuration**
   ```
   VPC: Create new or use existing
   Security Group: Allow port 5432 from app servers
   Encryption: Enable at rest
   ```

3. **Connection String**
   ```bash
   DATABASE_URL="postgresql://fintrack_prod:[password]@fintrack-prod.cluster-xyz.us-east-1.rds.amazonaws.com:5432/fintrack_v5_prod"
   ```

### **Option 3: DigitalOcean Managed Database**

#### **Setup Steps:**
```bash
# Via DigitalOcean Console
# Create > Databases > PostgreSQL 15
# Plan: Basic ($15/month)
# Region: Choose closest to your app servers
```

#### **Configuration:**
```
Database: fintrack_v5_prod
User: fintrack_prod
Connection Pool: Enabled
Trusted Sources: Add your app server IPs
```

---

## 📊 **Migration & Deployment Process**

### **Production Deployment Checklist**

#### **Pre-Deployment:**
- [ ] **Backup existing database** (if applicable)
- [ ] **Test migrations on staging** environment
- [ ] **Review migration scripts** for data safety
- [ ] **Plan rollback strategy** if needed
- [ ] **Schedule maintenance window** if required

#### **Deployment Steps:**
```bash
# 1. Set production environment
export DATABASE_URL="your-production-url"
export NODE_ENV="production"

# 2. Run migrations (non-destructive)
npm run db:migrate:prod

# 3. Verify schema
npm run db:studio

# 4. Optional: Seed production data
# npm run db:seed  # Only for initial deployment
```

#### **Post-Deployment:**
- [ ] **Verify application connectivity**
- [ ] **Run health checks**
- [ ] **Monitor performance metrics**
- [ ] **Test critical user flows**
- [ ] **Update monitoring dashboards**

### **Rollback Procedure**
```bash
# If migration fails, rollback steps:
# 1. Restore from backup
# 2. Deploy previous application version
# 3. Verify system functionality
# 4. Investigate and fix migration issues
```

---

## 🔒 **Security Best Practices**

### **Database Security**
```bash
# 1. Use strong passwords (32+ characters)
# 2. Enable SSL/TLS encryption
# 3. Restrict network access (VPC/Security Groups)
# 4. Enable audit logging
# 5. Regular security updates
# 6. Backup encryption
```

### **Connection Security**
```bash
# Production connection string format
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require&sslcert=client-cert.pem&sslkey=client-key.pem&sslrootcert=ca-cert.pem"
```

### **Environment Variables**
```bash
# Never commit these to version control
DATABASE_URL="..."
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
ENCRYPTION_KEY="..."
```

---

## 📈 **Monitoring & Maintenance**

### **Key Metrics to Monitor**
- **Connection count** (should be < 80% of max)
- **Query performance** (slow query log)
- **Storage usage** (plan for growth)
- **Backup success** (daily verification)
- **CPU/Memory usage** (scale when needed)

### **Maintenance Tasks**
```bash
# Weekly
- Review slow query logs
- Check backup integrity
- Monitor storage growth

# Monthly
- Update database statistics
- Review and optimize indexes
- Security patch updates

# Quarterly
- Performance review and optimization
- Capacity planning
- Disaster recovery testing
```

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Connection Refused**
```bash
# Check if database is running
docker-compose ps  # For local
# Check security groups (AWS)
# Verify connection string format
```

#### **Migration Failures**
```bash
# Check migration status
npx prisma migrate status

# Reset and retry (development only)
npx prisma migrate reset
npx prisma migrate dev
```

#### **Performance Issues**
```bash
# Check slow queries
# Review connection pooling
# Analyze query execution plans
# Consider adding indexes
```

### **Emergency Contacts**
- **Database Admin**: [Your DBA contact]
- **DevOps Team**: [Your DevOps contact]
- **On-call Engineer**: [Your on-call system]

---

## 📚 **Additional Resources**

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [Supabase Documentation](https://supabase.com/docs)
- [Database Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)

---

**This guide ensures your FinTrack v5 database is properly configured for all environments with security, performance, and reliability best practices.**
