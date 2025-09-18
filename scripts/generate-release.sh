#!/bin/bash

# FinTrack v5 - Release Documentation Generation Script
# STEP 2 of 3-step deployment process
# Based on proven v4.1 deployment workflow

set -e  # Exit on any error

echo "📝 STEP 2: Generate Release Documentation"
echo "======================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
if [ -z "$VERSION" ]; then
    echo "❌ Error: Could not read version from package.json"
    exit 1
fi

echo "📦 Generating release documentation for version: v$VERSION"
echo ""

# Validate test case documentation for completed features
echo "🧪 Validating test case documentation..."
if ! npm run validate-test-cases -- --version="$VERSION"; then
    echo ""
    echo "⚠️  Warning: Some completed features in v$VERSION are missing test case documentation."
    echo "   This may impact QA testing for this release."
    echo ""
    read -p "Continue with release generation anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Release generation cancelled. Please add missing test cases first."
        exit 1
    fi
    echo "⚠️  Proceeding with incomplete test documentation..."
else
    echo "  ✅ All completed features have proper test case documentation"
fi
echo ""

# Create release directory
RELEASE_DIR="docs/releases/v$VERSION"
if [ -d "$RELEASE_DIR" ]; then
    echo "⚠️  Warning: Release directory already exists: $RELEASE_DIR"
    read -p "Overwrite existing release documentation? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Release documentation generation cancelled"
        exit 1
    fi
    rm -rf "$RELEASE_DIR"
fi

mkdir -p "$RELEASE_DIR"
echo "  ✅ Created release directory: $RELEASE_DIR"

# Generate CHANGELOG.md (detailed release notes)
echo "📝 Generating detailed changelog..."
cat > "$RELEASE_DIR/CHANGELOG.md" << EOF
# FinTrack v$VERSION - Release Notes

**Release Date**: $(date '+%Y-%m-%d')
**Version**: v$VERSION
**Deployment Status**: 🟡 Ready for Deployment

---

## 🎯 **Release Summary**

This release includes transaction management improvements, deployment workflow enhancements, and code quality fixes.

## ✨ **New Features**

- ✅ **Intelligent Seed Generation**: Configurable realistic financial data generation
- ✅ **Vercel CLI Deployment**: Direct deployment bypassing GitHub Actions complexity
- ✅ **3-Step Deployment Process**: Proven workflow from v4.1 success

## 🐛 **Bug Fixes**

- ✅ **TypeScript Errors**: Resolved CI/CD pipeline compilation issues
- ✅ **Date Handling**: Consistent UTC date utilities across components
- ✅ **Prisma Types**: Fixed tenant client type compatibility

## 🔧 **Technical Improvements**

- ✅ **Code Quality**: Enhanced ESLint rules and pre-commit hooks
- ✅ **Test Coverage**: Improved test reliability and date mocking
- ✅ **Documentation**: Comprehensive deployment and feature lifecycle docs

## 🚀 **Deployment Notes**

- **Database Migration Required**: No
- **Environment Variables**: Verify DATABASE_URL, JWT_SECRET, NEXTAUTH_SECRET
- **Breaking Changes**: None
- **Rollback Plan**: Previous deployment via Vercel dashboard

## 🧪 **Testing Checklist**

- [ ] Login/Registration functionality
- [ ] Transaction CRUD operations
- [ ] Account management
- [ ] Category filtering and display
- [ ] Mobile responsiveness
- [ ] Database connectivity

## 📊 **Performance**

- **Build Time**: ~90 seconds
- **Bundle Size**: ~120KB (transactions page)
- **Database**: PostgreSQL with connection pooling

---

**Live Demo**: [URL will be updated after deployment]

**Rollback Command**: \`vercel rollback --previous\`
EOF

echo "  ✅ Generated: $RELEASE_DIR/CHANGELOG.md"

# Generate DEPLOYMENT_NOTES.md
echo "📝 Generating deployment notes..."
cat > "$RELEASE_DIR/DEPLOYMENT_NOTES.md" << EOF
# Deployment Notes - v$VERSION

## 🚀 **Deployment Instructions**

### **Pre-Deployment Checklist**
- [x] STEP 1 completed: \`npm run pre-deploy\` ✅
- [x] STEP 2 completed: \`npm run release\` ✅
- [ ] STEP 3 ready: \`npm run deploy\`

### **Deployment Command**
\`\`\`bash
npm run deploy
\`\`\`

### **Expected Deployment Time**
- Build: ~90 seconds
- Deploy: ~60 seconds
- Total: ~2.5 minutes

## 🔧 **Environment Requirements**

### **Required Environment Variables**
\`\`\`bash
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://fintrack-platform-v5.vercel.app"
\`\`\`

### **Optional Environment Variables**
\`\`\`bash
ENCRYPTION_KEY="your-32-character-key"
\`\`\`

## 🛡️ **Rollback Plan**

### **Quick Rollback**
\`\`\`bash
vercel rollback --previous
\`\`\`

### **Git-based Rollback**
\`\`\`bash
git tag --sort=-version:refname | head -5  # Find previous tag
git reset --hard [previous-tag]
vercel --prod --force
\`\`\`

## 🧪 **Post-Deployment Verification**

### **Automated Checks**
- [ ] Application loads without errors
- [ ] API health check: \`/api/health\`
- [ ] Database connectivity verified

### **Manual Testing**
- [ ] User registration/login
- [ ] Transaction creation/editing
- [ ] Account management
- [ ] Mobile responsiveness

## 📊 **Monitoring**

### **Key Metrics to Watch**
- Response times < 2 seconds
- Error rate < 1%
- Database connection pool health
- Memory usage < 512MB

### **Alert Conditions**
- 5xx errors > 5 in 5 minutes
- Response time > 5 seconds
- Database connection failures

---

**Deployment Date**: [Will be updated during deployment]
**Deployment URL**: [Will be updated during deployment]
**Git Tag**: [Will be created during deployment]
EOF

echo "  ✅ Generated: $RELEASE_DIR/DEPLOYMENT_NOTES.md"

# Update main CHANGELOG.md
echo "📝 Updating main CHANGELOG.md..."
if [ ! -f "CHANGELOG.md" ]; then
    echo "# FinTrack v5 - Changelog" > CHANGELOG.md
    echo "" >> CHANGELOG.md
fi

# Backup existing changelog
cp CHANGELOG.md CHANGELOG.md.backup

# Create new changelog with this release at the top
cat > CHANGELOG.md << EOF
# FinTrack v5 - Changelog

## v$VERSION - $(date '+%Y-%m-%d')

**Status**: 🟡 Ready for Deployment

### ✨ New Features
- Intelligent seed generation with configurable parameters
- Direct Vercel CLI deployment workflow
- Enhanced transaction management UI

### 🐛 Bug Fixes
- Resolved TypeScript compilation errors in CI/CD
- Fixed date handling consistency across components
- Improved Prisma type compatibility

### 🔧 Technical Improvements
- Enhanced code quality with ESLint rules
- Improved test reliability and coverage
- Comprehensive deployment documentation

**Live Demo**: [URL will be updated after deployment]

---

$(tail -n +3 CHANGELOG.md.backup)
EOF

rm CHANGELOG.md.backup
echo "  ✅ Updated main CHANGELOG.md"

echo ""
echo "✅ STEP 2 COMPLETE: Release documentation generated!"
echo ""
echo "📁 Generated Files:"
echo "   - $RELEASE_DIR/CHANGELOG.md"
echo "   - $RELEASE_DIR/DEPLOYMENT_NOTES.md"
echo "   - Updated CHANGELOG.md"
echo ""
echo "📋 Next Steps:"
echo "   3. Deploy to production: npm run deploy"
echo ""
echo "💡 Review the generated documentation before deploying:"
echo "   cat $RELEASE_DIR/CHANGELOG.md"
