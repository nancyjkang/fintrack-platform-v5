#!/bin/bash
# Backup local database before any schema changes

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/fintrack_dev_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "🔄 Creating backup of local database..."
pg_dump fintrack_dev > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
    echo "📁 To restore: psql -d fintrack_dev < $BACKUP_FILE"
else
    echo "❌ Backup failed!"
    exit 1
fi
