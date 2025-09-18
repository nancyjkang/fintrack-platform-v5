#!/usr/bin/env node

/**
 * Test Case Documentation Validator
 *
 * This script validates that all completed features have proper test case documentation.
 * It's designed to run as part of the pre-push hook to ensure quality standards.
 *
 * Validation Rules:
 * 1. All completed features must have implementation.md files
 * 2. All implementation.md files must have a test cases section
 * 3. All test cases sections must have at least 3 test cases
 * 4. Test cases must have proper structure (title and content)
 *
 * Usage:
 *   node scripts/validate-test-cases.js                    # Validate current version
 *   node scripts/validate-test-cases.js --version=5.0.1    # Validate specific version
 *   npm run validate-test-cases                            # Validate current version
 *   npm run validate-test-cases -- --version=5.0.1         # Validate specific version
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    version: null
  };

  for (const arg of args) {
    if (arg.startsWith('--version=')) {
      options.version = arg.split('=')[1];
    }
  }

  return options;
}

// Configuration
const FEATURES_DIR = path.join(__dirname, '../docs/features');
const FEATURE_BACKLOG = path.join(__dirname, '../docs/FEATURE_BACKLOG.md');
const PACKAGE_JSON = path.join(__dirname, '../package.json');
const IMPLEMENTATION_FILE = 'implementation.md';
const MIN_TEST_CASES = 3;

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Log with colors
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Get current version from package.json
 */
function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    return packageJson.version;
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Parse feature backlog to get completed features for current version
 */
function getCompletedFeaturesFromBacklog(targetVersion) {
  if (!fs.existsSync(FEATURE_BACKLOG)) {
    log('❌ Feature backlog not found!', 'red');
    return [];
  }

  const content = fs.readFileSync(FEATURE_BACKLOG, 'utf8');
  const lines = content.split('\n');
  const completedFeatures = [];

  let currentFeature = null;
  let inFeatureSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect feature entries (lines starting with "- **" and containing "✅ Complete")
    if (line.match(/^-\s+\*\*.*\*\*\s+-\s+✅\s+(Complete|Completed)/)) {
      // Save previous feature if we have one
      if (currentFeature && currentFeature.version === targetVersion) {
        currentFeature.directoryName = featureNameToDirectory(currentFeature.name);
        completedFeatures.push(currentFeature);
      }

      // Extract feature name
      const nameMatch = line.match(/^-\s+\*\*(.*?)\*\*/);
      if (nameMatch) {
        currentFeature = {
          name: nameMatch[1].trim(),
          version: null,
          completed: null,
          directoryName: null
        };
        inFeatureSection = true;
      }
      continue;
    }

    // If we're in a feature section, look for version and completion info
    if (inFeatureSection && currentFeature) {
      // Look for version info (bullet point format with flexible spacing)
      const versionMatch = line.match(/\*\*Version\*\*:\s*v?([0-9.]+)/);
      if (versionMatch) {
        currentFeature.version = versionMatch[1];
      }

      // Look for completion date (bullet point format with flexible spacing)
      const completedMatch = line.match(/\*\*Completed\*\*:\s*([0-9-]+)/);
      if (completedMatch) {
        currentFeature.completed = completedMatch[1];
      }

      // End of feature section (major section headers only)
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentFeature && currentFeature.version === targetVersion) {
          currentFeature.directoryName = featureNameToDirectory(currentFeature.name);
          completedFeatures.push(currentFeature);
        }
        currentFeature = null;
        inFeatureSection = false;
      }
    }
  }

  // Handle last feature if file ends
  if (currentFeature && currentFeature.version === targetVersion) {
    currentFeature.directoryName = featureNameToDirectory(currentFeature.name);
    completedFeatures.push(currentFeature);
  }

  return completedFeatures;
}

/**
 * Map feature name to directory name (best effort)
 */
function featureNameToDirectory(featureName) {
  // Convert feature name to likely directory name
  return featureName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .trim();
}

/**
 * Get all feature directories with implementation.md files
 */
function getFeatureDirectories() {
  if (!fs.existsSync(FEATURES_DIR)) {
    log('❌ Features directory not found!', 'red');
    return [];
  }

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
 * (Reusing logic from generate-qa-plan.js)
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
        title: line.replace(/^###\s+/, '').replace(/^####\s+/, '').trim(),
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
 * Check if a feature is completed
 */
function isFeatureCompleted(feature) {
  // Check status field
  if (feature.status && (feature.status.includes('COMPLETED') || feature.status.includes('COMPLETE'))) {
    return true;
  }

  // Check if has completion date (alternative indicator)
  if (!feature.status && feature.completionDate) {
    return true;
  }

  return false;
}

/**
 * Validate a single feature's test cases
 */
function validateFeatureTestCases(featureName, feature) {
  const issues = [];

  // Only validate completed features
  if (!isFeatureCompleted(feature)) {
    return { valid: true, issues: [], skipped: true };
  }

  // Check if feature has test cases section
  if (feature.testCases.length === 0) {
    issues.push(`❌ No test cases found. Completed features must have a "## Test Cases" or "### QA Test Cases" section.`);
  } else {
    // Check minimum number of test cases
    if (feature.testCases.length < MIN_TEST_CASES) {
      issues.push(`⚠️  Only ${feature.testCases.length} test cases found. Minimum ${MIN_TEST_CASES} required for completed features.`);
    }

    // Check test case quality
    feature.testCases.forEach((testCase, index) => {
      if (!testCase.title || testCase.title.trim().length < 10) {
        issues.push(`❌ Test case ${index + 1}: Title too short or missing`);
      }

      if (!testCase.content || testCase.content.trim().length < 50) {
        issues.push(`❌ Test case ${index + 1}: Content too short or missing (minimum 50 characters)`);
      }
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    skipped: false
  };
}

/**
 * Main validation function
 */
function validateAllFeatures(targetVersion = null) {
  log('🔍 Validating test case documentation for completed features...', 'blue');

  // Use provided version or get current version from package.json
  const version = targetVersion || getCurrentVersion();
  if (!version) {
    log('❌ Could not determine target version', 'red');
    return false;
  }

  log(`📦 Target version: v${version}`, 'blue');

  // Get completed features from backlog for target version
  const completedFeatures = getCompletedFeaturesFromBacklog(version);

  if (completedFeatures.length === 0) {
    log(`⚠️  No completed features found for version v${version} in feature backlog`, 'yellow');
    log('This might be normal for new versions. Validation passes.', 'yellow');
    return true;
  }

  log(`📋 Found ${completedFeatures.length} completed features for v${version} in backlog:`, 'blue');
  completedFeatures.forEach(feature => {
    log(`   - ${feature.name} (${feature.directoryName})`, 'blue');
  });

  let validFeatures = 0;
  let missingFeatures = 0;
  let hasErrors = false;

  for (const backlogFeature of completedFeatures) {
    const featureName = backlogFeature.directoryName;
    const implPath = path.join(FEATURES_DIR, featureName, IMPLEMENTATION_FILE);

    log(`\n📖 Validating ${backlogFeature.name} (${featureName})...`, 'blue');

    // Check if implementation file exists
    if (!fs.existsSync(implPath)) {
      log(`   ❌ Implementation file not found: ${implPath}`, 'red');
      log(`   💡 Feature is marked complete in backlog but missing implementation docs`, 'red');
      hasErrors = true;
      missingFeatures++;
      continue;
    }

    try {
      const feature = parseImplementationFile(implPath);
      const validation = validateFeatureTestCases(featureName, feature);

      if (validation.valid) {
        log(`   ✅ Valid (${feature.testCases.length} test cases)`, 'green');
        validFeatures++;
      } else {
        log(`   ❌ Invalid test case documentation`, 'red');
        validation.issues.forEach(issue => {
          log(`      ${issue}`, 'red');
        });
        hasErrors = true;
      }

    } catch (error) {
      log(`   ❌ Error parsing ${featureName}: ${error.message}`, 'red');
      hasErrors = true;
    }
  }

  // Summary
  log('\n' + '='.repeat(70), 'blue');
  log('📊 TEST CASE VALIDATION SUMMARY', 'bold');
  log('='.repeat(70), 'blue');
  log(`Version: v${version}`);
  log(`Completed Features (from backlog): ${completedFeatures.length}`);
  log(`Valid Features: ${validFeatures}`, validFeatures === completedFeatures.length ? 'green' : 'yellow');
  log(`Missing Implementation: ${missingFeatures}`, missingFeatures > 0 ? 'red' : 'green');
  log(`Invalid Test Cases: ${completedFeatures.length - validFeatures - missingFeatures}`, 'red');

  if (hasErrors) {
    log('\n❌ VALIDATION FAILED', 'red');
    log(`Features marked as completed in v${version} must have proper test case documentation.`, 'red');
    log('\nRequired for each completed feature:', 'yellow');
    log('1. Implementation file: docs/features/[feature-name]/implementation.md', 'yellow');
    log('2. Test cases section: ## Test Cases or ### QA Test Cases', 'yellow');
    log('3. Individual test cases: ### Test Case N: [Title]', 'yellow');
    log(`4. Minimum ${MIN_TEST_CASES} test cases with detailed descriptions`, 'yellow');
    log('\n💡 This ensures QA teams have comprehensive test plans for each release.', 'yellow');
    return false;
  } else {
    log('\n✅ ALL VALIDATIONS PASSED', 'green');
    log(`All ${completedFeatures.length} completed features for v${version} have proper test case documentation.`, 'green');
    log('🎯 QA test plans can be generated successfully for this release.', 'green');
    return true;
  }
}

/**
 * CLI execution
 */
function main() {
  const options = parseArguments();
  const success = validateAllFeatures(options.version);
  process.exit(success ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  validateAllFeatures,
  parseImplementationFile,
  validateFeatureTestCases,
  isFeatureCompleted
};
