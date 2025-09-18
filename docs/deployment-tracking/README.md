# Deployment Tracking System

This directory contains **deployment tracking and environment management** documentation for FinTrack Platform v5.

> **Note**: For deployment procedures and how-to guides, see [`docs/deployment-guides/`](../deployment-guides/README.md)

## Files Overview

### Quick Reference
- **[DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)** - 📊 **Current status overview** (start here!)

### Environment Tracking
- **[staging.md](./staging.md)** - Staging environment deployment history and QA status
- **[production.md](./production.md)** - Production environment deployment history and monitoring

### Release Management
- **[rollback-procedures.md](./rollback-procedures.md)** - Emergency rollback procedures (to be created)

> **Note**: For deployment checklists and templates, see [`docs/deployment-guides/`](../deployment-guides/README.md)

## Version Tracking Strategy

### Branch Strategy
```
main (production)
├── release/v5.1 (staging)
├── release/v5.2 (future staging)
└── feature/* (development)
```

### Version Numbering
- **Production**: `v5.0.2`, `v5.1.0`, `v5.2.0`
- **Release Candidates**: `v5.1.0-rc.1`, `v5.1.0-rc.2`
- **Beta Releases**: `v5.1.0-beta.1` (if needed)

### Git Tags
```bash
# Production releases
git tag -a v5.1.0 -m "Release v5.1.0: CSV Import and Enhanced Transactions"

# Release candidates for staging
git tag -a v5.1.0-rc.1 -m "Release candidate 1 for v5.1.0"
```

## Deployment Workflow

### 1. Feature Development
- Develop in feature branches: `feature/v5.1.x-feature-name`
- Merge approved features to release branch: `release/v5.1`

### 2. Staging Deployment
- Release branch automatically deploys to staging
- QA testing performed in staging environment
- Issues fixed directly in release branch or via hotfix

### 3. Production Deployment
- After QA approval, merge release branch to `main`
- Tag the release: `git tag -a v5.1.0`
- Deploy to production
- Update production deployment tracking

### 4. Post-Deployment
- Monitor production health
- Update deployment documentation
- Plan next release cycle

## Environment Differences

| Aspect | Staging | Production |
|--------|---------|------------|
| Database | Staging DB (test data) | Production DB (live data) |
| API Keys | Staging keys | Production keys |
| Logging | DEBUG level | INFO level |
| Features | All enabled | Stable features only |
| Monitoring | Basic | Comprehensive |
| Backups | Weekly | Daily |

## Quick Commands

### Create Release Branch
```bash
git checkout main
git pull origin main
git checkout -b release/v5.x
npm version 5.x.0
git push -u origin release/v5.x
```

### Deploy to Staging
```bash
git checkout release/v5.x
git push origin release/v5.x
# Staging deployment happens automatically
```

### Deploy to Production
```bash
git checkout main
git merge release/v5.x
git tag -a v5.x.0 -m "Release v5.x.0"
git push origin main --tags
# Production deployment happens automatically
```

## Health Monitoring

### Staging Health Check
```bash
curl https://staging.fintrack.com/api/health
```

### Production Health Check
```bash
curl https://fintrack.com/api/health
```

## Emergency Procedures

### Quick Rollback
```bash
# Rollback to previous tag
git checkout [previous-tag]
# Deploy previous version
npm run deploy:[environment]
```

### Contact Information
- **DevOps Team**: devops@fintrack.com
- **On-Call Engineer**: oncall@fintrack.com
- **Emergency Escalation**: emergency@fintrack.com

---

**Last Updated**: January 18, 2025
**Next Review**: February 1, 2025
