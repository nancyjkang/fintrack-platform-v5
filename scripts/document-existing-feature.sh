#!/bin/bash

# Document Existing Feature Script
# Usage: ./scripts/document-existing-feature.sh feature-name "Feature Title"

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "❌ Error: Feature name and title are required"
    echo "Usage: ./scripts/document-existing-feature.sh feature-name \"Feature Title\""
    echo "Example: ./scripts/document-existing-feature.sh account-management \"Account Management\""
    exit 1
fi

FEATURE_NAME="$1"
FEATURE_TITLE="$2"
TODAY=$(date +%Y-%m-%d)

echo "📝 Creating documentation for existing feature: $FEATURE_TITLE"

# Create feature directory
FEATURE_DIR="docs/features/$FEATURE_NAME"
mkdir -p "$FEATURE_DIR"

# Create implementation documentation (skip planning since it's already built)
DOCS_FILE="$FEATURE_DIR/implementation.md"
cp docs/templates/FEATURE_DOCUMENTATION_TEMPLATE.md "$DOCS_FILE"
sed -i.bak "s/\[FEATURE_NAME\]/$FEATURE_TITLE/g" "$DOCS_FILE"
sed -i.bak "s/\[DATE\]/$TODAY/g" "$DOCS_FILE"
rm "$DOCS_FILE.bak"

# Create execution log showing it's complete
EXECUTION_FILE="$FEATURE_DIR/execution-log.md"
cat > "$EXECUTION_FILE" << EOF
# $FEATURE_TITLE - Execution Log

**Started**: [Previous development period]
**Status**: ✅ Complete
**Completed**: $TODAY (Documentation created retroactively)

---

## 📋 **Implementation Summary**

This feature was implemented during the initial development phase of FinTrack v5. This documentation was created retroactively to establish proper feature documentation patterns.

### **✅ What Was Implemented**
- [List the main components that were built]
- [API endpoints that were created]
- [UI components that were developed]
- [Database changes that were made]

### **🎯 Current Status**
- **Status**: ✅ Complete and deployed
- **Production**: Working in production environment
- **Testing**: Basic functionality verified
- **Documentation**: Implementation details documented

---

## 💡 **Next Steps for This Feature**

### **Documentation Tasks**
- [ ] Fill out implementation.md with detailed technical information
- [ ] Document all API endpoints and their behavior
- [ ] Document UI components and their usage
- [ ] Add troubleshooting guide
- [ ] Include usage examples

### **Potential Improvements**
- [ ] Identify areas for enhancement
- [ ] Document known limitations
- [ ] Plan future improvements
- [ ] Add comprehensive testing

---

*This execution log was created retroactively. Fill out the implementation.md file with detailed information about how this feature was built and how it works.*
EOF

echo ""
echo "✅ Documentation structure created for existing feature!"
echo ""
echo "📁 Files created:"
echo "   - $DOCS_FILE"
echo "   - $EXECUTION_FILE"
echo ""
echo "🎯 Next steps:"
echo "   1. Fill out $DOCS_FILE with detailed implementation information"
echo "   2. Update $EXECUTION_FILE with actual development timeline"
echo "   3. Add feature to FEATURE_BACKLOG.md as ✅ Complete with docs link"
echo ""
echo "💡 Template sections to complete in implementation.md:"
echo "   - What Was Built (feature summary)"
echo "   - Technical Implementation (APIs, UI, database)"
echo "   - Testing (what was tested and how)"
echo "   - Performance & Metrics (benchmarks achieved)"
echo "   - Usage Examples (how to use the feature)"
echo ""






