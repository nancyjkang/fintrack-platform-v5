#!/usr/bin/env node

/**
 * Release Documentation Generator for FinTrack v5
 * Generates release notes and deployment documentation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function generateReleaseDocs(version) {
  console.log(`📝 Generating release documentation for v${version}...`);

  const releaseDir = path.join(process.cwd(), 'docs', 'releases');
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }

  try {
    // Get git information
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const timestamp = new Date().toISOString();

    // Get recent commits since last tag
    let commits = [];
    try {
      const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      const commitLog = execSync(`git log ${lastTag}..HEAD --oneline`, { encoding: 'utf8' });
      commits = commitLog.trim().split('\n').filter(line => line.trim());
    } catch (error) {
      // No previous tags, get last 10 commits
      const commitLog = execSync('git log --oneline -10', { encoding: 'utf8' });
      commits = commitLog.trim().split('\n').filter(line => line.trim());
    }

    // Generate release notes
    const releaseNotes = `# FinTrack v5 Release ${version}

## Release Information
- **Version**: ${version}
- **Release Date**: ${new Date().toLocaleDateString()}
- **Commit**: ${shortHash} (${commitHash})
- **Branch**: ${branch}
- **Build Time**: ${timestamp}

## Recent Changes
${commits.map(commit => `- ${commit}`).join('\n')}

## Deployment Checklist
- [ ] Database migrations applied
- [ ] Environment variables updated
- [ ] SSL certificates valid
- [ ] Backup created
- [ ] Health checks passing
- [ ] Performance monitoring active

## Rollback Information
- **Previous Version**: Check git tags for rollback target
- **Rollback Command**: \`npm run rollback\`
- **Database Rollback**: Manual intervention may be required

## Post-Deployment Verification
1. Login functionality works
2. Dashboard loads correctly
3. API endpoints responding
4. Database connections stable
5. Authentication flow complete

---
Generated on ${timestamp}
`;

    // Write release notes
    const releaseFile = path.join(releaseDir, `release-${version}.md`);
    fs.writeFileSync(releaseFile, releaseNotes);

    // Create latest release pointer
    const latestContent = `# FinTrack v5 - Latest Release

## Current Release: v${version}

**📄 [View Full Release Notes](./release-${version}.md)**

## Quick Info
- **Version**: ${version}
- **Release Date**: ${new Date().toLocaleDateString()}
- **Commit**: ${shortHash}
- **Build Time**: ${timestamp}

## Recent Changes (${commits.length} commits)
${commits.slice(0, 5).map(commit => `- ${commit}`).join('\n')}
${commits.length > 5 ? `\n... and ${commits.length - 5} more commits` : ''}

---
*This file always points to the latest release. For full details, see [release-${version}.md](./release-${version}.md)*

Generated on ${timestamp}
`;

    const latestFile = path.join(releaseDir, 'latest.md');
    if (fs.existsSync(latestFile)) {
      fs.unlinkSync(latestFile);
    }
    fs.writeFileSync(latestFile, latestContent);

    console.log('✅ Release documentation generated:');
    console.log(`   📄 ${releaseFile}`);
    console.log(`   🔗 ${latestFile}`);

    // Generate deployment summary
    const deploymentSummary = {
      version,
      timestamp,
      commit: commitHash,
      branch,
      changes: commits.length,
      files_changed: getChangedFiles()
    };

    const summaryFile = path.join(releaseDir, `deployment-${version}.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(deploymentSummary, null, 2));
    console.log(`   📊 ${summaryFile}`);

  } catch (error) {
    console.error('❌ Failed to generate release documentation:', error.message);
    process.exit(1);
  }
}

function getChangedFiles() {
  try {
    const changedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' });
    return changedFiles.trim().split('\n').filter(line => line.trim()).length;
  } catch (error) {
    return 0;
  }
}

// Get version from command line argument
const version = process.argv[2];
if (!version) {
  console.error('❌ Please provide a version number');
  console.error('Usage: node generate-release-docs.js <version>');
  process.exit(1);
}

if (require.main === module) {
  generateReleaseDocs(version);
}

module.exports = { generateReleaseDocs };
