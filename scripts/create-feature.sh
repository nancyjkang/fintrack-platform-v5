#!/bin/bash

# Create Feature Script
# Usage: ./scripts/create-feature.sh feature-name

if [ -z "$1" ]; then
    echo "❌ Error: Feature name is required"
    echo "Usage: ./scripts/create-feature.sh feature-name"
    echo "Example: ./scripts/create-feature.sh transaction-management"
    exit 1
fi

FEATURE_NAME="$1"
FEATURE_TITLE=$(echo "$FEATURE_NAME" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
TODAY=$(date +%Y-%m-%d)

echo "🚀 Creating feature: $FEATURE_TITLE"

# Create feature directory
FEATURE_DIR="docs/features/$FEATURE_NAME"
mkdir -p "$FEATURE_DIR"

# Create planning document from template
PLANNING_FILE="$FEATURE_DIR/planning.md"
cp docs/templates/FEATURE_PLANNING_TEMPLATE.md "$PLANNING_FILE"

# Replace placeholders in planning template
sed -i.bak "s/\[FEATURE_NAME\]/$FEATURE_TITLE/g" "$PLANNING_FILE"
sed -i.bak "s/\[DATE\]/$TODAY/g" "$PLANNING_FILE"
rm "$PLANNING_FILE.bak"

# Create documentation template (for later use)
DOCS_FILE="$FEATURE_DIR/implementation.md"
cp docs/templates/FEATURE_DOCUMENTATION_TEMPLATE.md "$DOCS_FILE"
sed -i.bak "s/\[FEATURE_NAME\]/$FEATURE_TITLE/g" "$DOCS_FILE"
sed -i.bak "s/\[DATE\]/$TODAY/g" "$DOCS_FILE"
rm "$DOCS_FILE.bak"

# Create execution tracking file
EXECUTION_FILE="$FEATURE_DIR/execution-log.md"
cat > "$EXECUTION_FILE" << EOF
# $FEATURE_TITLE - Execution Log

**Started**: $TODAY
**Status**: Planning

---

## 📋 **Daily Progress**

### **$TODAY - Planning**
**Goal**: Complete feature planning and get approval to start

**Tasks**:
- [ ] Fill out planning document
- [ ] Get planning review and approval
- [ ] Identify any missing dependencies
- [ ] Confirm priority and timeline

**Notes**:
- Created feature planning documents
- Ready for planning review

---

## 🎯 **Next Steps**
1. Complete planning document
2. Get approval to proceed
3. Start implementation

---

*Add daily updates here as development progresses*
EOF

# Update main progress tracker
echo ""
echo "📝 Updating progress tracker..."

# Add to progress tracker (if it exists)
if [ -f "docs/PROGRESS_TRACKER.md" ]; then
    # Add to planning section
    sed -i.bak "/## 📋 \*\*Next 2-3 Weeks Plan\*\*/a\\
\\
### **$FEATURE_TITLE** - Planning Phase\\
- [ ] Complete feature planning document\\
- [ ] Review and approve scope\\
- [ ] Identify dependencies and blockers\\
- [ ] Confirm timeline and priority\\
" docs/PROGRESS_TRACKER.md
    rm docs/PROGRESS_TRACKER.md.bak
fi

echo ""
echo "✅ Feature created successfully!"
echo ""
echo "📁 Files created:"
echo "   - $PLANNING_FILE"
echo "   - $DOCS_FILE"
echo "   - $EXECUTION_FILE"
echo ""
echo "🎯 Next steps:"
echo "   1. Edit $PLANNING_FILE"
echo "   2. Fill out all sections completely"
echo "   3. Get planning review and approval"
echo "   4. Start development using the execution log"
echo ""
echo "💡 Tips:"
echo "   - Be specific in your planning - it saves time later"
echo "   - Update the execution log daily"
echo "   - Use the documentation template when feature is complete"
echo ""
