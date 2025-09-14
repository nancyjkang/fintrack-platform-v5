#!/bin/bash

# FinTrack v5 Deployment Script for Vercel
# Handles production and preview deployments with proper validation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="fintrack-platform-v5"
VERCEL_ORG="fintrack"  # Update with your Vercel org

# Parse command line arguments
PREVIEW_MODE=false
FORCE_DEPLOY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --preview)
      PREVIEW_MODE=true
      shift
      ;;
    --force)
      FORCE_DEPLOY=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🚀 FinTrack v5 Deployment Script${NC}"
echo "=================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

# Check if we're logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Vercel${NC}"
    echo "Login with: vercel login"
    exit 1
fi

# Get current version from package.json
VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}📦 Version: ${VERSION}${NC}"

# Pre-deployment checks (skip if force deploy)
if [ "$FORCE_DEPLOY" = false ]; then
    echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

    # Run CI checks
    npm run ci-check

    # Check git status
    node scripts/check-git-status.js

    # Create backup
    npm run backup-data

    # Validate data integrity
    npm run validate-data

    echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping pre-deployment checks (force deploy)${NC}"
fi

# Generate release documentation
npm run generate-release

# Deploy based on mode
if [ "$PREVIEW_MODE" = true ]; then
    echo -e "${YELLOW}🔄 Deploying preview build...${NC}"
    vercel --yes
    DEPLOYMENT_URL=$(vercel ls --meta | head -n 1 | awk '{print $2}')
else
    echo -e "${GREEN}🚀 Deploying to production...${NC}"
    vercel --prod --yes
    DEPLOYMENT_URL="https://${PROJECT_NAME}.vercel.app"
fi

# Wait for deployment to be ready
echo -e "${BLUE}⏳ Waiting for deployment to be ready...${NC}"
sleep 10

# Basic health check
echo -e "${BLUE}🏥 Running health checks...${NC}"
if curl -f -s "${DEPLOYMENT_URL}/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check endpoint not available (this is normal for new deployments)${NC}"
fi

# Test basic pages
if curl -f -s "${DEPLOYMENT_URL}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Homepage accessible${NC}"
else
    echo -e "${RED}❌ Homepage not accessible${NC}"
    exit 1
fi

# Create git tag for production deployments
if [ "$PREVIEW_MODE" = false ]; then
    TAG_NAME="v${VERSION}"
    if git tag -l | grep -q "^${TAG_NAME}$"; then
        echo -e "${YELLOW}⚠️  Tag ${TAG_NAME} already exists${NC}"
    else
        git tag "${TAG_NAME}"
        echo -e "${GREEN}✅ Created git tag: ${TAG_NAME}${NC}"

        # Push tag to remote
        if git remote | grep -q origin; then
            git push origin "${TAG_NAME}"
            echo -e "${GREEN}✅ Pushed tag to remote${NC}"
        fi
    fi
fi

# Success message
echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo -e "${BLUE}🌐 URL: ${DEPLOYMENT_URL}${NC}"
echo -e "${BLUE}📝 Version: ${VERSION}${NC}"

if [ "$PREVIEW_MODE" = true ]; then
    echo -e "${YELLOW}📋 This is a preview deployment${NC}"
else
    echo -e "${GREEN}🚀 This is a production deployment${NC}"
fi

echo ""
echo "Next steps:"
echo "1. Test the deployment thoroughly"
echo "2. Monitor logs and performance"
echo "3. Update documentation if needed"

# Save deployment info
DEPLOYMENT_INFO="{
  \"version\": \"${VERSION}\",
  \"url\": \"${DEPLOYMENT_URL}\",
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"preview\": ${PREVIEW_MODE},
  \"commit\": \"$(git rev-parse HEAD)\"
}"

mkdir -p deployments
echo "${DEPLOYMENT_INFO}" > "deployments/latest.json"
echo "${DEPLOYMENT_INFO}" > "deployments/deployment-${VERSION}.json"

echo -e "${GREEN}✅ Deployment info saved to deployments/latest.json${NC}"
