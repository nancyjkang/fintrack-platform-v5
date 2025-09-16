#!/bin/bash

# FinTrack v5 - Deploy to Staging via Vercel CLI
# This script performs pre-deployment checks and deploys to staging

set -e  # Exit on any error

echo "🚀 FinTrack v5 - Staging Deployment"
echo "=================================="

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

echo "  ✓ Checking TypeScript compilation..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed. Fix errors before deploying."
  exit 1
fi

echo "  ✓ Testing build..."
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Run 'npm run build' to see detailed errors."
  exit 1
fi

echo "  ✓ All pre-checks passed!"
echo ""

# Deploy to staging
echo "🚀 Deploying to staging..."
echo "📝 This will create a preview URL for testing"
echo ""

# Run Vercel deployment
vercel

echo ""
echo "✅ Deployment complete!"
echo "🔗 Test your staging deployment at the URL shown above"
echo "📋 Next steps:"
echo "   1. Test the staging URL thoroughly"
echo "   2. If everything works, run: npm run deploy:production"
echo "   3. Or use: ./scripts/deploy-production.sh"
