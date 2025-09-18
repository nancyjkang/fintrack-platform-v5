# 🤖 Deployment Automation Setup Guide

## Overview

This guide walks you through setting up automated deployments for staging and production environments using GitHub Actions and Vercel.

## 🔧 Prerequisites

### Required Secrets in GitHub Repository

Navigate to **Settings → Secrets and variables → Actions** in your GitHub repository and add:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | [Vercel Account Settings](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel organization ID | Run `vercel whoami` or check project settings |
| `VERCEL_PROJECT_ID` | Your project ID in Vercel | Check project settings in Vercel dashboard |
| `SLACK_WEBHOOK_URL` | (Optional) Slack notifications | [Slack App Settings](https://api.slack.com/messaging/webhooks) |

### Getting Vercel Information

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Get your organization ID
vercel whoami

# In your project directory, link to Vercel project
vercel link

# Get project information
cat .vercel/project.json
```

## 🚀 Step 1: Enable Staging Automation

### 1.1 Activate the Staging Workflow
```bash
# Copy the template to active workflow
cp .github/workflows/staging-deploy.yml.template .github/workflows/staging-deploy.yml

# Commit the workflow
git add .github/workflows/staging-deploy.yml
git commit -m "ci: add automated staging deployment workflow"
git push origin release/v5.1
```

### 1.2 Test Staging Automation
```bash
# Make a small change to trigger deployment
echo "# Test staging automation" >> README.md
git add README.md
git commit -m "test: trigger staging deployment"
git push origin release/v5.1
```

### 1.3 Verify Staging Deployment
- Check **Actions** tab in GitHub repository
- Verify deployment in Vercel dashboard
- Check that `docs/deployment-tracking/staging.md` was updated automatically

## 🎯 Step 2: Enable Production Automation

### 2.1 Set Up Production Environment Protection (Recommended)

1. Go to **Settings → Environments** in GitHub repository
2. Create new environment named `production`
3. Add protection rules:
   - ✅ Required reviewers (1-2 team members)
   - ✅ Wait timer (optional, e.g., 5 minutes)
   - ✅ Deployment branches: Only `main`

### 2.2 Activate the Production Workflow
```bash
# Copy the template to active workflow
cp .github/workflows/production-deploy.yml.template .github/workflows/production-deploy.yml

# Commit the workflow
git add .github/workflows/production-deploy.yml
git commit -m "ci: add automated production deployment workflow"
git push origin main
```

### 2.3 Test Production Automation
```bash
# Create a test merge to main (or use existing release merge)
git checkout main
git pull origin main
# Production deployment should trigger automatically
```

## 📋 Step 3: Workflow Customization

### 3.1 Update Deployment URLs

Edit the workflow files to match your actual Vercel URLs:

```yaml
# In staging-deploy.yml
- name: 🧪 Run smoke tests
  run: |
    curl -f https://your-actual-staging-url.vercel.app/api/health || exit 1

# In production-deploy.yml  
# URLs are automatically extracted from Vercel deployment
```

### 3.2 Customize Notification Settings

```yaml
# Add more notification channels
- name: 📢 Notify via Email
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "🚀 Deployment Complete: ${{ steps.version.outputs.tag }}"
    body: "Production deployment successful!"
    to: team@yourcompany.com
```

### 3.3 Add Custom Health Checks

```yaml
# In both workflows, enhance the smoke tests section
- name: 🧪 Extended health checks
  run: |
    # API health check
    curl -f "$DEPLOY_URL/api/health" || exit 1
    
    # Database connectivity check
    curl -f "$DEPLOY_URL/api/health/database" || exit 1
    
    # Authentication check
    curl -f "$DEPLOY_URL/api/auth/status" || exit 1
    
    echo "✅ All health checks passed!"
```

## 🔄 Step 4: Branch Protection Rules

### 4.1 Protect Release Branches
1. Go to **Settings → Branches** in GitHub
2. Add rule for `release/*` pattern:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

### 4.2 Protect Main Branch
1. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging (2 reviewers)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Restrict pushes to matching branches
   - ✅ Include administrators

## 🚨 Step 5: Rollback Procedures

### 5.1 Automated Rollback (Advanced)
```yaml
# Add to production-deploy.yml
- name: 🔄 Rollback on failure
  if: failure()
  run: |
    echo "🚨 Deployment failed, initiating rollback..."
    
    # Get previous successful deployment
    PREVIOUS_DEPLOYMENT=$(vercel ls --token=${{ secrets.VERCEL_TOKEN }} | grep "READY" | head -2 | tail -1 | awk '{print $1}')
    
    # Promote previous deployment
    vercel promote $PREVIOUS_DEPLOYMENT --token=${{ secrets.VERCEL_TOKEN }}
    
    echo "✅ Rollback completed to: $PREVIOUS_DEPLOYMENT"
```

### 5.2 Manual Rollback Commands
```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or promote a previous deployment
vercel promote [deployment-url]
```

## 📊 Step 6: Monitoring and Alerts

### 6.1 Set Up Deployment Monitoring
```yaml
# Add monitoring step to workflows
- name: 📊 Setup monitoring
  run: |
    # Send deployment info to monitoring service
    curl -X POST "https://your-monitoring-service.com/deployments" \
      -H "Content-Type: application/json" \
      -d '{
        "version": "${{ steps.version.outputs.version }}",
        "environment": "production",
        "url": "${{ steps.vercel-deploy.outputs.preview-url }}",
        "commit": "${{ github.sha }}"
      }'
```

### 6.2 Health Check Monitoring
Consider setting up external monitoring services like:
- **Uptime Robot**: For basic uptime monitoring
- **Pingdom**: For performance monitoring
- **DataDog**: For comprehensive application monitoring
- **New Relic**: For application performance monitoring

## ✅ Verification Checklist

After setup, verify that:

- [ ] Staging deploys automatically when merging to release branch
- [ ] Production requires manual approval (if environment protection enabled)
- [ ] Production deploys automatically when merging to main
- [ ] Documentation is updated automatically after deployments
- [ ] Team notifications are working
- [ ] Health checks are passing
- [ ] Git tags are created for production releases
- [ ] GitHub releases are created automatically
- [ ] Rollback procedures are documented and tested

## 🎯 Next Steps

1. **Monitor First Few Deployments**: Watch the automation closely for the first few deployments
2. **Refine Health Checks**: Add more comprehensive health checks based on your application
3. **Set Up Monitoring**: Implement external monitoring for production
4. **Document Runbooks**: Create runbooks for common deployment issues
5. **Train Team**: Ensure all team members understand the new automated process

---

*This automation setup provides a robust, scalable deployment pipeline that grows with your team and project needs.*
