#!/usr/bin/env node

/**
 * Pre-deployment Git Status Checker
 * Ensures repository is in a clean state before deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkGitStatus() {
  console.log('🔍 Checking Git repository status...');

  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not in a Git repository');
    process.exit(1);
  }

  try {
    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });

    if (status.trim()) {
      console.error('❌ Repository has uncommitted changes:');
      console.error(status);
      console.error('\nPlease commit or stash your changes before deploying.');
      process.exit(1);
    }

    // Check if we're ahead of remote
    try {
      const ahead = execSync('git rev-list --count @{u}..HEAD', { encoding: 'utf8', stdio: 'pipe' });
      if (parseInt(ahead.trim()) > 0) {
        console.warn('⚠️  Local branch is ahead of remote by', ahead.trim(), 'commits');
        console.warn('Consider pushing your changes before deploying.');
      }
    } catch (error) {
      console.warn('⚠️  Could not check remote status (no upstream branch?)');
    }

    // Check current branch
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    console.log('✅ Repository is clean');
    console.log('📍 Current branch:', branch);

    // Get latest commit info
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
    console.log('📝 Latest commit:', commitHash, '-', commitMessage);

  } catch (error) {
    console.error('❌ Error checking Git status:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkGitStatus();
}

module.exports = { checkGitStatus };
