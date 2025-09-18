#!/usr/bin/env node

/**
 * QA Test Plan Generator
 *
 * This script automatically generates comprehensive QA test plans by:
 * 1. Scanning all implementation.md files for test cases
 * 2. Extracting feature status and completion dates
 * 3. Generating release-specific test plans
 * 4. Creating structured test case documentation
 *
 * Usage:
 *   node scripts/generate-qa-plan.js --version=5.0.2
 *   npm run generate-qa-plan -- --version=5.0.2
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const FEATURES_DIR = path.join(__dirname, '../docs/features');
const RELEASES_DIR = path.join(__dirname, '../docs/releases');
const IMPLEMENTATION_FILE = 'implementation.md';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const version = args.find(arg => arg.startsWith('--version='))?.split('=')[1];
  const includeAll = args.includes('--all');
  const outputFormat = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'markdown';

  return { version, includeAll, outputFormat };
}

/**
 * Get all feature directories with implementation.md files
 */
function getFeatureDirectories() {
  return fs.readdirSync(FEATURES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(featureName => {
      const implPath = path.join(FEATURES_DIR, featureName, IMPLEMENTATION_FILE);
      return fs.existsSync(implPath);
    });
}

/**
 * Parse implementation.md file to extract feature metadata and test cases
 */
function parseImplementationFile(featurePath) {
  const content = fs.readFileSync(featurePath, 'utf8');
  const lines = content.split('\n');

  const feature = {
    name: '',
    status: '',
    version: '',
    completionDate: '',
    testCases: []
  };

  let currentTestCase = null;
  let inTestCaseSection = false;
  let testCaseContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract feature metadata
    if (line.startsWith('**Feature**:')) {
      feature.name = line.replace('**Feature**:', '').trim();
    } else if (line.startsWith('**Status**:')) {
      feature.status = line.replace('**Status**:', '').trim();
    } else if (line.startsWith('**Version**:')) {
      feature.version = line.replace('**Version**:', '').trim();
    } else if (line.startsWith('**Completion Date**:')) {
      feature.completionDate = line.replace('**Completion Date**:', '').trim();
    } else if (line.startsWith('**Completed**:')) {
      feature.completionDate = line.replace('**Completed**:', '').trim();
    }

    // Detect test case sections (level 2 or 3 headings)
    if (line.match(/^##\s+.*[Tt]est.*[Cc]ases?/) || line.match(/^###\s+.*[Tt]est.*[Cc]ases?/)) {
      inTestCaseSection = true;
      continue;
    }

    // Detect individual test cases (level 3 or 4 headings)
    if (inTestCaseSection && (line.match(/^###\s+.*[Tt]est.*[Cc]ase/) || line.match(/^####\s+.*[Tt]est.*[Cc]ase/))) {
      // Save previous test case if exists
      if (currentTestCase) {
        currentTestCase.content = testCaseContent.join('\n').trim();
        feature.testCases.push(currentTestCase);
      }

      // Start new test case
      currentTestCase = {
        title: line.replace(/^###\s+/, '').trim(),
        content: ''
      };
      testCaseContent = [];
      continue;
    }

    // Stop collecting test cases when we hit another major section
    if (inTestCaseSection && line.match(/^##\s+/) && !line.match(/^##\s+.*[Tt]est.*[Cc]ases?/) && !line.match(/^###\s+.*[Tt]est.*[Cc]ases?/)) {
      // Save last test case
      if (currentTestCase) {
        currentTestCase.content = testCaseContent.join('\n').trim();
        feature.testCases.push(currentTestCase);
        currentTestCase = null;
      }
      inTestCaseSection = false;
      continue;
    }

    // Collect test case content
    if (inTestCaseSection && currentTestCase) {
      testCaseContent.push(line);
    }
  }

  // Save final test case if exists
  if (currentTestCase) {
    currentTestCase.content = testCaseContent.join('\n').trim();
    feature.testCases.push(currentTestCase);
  }

  return feature;
}

/**
 * Filter features based on criteria
 */
function filterFeatures(features, criteria) {
  if (criteria.includeAll) {
    return features;
  }

  return features.filter(feature => {
    // Only include completed features (if status exists)
    if (feature.status && !feature.status.includes('COMPLETED') && !feature.status.includes('COMPLETE')) {
      return false;
    }
    
    // If no status but has completion date, consider it completed
    if (!feature.status && !feature.completionDate) {
      return false;
    }
    
    // Filter by version if specified
    if (criteria.version && feature.version && !feature.version.includes(criteria.version)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Generate markdown test plan
 */
function generateMarkdownTestPlan(features, version) {
  const timestamp = new Date().toISOString().split('T')[0];
  const totalTestCases = features.reduce((sum, feature) => sum + feature.testCases.length, 0);

  let markdown = `# FinTrack v5 - QA Test Plan${version ? ` (v${version})` : ''}

**Generated**: ${timestamp}
**Total Features**: ${features.length}
**Total Test Cases**: ${totalTestCases}
**Test Environment**: [To be filled by QA]
**Tester**: [To be filled by QA]

---

## 📋 **Test Plan Overview**

This test plan was automatically generated from feature implementation documentation. It includes all completed features with their associated test cases.

### **Features Included**
${features.map(f => `- ✅ **${f.name}** (${f.testCases.length} test cases)`).join('\n')}

---

## 🧪 **Test Cases by Feature**

`;

  features.forEach((feature, index) => {
    markdown += `### **${index + 1}. ${feature.name}**

**Status**: ${feature.status}
**Version**: ${feature.version}
**Completion Date**: ${feature.completionDate}
**Test Cases**: ${feature.testCases.length}

`;

    feature.testCases.forEach((testCase, tcIndex) => {
      markdown += `#### **${index + 1}.${tcIndex + 1} ${testCase.title}**

${testCase.content}

**Result**: [ ] ✅ Pass [ ] ❌ Fail [ ] ⚠️ Partial
**Notes**: ________________________________
**Tester**: ________________________________
**Date**: ________________________________

---

`;
    });
  });

  markdown += `## 📊 **Test Results Summary**

### **Overall Results**
- **Total Test Cases**: ${totalTestCases}
- **Passed**: _____ / ${totalTestCases}
- **Failed**: _____ / ${totalTestCases}
- **Partial**: _____ / ${totalTestCases}
- **Success Rate**: _____%

### **Feature Results**
${features.map(f => `- **${f.name}**: _____ / ${f.testCases.length} passed`).join('\n')}

### **Critical Issues Found**
1. ________________________________
2. ________________________________
3. ________________________________

### **Recommendations**
- [ ] Ready for production deployment
- [ ] Requires minor fixes before deployment
- [ ] Requires major fixes before deployment
- [ ] Not ready for deployment

**QA Sign-off**: ________________________________
**Date**: ________________________________

---

*This test plan was automatically generated from implementation documentation. For questions about specific test cases, refer to the corresponding feature implementation documentation.*
`;

  return markdown;
}

/**
 * Generate JSON test plan for programmatic use
 */
function generateJsonTestPlan(features, version) {
  return JSON.stringify({
    version: version || 'latest',
    generatedAt: new Date().toISOString(),
    totalFeatures: features.length,
    totalTestCases: features.reduce((sum, f) => sum + f.testCases.length, 0),
    features: features.map(feature => ({
      name: feature.name,
      status: feature.status,
      version: feature.version,
      completionDate: feature.completionDate,
      testCases: feature.testCases.map(tc => ({
        title: tc.title,
        content: tc.content,
        result: null,
        notes: '',
        tester: '',
        testDate: null
      }))
    }))
  }, null, 2);
}

/**
 * Main execution function
 */
function main() {
  const { version, includeAll, outputFormat } = parseArgs();

  console.log('🔍 Scanning for feature implementation files...');

  const featureDirectories = getFeatureDirectories();
  console.log(`📁 Found ${featureDirectories.length} features with implementation docs`);

  const features = [];

  for (const featureName of featureDirectories) {
    const implPath = path.join(FEATURES_DIR, featureName, IMPLEMENTATION_FILE);
    console.log(`📖 Parsing ${featureName}...`);

    try {
      const feature = parseImplementationFile(implPath);
      if (feature.testCases.length > 0) {
        features.push(feature);
        console.log(`   ✅ Found ${feature.testCases.length} test cases`);
      } else {
        console.log(`   ⚠️  No test cases found`);
      }
    } catch (error) {
      console.error(`   ❌ Error parsing ${featureName}: ${error.message}`);
    }
  }

  const filteredFeatures = filterFeatures(features, { version, includeAll });
  console.log(`🎯 Filtered to ${filteredFeatures.length} features for test plan`);

  if (filteredFeatures.length === 0) {
    console.log('⚠️  No features match the criteria. Use --all to include all features.');
    return;
  }

  const totalTestCases = filteredFeatures.reduce((sum, f) => sum + f.testCases.length, 0);
  console.log(`📝 Generating test plan with ${totalTestCases} test cases...`);

  let output, filename, outputDir;
  
  if (outputFormat === 'json') {
    output = generateJsonTestPlan(filteredFeatures, version);
    filename = `QA_TEST_PLAN.json`;
  } else {
    output = generateMarkdownTestPlan(filteredFeatures, version);
    filename = `QA_TEST_PLAN.md`;
  }
  
  // Determine output directory
  if (version) {
    outputDir = path.join(RELEASES_DIR, `v${version}`);
  } else {
    // Fallback to general qa directory if no version specified
    outputDir = path.join(__dirname, '../docs/qa');
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, output);

  console.log(`✅ Test plan generated: ${outputPath}`);
  console.log(`📊 Summary: ${filteredFeatures.length} features, ${totalTestCases} test cases`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  parseImplementationFile,
  generateMarkdownTestPlan,
  generateJsonTestPlan,
  filterFeatures
};
