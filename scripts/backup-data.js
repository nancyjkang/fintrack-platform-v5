#!/usr/bin/env node

/**
 * Data Backup Script for FinTrack v5
 * Creates backups of database and important data before deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function createBackup() {
  console.log('💾 Creating data backup...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    // Check if DATABASE_URL is set
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.warn('⚠️  DATABASE_URL not set, skipping database backup');
      return;
    }

    // For PostgreSQL backup
    if (databaseUrl.includes('postgresql://') || databaseUrl.includes('postgres://')) {
      const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

      console.log('📦 Creating PostgreSQL backup...');
      execSync(`pg_dump "${databaseUrl}" > "${backupFile}"`, { stdio: 'inherit' });

      console.log('✅ Database backup created:', backupFile);

      // Keep only last 5 backups
      const backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .sort()
        .reverse();

      if (backupFiles.length > 5) {
        const filesToDelete = backupFiles.slice(5);
        filesToDelete.forEach(file => {
          fs.unlinkSync(path.join(backupDir, file));
          console.log('🗑️  Removed old backup:', file);
        });
      }
    } else {
      console.warn('⚠️  Unsupported database type for backup');
    }

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    console.warn('⚠️  Continuing deployment without backup...');
  }
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };
