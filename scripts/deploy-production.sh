#!/bin/bash

# FinTrack v5 - Deploy to Production via Vercel CLI
# This script performs pre-deployment checks and deploys to production

set -e  # Exit on any error

echo "🚀 FinTrack v5 - Production Deployment"
echo "====================================="

# Warning for production deployment
echo "⚠️  WARNING: This will deploy to PRODUCTION"
echo "🔗 URL: https://fintrack-platform-v5.vercel.app"
echo ""
read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Production deployment cancelled"
  exit 1
fi

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

echo "  ✓ Running test suite..."
npm test > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Run 'npm test' to see detailed errors."
  exit 1
fi

echo "  ✓ All pre-checks passed!"
echo ""

# Deploy to production
echo "🚀 Deploying to production..."
echo "📝 This will update the live production site"
echo ""

# Run Vercel production deployment
vercel --prod

echo ""
echo "✅ Production deployment complete!"
echo "🔗 Live at: https://fintrack-platform-v5.vercel.app"
echo "📋 Next steps:"
echo "   1. Test the production URL"
echo "   2. Verify all functionality works"
echo "   3. Monitor for any issues"
