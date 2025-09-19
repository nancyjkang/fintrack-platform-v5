# FinTrack Platform v5 - Documentation

**Essential documentation for development, staging, and production**

---

## 🚀 **Quick Start**

```bash
# Development
git clone [repo] && cd fintrack-platform-v5
npm install
cp env.template .env.local
# Edit .env.local with your DATABASE_URL
npm run db:push && npm run db:seed
npm run dev
```

---

## 📚 **Documentation**

- 📋 [**Quick Reference**](./QUICK_REFERENCE.md) - Essential commands and configs
- 🏗️ [**Environment Setup**](./setup/ENVIRONMENT_SETUP.md) - Detailed setup guides
- 🚀 [**Deployment Guides**](./deployment-guides/README.md) - Deployment procedures
- 🔄 [**GitHub Workflows**](./AUTOMATION_HOOKS.md) - CI/CD automation

---

## 🌍 **Environments**

| Environment | URL | Status | Database |
|-------------|-----|--------|----------|
| **Development** | `http://localhost:3000` | ✅ Active | Local PostgreSQL |
| **Staging** | `https://fintrack-v5-staging.vercel.app` | 🚧 In Progress | Supabase |
| **Production** | `https://fintrack.com` | ⏳ Planned | Cloud SQL |

---

## 🔧 **Essential Commands**

### **Development**
```bash
npm run dev              # Start development
npm run build            # Build application
npm run test             # Run tests
npm run db:studio        # Open database studio
```

### **Deployment**
```bash
vercel                   # Deploy to staging
vercel --prod            # Deploy to production
vercel rollback          # Rollback deployment
```

### **Database**
```bash
npm run db:push          # Push schema
npm run db:seed          # Seed data
npm run db:migrate:prod  # Apply migrations
```

---

## 🚨 **Emergency**

```bash
# Rollback
vercel rollback --previous

# Check status
vercel status

# View logs
vercel logs --follow

# Test database
npx prisma db pull
```

---

*Keep it simple. Keep it working.*
