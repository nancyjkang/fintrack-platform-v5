#!/bin/bash

# FinTrack v5 - Production Deployment Script
# STEP 3 of 3-step deployment process
# Based on proven v4.1 deployment workflow

set -e  # Exit on any error

echo "🚀 STEP 3: Deploy to Production"
echo "==============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
RELEASE_DIR="docs/releases/v$VERSION"

# Verify previous steps completed
if [ ! -d "$RELEASE_DIR" ]; then
    echo "❌ Error: Release documentation not found"
    echo "💡 Run 'npm run release' first (STEP 2)"
    exit 1
fi

echo "📦 Deploying FinTrack v$VERSION to production"
echo "🔗 Target: https://fintrack-platform-v5.vercel.app"
echo ""

# Final confirmation
read -p "🚨 Deploy to PRODUCTION? This will update the live site. (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Production deployment cancelled"
    exit 1
fi

# Final git status check
echo "🔍 Final git status check..."
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Uncommitted changes detected"
    echo "💡 Commit all changes before deployment"
    git status --short
    exit 1
fi
echo "  ✅ Git working directory is clean"

# Final build check
echo "🔍 Final production build check..."
if ! npm run build > /dev/null 2>&1; then
    echo "❌ Error: Production build failed"
    echo "💡 Run 'npm run build' to see detailed errors"
    exit 1
fi
echo "  ✅ Production build successful"

# Create release tag
TIMESTAMP=$(date +%s)
RELEASE_TAG="v$VERSION-$TIMESTAMP"
echo "🏷️  Creating release tag: $RELEASE_TAG"
git tag -a "$RELEASE_TAG" -m "Release v$VERSION - $(date '+%Y-%m-%d %H:%M:%S')"
echo "  ✅ Release tag created: $RELEASE_TAG"

# Deploy to Vercel
echo "🚀 Deploying to Vercel production..."
DEPLOY_OUTPUT=$(vercel --prod 2>&1)
DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo "❌ Error: Vercel deployment failed"
    echo "$DEPLOY_OUTPUT"
    echo ""
    echo "🧹 Cleaning up failed deployment..."
    git tag -d "$RELEASE_TAG" 2>/dev/null || true
    exit 1
fi

# Extract deployment URL from Vercel output
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -E "https://.*\.vercel\.app" | tail -1 | sed 's/.*\(https:\/\/[^[:space:]]*\).*/\1/')

if [ -z "$DEPLOY_URL" ]; then
    echo "⚠️  Warning: Could not extract deployment URL from Vercel output"
    DEPLOY_URL="https://fintrack-platform-v5.vercel.app"
fi

echo "  ✅ Deployment successful!"
echo "  🔗 Live URL: $DEPLOY_URL"

# Update documentation with deployment URL
echo "📝 Updating documentation with deployment URL..."

# Update main CHANGELOG.md
sed -i.bak "s|\[URL will be updated after deployment\]|$DEPLOY_URL|g" CHANGELOG.md
rm CHANGELOG.md.bak

# Update release CHANGELOG.md
sed -i.bak "s|\[URL will be updated after deployment\]|$DEPLOY_URL|g" "$RELEASE_DIR/CHANGELOG.md"
rm "$RELEASE_DIR/CHANGELOG.md.bak"

# Update deployment notes
sed -i.bak "s|\[Will be updated during deployment\]|$(date '+%Y-%m-%d %H:%M:%S UTC')|g" "$RELEASE_DIR/DEPLOYMENT_NOTES.md"
sed -i.bak "s|\[Will be created during deployment\]|$RELEASE_TAG|g" "$RELEASE_DIR/DEPLOYMENT_NOTES.md"
rm "$RELEASE_DIR/DEPLOYMENT_NOTES.md.bak"

# Create/update deployment log
DEPLOYMENT_LOG="docs/deployment/DEPLOYMENT_LOG.md"
mkdir -p "docs/deployment"

if [ ! -f "$DEPLOYMENT_LOG" ]; then
    echo "# FinTrack v5 - Deployment History" > "$DEPLOYMENT_LOG"
    echo "" >> "$DEPLOYMENT_LOG"
fi

# Add this deployment to the log
cat > temp_deployment.md << EOF
## v$VERSION - $(date '+%Y-%m-%d')
- **Deployed**: $(date '+%Y-%m-%d %H:%M:%S UTC')
- **Live URL**: $DEPLOY_URL
- **Git Tag**: $RELEASE_TAG
- **Git Commit**: $(git rev-parse --short HEAD)
- **Status**: ✅ DEPLOYED SUCCESSFULLY
- **Rollback Command**: \`vercel rollback --previous\`

EOF

# Prepend to deployment log (after header)
head -2 "$DEPLOYMENT_LOG" > temp_header.md
cat temp_deployment.md >> temp_header.md
tail -n +3 "$DEPLOYMENT_LOG" >> temp_header.md
mv temp_header.md "$DEPLOYMENT_LOG"
rm temp_deployment.md

echo "  ✅ Documentation updated with deployment URL"

# Commit documentation updates
echo "📝 Committing documentation updates..."
git add CHANGELOG.md "$RELEASE_DIR/" "$DEPLOYMENT_LOG"
git commit -m "docs: update deployment URLs for v$VERSION

- Live URL: $DEPLOY_URL
- Release tag: $RELEASE_TAG
- Deployment: $(date '+%Y-%m-%d %H:%M:%S UTC')"

# Push release tag and documentation updates
echo "📤 Pushing release tag and documentation..."
git push origin main
git push origin "$RELEASE_TAG"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "📊 Deployment Summary:"
echo "   📦 Version: v$VERSION"
echo "   🔗 Live URL: $DEPLOY_URL"
echo "   🏷️  Release Tag: $RELEASE_TAG"
echo "   📝 Documentation: Updated automatically"
echo "   ⏰ Deployed: $(date '+%Y-%m-%d %H:%M:%S UTC')"
echo ""
echo "🧪 Next Steps:"
echo "   1. Test the live application: $DEPLOY_URL"
echo "   2. Verify all functionality works"
echo "   3. Monitor for any issues"
echo ""
echo "🛡️  Rollback Commands (if needed):"
echo "   Quick rollback: vercel rollback --previous"
echo "   Git rollback: git reset --hard $RELEASE_TAG~1 && vercel --prod --force"
echo ""
echo "📋 Deployment completed successfully! 🚀"
