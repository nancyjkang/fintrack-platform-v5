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

### **🌟 Production Environment (GCP)**
- **Purpose**: Live user data with enterprise-grade reliability
- **Platform**: Google Cloud Platform (GCP)
- **Database**: Cloud SQL for PostgreSQL with automated backups
- **Hosting**: Cloud Run for containerized deployment
- **CDN**: Cloud CDN for global performance
- **URL**: `https://fintrack.com` (custom domain with SSL)
- **Data**: Real user data with encryption at rest and in transit

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

### **⏳ Production Environment (GCP)**
- **Status**: ⏳ Architecture Planned, Implementation Pending
- **Platform**: Google Cloud Platform
- **Database**: Cloud SQL for PostgreSQL (planned)
- **Infrastructure**:
  - **Compute**: Cloud Run (serverless containers)
  - **Database**: Cloud SQL with High Availability
  - **Storage**: Cloud Storage for file uploads
  - **CDN**: Cloud CDN for global performance
  - **Load Balancer**: Global Load Balancer with SSL
  - **Monitoring**: Cloud Monitoring + Cloud Logging
  - **Security**: Cloud IAM + Cloud Security Command Center

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

### **Production (GCP)**
```bash
# Database (Cloud SQL for PostgreSQL)
DATABASE_URL="postgresql://fintrack_prod:${CLOUD_SQL_PASSWORD}@${CLOUD_SQL_CONNECTION_NAME}/fintrack_production?host=/cloudsql/${CLOUD_SQL_CONNECTION_NAME}"

# JWT Secrets (Google Secret Manager)
JWT_SECRET="${JWT_SECRET_FROM_SECRET_MANAGER}"
REFRESH_TOKEN_SECRET="${REFRESH_TOKEN_SECRET_FROM_SECRET_MANAGER}"

# GCP Configuration
GOOGLE_CLOUD_PROJECT="fintrack-production"
CLOUD_SQL_CONNECTION_NAME="fintrack-production:us-central1:fintrack-db"
GOOGLE_APPLICATION_CREDENTIALS="/etc/secrets/service-account-key.json"

# Application Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://fintrack.com"
PORT="8080"

# Monitoring & Logging
GOOGLE_CLOUD_LOGGING_ENABLED="true"
GOOGLE_CLOUD_MONITORING_ENABLED="true"

# Security
CORS_ORIGIN="https://fintrack.com"
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="900000"
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

### **Planned Production Flow (GCP)**
1. **Staging Testing** → Manual QA and testing on Vercel staging
2. **Container Build** → Docker image built and pushed to Google Container Registry
3. **Cloud Run Deploy** → Blue-green deployment with traffic splitting
4. **Database Migration** → Automated Prisma migrations with rollback capability
5. **Health Checks** → Automated monitoring and alerting
6. **Traffic Routing** → Gradual traffic shift to new version
7. **Rollback Plan** → Instant rollback capability if issues detected
8. **User Notification** → Changelog and updates

---

## **Next Steps**

### **Immediate (Staging Setup)**
1. ✅ GitHub repository created
2. 🚧 Set up Supabase staging database
3. 🚧 Configure Vercel environment variables
4. 🚧 Deploy to staging
5. 🚧 Test staging deployment

### **Short Term (GCP Production Setup)**
1. **GCP Project Setup**
   - Create production GCP project
   - Enable required APIs (Cloud Run, Cloud SQL, etc.)
   - Set up billing and resource quotas
2. **Cloud SQL Setup**
   - Create PostgreSQL instance with High Availability
   - Configure automated backups and point-in-time recovery
   - Set up read replicas for performance
3. **Container Registry & Cloud Run**
   - Set up Google Container Registry
   - Create Cloud Run service with proper scaling
   - Configure custom domain with SSL certificates
4. **Security & Compliance**
   - Implement Google Secret Manager for secrets
   - Set up Cloud IAM roles and permissions
   - Configure Cloud Security Command Center
   - Security audit and penetration testing
5. **Monitoring & Alerting**
   - Set up Cloud Monitoring dashboards
   - Configure alerting policies
   - Implement structured logging with Cloud Logging

### **Long Term (Enterprise Scale)**
1. **Multi-Region Deployment**
   - Deploy to multiple GCP regions (us-central1, europe-west1)
   - Set up global load balancing
   - Implement disaster recovery procedures
2. **Performance Optimization**
   - Cloud CDN for global content delivery
   - Database connection pooling with Cloud SQL Proxy
   - Implement caching with Cloud Memorystore (Redis)
3. **Advanced Monitoring**
   - Application Performance Monitoring (APM)
   - Real User Monitoring (RUM)
   - Custom business metrics and dashboards
4. **Data & Analytics**
   - Set up BigQuery for analytics
   - Implement data pipeline with Cloud Dataflow
   - Privacy-compliant user analytics
5. **Compliance & Governance**
   - SOC 2 Type II compliance
   - GDPR/CCPA compliance implementation
   - Regular security audits and certifications

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
- **Staging**: Vercel Analytics + Vercel Speed Insights
- **Production**: Google Cloud Monitoring + Cloud Logging + Custom dashboards

---

## **🏗️ GCP Production Architecture**

### **Infrastructure Components**

#### **🖥️ Compute (Cloud Run)**
- **Service**: Serverless containerized deployment
- **Scaling**: 0-1000 instances based on traffic
- **CPU**: 2 vCPU, 4GB RAM per instance
- **Concurrency**: 80 requests per instance
- **Timeout**: 300 seconds for long-running operations

#### **🗄️ Database (Cloud SQL)**
- **Engine**: PostgreSQL 15 with High Availability
- **Machine**: db-standard-2 (2 vCPU, 7.5GB RAM)
- **Storage**: 100GB SSD with automatic increase
- **Backups**: Daily automated backups + point-in-time recovery
- **Replicas**: 1 read replica for performance

#### **🔐 Security & Secrets**
- **Secret Manager**: JWT secrets, database passwords, API keys
- **IAM**: Least-privilege access with service accounts
- **VPC**: Private networking with Cloud SQL Private IP
- **SSL**: Managed SSL certificates for custom domain

#### **📊 Monitoring & Logging**
- **Cloud Monitoring**: Application metrics, uptime, performance
- **Cloud Logging**: Structured application logs with retention
- **Alerting**: Email/SMS alerts for critical issues
- **Dashboards**: Custom dashboards for business metrics

#### **🌐 Networking & CDN**
- **Load Balancer**: Global HTTPS Load Balancer
- **CDN**: Cloud CDN for static assets and API caching
- **Domain**: Custom domain (fintrack.com) with SSL
- **Firewall**: Cloud Armor for DDoS protection

### **Cost Estimation (Monthly)**

#### **Development Environment**
- **Local**: $0 (local PostgreSQL)
- **Total**: **$0/month**

#### **Staging Environment**
- **Vercel**: $0 (Hobby plan)
- **Supabase**: $0 (Free tier)
- **Total**: **$0/month**

#### **Production Environment (GCP)**
- **Cloud Run**: ~$20-50 (based on traffic)
- **Cloud SQL**: ~$100-150 (db-standard-2 + HA)
- **Cloud Storage**: ~$5-10 (file uploads)
- **Load Balancer**: ~$20-25 (global LB)
- **Monitoring**: ~$10-20 (logs + metrics)
- **Domain/SSL**: ~$12/year (domain registration)
- **Total**: **~$155-255/month** (scales with usage)

### **Deployment Strategy**

#### **Blue-Green Deployment**
1. **Build**: Create new container image
2. **Deploy**: Deploy to new Cloud Run revision (0% traffic)
3. **Test**: Run health checks and smoke tests
4. **Route**: Gradually shift traffic (10% → 50% → 100%)
5. **Monitor**: Watch metrics and error rates
6. **Rollback**: Instant rollback if issues detected

#### **Database Migrations**
1. **Backup**: Create database backup before migration
2. **Migrate**: Run Prisma migrations in maintenance window
3. **Validate**: Verify data integrity and application health
4. **Monitor**: Watch for performance issues post-migration

### **Disaster Recovery Plan**

#### **RTO/RPO Targets**
- **Recovery Time Objective (RTO)**: 15 minutes
- **Recovery Point Objective (RPO)**: 1 hour

#### **Backup Strategy**
- **Database**: Daily automated backups + point-in-time recovery
- **Application**: Container images stored in Container Registry
- **Configuration**: Infrastructure as Code with Terraform
- **Secrets**: Backed up in Google Secret Manager

#### **Incident Response**
1. **Detection**: Automated alerting triggers incident
2. **Assessment**: Determine severity and impact
3. **Response**: Execute appropriate recovery procedure
4. **Communication**: Update status page and notify users
5. **Resolution**: Restore service and validate functionality
6. **Post-mortem**: Document incident and improve processes

---

## **🚀 GCP Setup Checklist**

### **Prerequisites**
- [ ] Google Cloud account with billing enabled
- [ ] Domain name purchased and DNS configured
- [ ] GitHub repository with CI/CD pipeline

### **Phase 1: Project Setup**
- [ ] Create GCP project (`fintrack-production`)
- [ ] Enable required APIs (Cloud Run, Cloud SQL, etc.)
- [ ] Set up billing alerts and quotas
- [ ] Create service accounts with minimal permissions

### **Phase 2: Database Setup**
- [ ] Create Cloud SQL PostgreSQL instance
- [ ] Configure High Availability and backups
- [ ] Set up private IP and VPC peering
- [ ] Create database user and configure permissions

### **Phase 3: Application Deployment**
- [ ] Create Dockerfile for production builds
- [ ] Set up Google Container Registry
- [ ] Create Cloud Run service
- [ ] Configure environment variables and secrets

### **Phase 4: Domain & Security**
- [ ] Configure custom domain with SSL
- [ ] Set up Cloud Armor for security
- [ ] Implement rate limiting and CORS
- [ ] Configure Google Secret Manager

### **Phase 5: Monitoring & Alerting**
- [ ] Set up Cloud Monitoring dashboards
- [ ] Configure alerting policies
- [ ] Implement structured logging
- [ ] Set up uptime monitoring

### **Phase 6: Testing & Go-Live**
- [ ] Run load testing and performance validation
- [ ] Execute disaster recovery testing
- [ ] Conduct security audit
- [ ] Go-live with traffic monitoring

---

*Last Updated: $(date)*
*Environment: Development → Staging (In Progress) → Production (GCP Planned)*
