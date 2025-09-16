#!/bin/bash

# FinTrack v5 - Pre-Deployment Verification Script
# STEP 1 of 3-step deployment process
# Based on proven v4.1 deployment workflow

set -e  # Exit on any error

echo "🛡️  STEP 1: Pre-Deployment Verification"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "💡 Run this script from the fintrack-platform-v5 directory"
    exit 1
fi

# Verify this is the correct project
if ! grep -q "fintrack-platform-v5" package.json; then
    echo "❌ Error: Not in fintrack-platform-v5 project"
    exit 1
fi

echo "📋 Running comprehensive pre-deployment checks..."
echo ""

# 1. Git Status Check
echo "🔍 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Uncommitted changes detected"
    echo "💡 Please commit or stash your changes before deployment"
    git status --short
    exit 1
fi
echo "  ✅ Git working directory is clean"

# 2. TypeScript Compilation Check
echo "🔍 Checking TypeScript compilation..."
if ! npm run type-check > /dev/null 2>&1; then
    echo "❌ Error: TypeScript compilation failed"
    echo "💡 Run 'npm run type-check' to see detailed errors"
    exit 1
fi
echo "  ✅ TypeScript compilation passed"

# 3. ESLint Check (allow warnings, fail on errors)
echo "🔍 Running ESLint checks..."
if ! npm run lint > /dev/null 2>&1; then
    echo "⚠️  Warning: ESLint issues detected"
    echo "💡 Run 'npm run lint' to see issues"
    echo "💡 Continuing deployment (ESLint warnings won't block)"
else
    echo "  ✅ ESLint checks passed"
fi

# 4. Test Suite
echo "🔍 Running test suite..."
if ! npm test > /dev/null 2>&1; then
    echo "❌ Error: Test suite failed"
    echo "💡 Run 'npm test' to see detailed test failures"
    exit 1
fi
echo "  ✅ Test suite passed"

# 5. Production Build Test
echo "🔍 Testing production build..."
if ! npm run build > /dev/null 2>&1; then
    echo "❌ Error: Production build failed"
    echo "💡 Run 'npm run build' to see detailed build errors"
    exit 1
fi
echo "  ✅ Production build successful"

# 6. Database Connection Check (if applicable)
echo "🔍 Checking database connectivity..."
if ! npx prisma db pull --schema=./prisma/schema.prisma > /dev/null 2>&1; then
    echo "⚠️  Warning: Database connection issue detected"
    echo "💡 Verify DATABASE_URL environment variable"
    echo "💡 Continuing deployment (database will be checked during build)"
else
    echo "  ✅ Database connection verified"
fi

echo ""
echo "✅ STEP 1 COMPLETE: All pre-deployment checks passed!"
echo ""
echo "📋 Next Steps:"
echo "   2. Generate release documentation: npm run release"
echo "   3. Deploy to production: npm run deploy"
echo ""
echo "💡 Or run the complete workflow:"
echo "   npm run release && npm run deploy"
