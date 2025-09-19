#!/usr/bin/env node

/**
 * Create Feature Documentation Template
 * 
 * Usage: node scripts/create-feature-docs.js --name="my-feature-name"
 * Creates properly formatted implementation.md with QA test cases
 */

const fs = require('fs');
const path = require('path');

function main() {
  const args = process.argv.slice(2);
  const nameArg = args.find(arg => arg.startsWith('--name='));
  
  if (!nameArg) {
    console.log('❌ Error: Feature name is required');
    console.log('Usage: node scripts/create-feature-docs.js --name="my-feature-name"');
    process.exit(1);
  }

  const featureName = nameArg.split('=')[1].replace(/['"]/g, '');
  const featureDir = featureName.toLowerCase().replace(/\s+/g, '-');
  
  // Create feature directory
  const featuresDir = path.join(__dirname, '..', 'docs', 'features', featureDir);
  if (!fs.existsSync(featuresDir)) {
    fs.mkdirSync(featuresDir, { recursive: true });
  }

  // Read template
  const templatePath = path.join(__dirname, '..', 'docs', 'templates', 'implementation-template.md');
  if (!fs.existsSync(templatePath)) {
    console.log('❌ Error: Template file not found');
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders
  template = template.replace(/\[Feature Name\]/g, featureName);
  template = template.replace(/\[Test Name\]/g, 'Test Name');
  
  // Write implementation.md
  const implPath = path.join(featuresDir, 'implementation.md');
  fs.writeFileSync(implPath, template);

  console.log('✅ Feature documentation created successfully!');
  console.log(`📁 Directory: docs/features/${featureDir}/`);
  console.log(`📄 File: docs/features/${featureDir}/implementation.md`);
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Fill in the feature details');
  console.log('2. Add at least 3 comprehensive test cases');
  console.log('3. Update status and completion date when done');
  console.log('');
  console.log('💡 The format is pre-configured for the validation script!');
}

if (require.main === module) {
  main();
}

module.exports = { main };



