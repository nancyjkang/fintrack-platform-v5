#!/bin/bash

# FinTrack v5 - Safe Database Migration Script
# This script provides safe database migration with backup and rollback capabilities

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Default values
ENVIRONMENT=""
DRY_RUN=false
SKIP_BACKUP=false
AUTO_ROLLBACK=false

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_usage() {
    cat << EOF
🗄️ FinTrack v5 Safe Database Migration

Usage: $0 [ENVIRONMENT] [OPTIONS]

ENVIRONMENTS:
  development  Migrate development database
  staging      Migrate staging database
  production   Migrate production database

OPTIONS:
  --dry-run         Show what would be migrated without applying
  --skip-backup     Skip database backup (not recommended)
  --auto-rollback   Automatically rollback on migration failure
  --help           Show this help message

EXAMPLES:
  $0 development                    # Migrate development database
  $0 staging --dry-run             # Preview staging migrations
  $0 production --auto-rollback    # Migrate production with auto-rollback

SAFETY FEATURES:
  ✅ Automatic database backup before migration
  ✅ Migration validation and dry-run capability
  ✅ Rollback capability on failure
  ✅ Schema validation after migration
  ✅ Data integrity checks
EOF
}

get_database_url() {
    case "$ENVIRONMENT" in
        development)
            echo "${DATABASE_URL:-}"
            ;;
        staging)
            echo "${STAGING_DATABASE_URL:-}"
            ;;
        production)
            echo "${PRODUCTION_DATABASE_URL:-}"
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "Not in FinTrack project root directory"
        exit 1
    fi

    # Check required tools
    local tools=("node" "npm" "npx")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is required but not installed"
            exit 1
        fi
    done

    # Check database URL
    local db_url=$(get_database_url)
    if [[ -z "$db_url" ]]; then
        log_error "Database URL not set for environment: $ENVIRONMENT"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

create_backup() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        log_warning "Skipping database backup (--skip-backup flag used)"
        return
    fi

    log_info "Creating database backup for $ENVIRONMENT..."

    local db_url=$(get_database_url)
    local backup_file="backup-$ENVIRONMENT-$TIMESTAMP.sql"

    # Create backup directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/backups"

    # Create database backup
    if command -v pg_dump &> /dev/null; then
        log_info "Creating backup: backups/$backup_file"
        pg_dump "$db_url" > "$PROJECT_ROOT/backups/$backup_file"

        # Compress backup
        gzip "$PROJECT_ROOT/backups/$backup_file"
        log_success "Database backup created: backups/$backup_file.gz"

        # Store backup path for potential rollback
        echo "$PROJECT_ROOT/backups/$backup_file.gz" > "$PROJECT_ROOT/.last-backup"
    else
        log_warning "pg_dump not available, skipping database backup"
    fi
}

validate_migrations() {
    log_info "Validating pending migrations..."

    cd "$PROJECT_ROOT"

    # Set database URL
    export DATABASE_URL=$(get_database_url)

    # Generate Prisma client
    npm run db:generate

    # Check migration status
    local migration_status
    migration_status=$(npx prisma migrate status 2>&1 || true)

    if echo "$migration_status" | grep -q "Database is up to date"; then
        log_info "No pending migrations found"
        return 0
    elif echo "$migration_status" | grep -q "pending migration"; then
        log_info "Pending migrations found:"
        echo "$migration_status"
        return 0
    else
        log_error "Unable to determine migration status"
        echo "$migration_status"
        return 1
    fi
}

run_dry_run() {
    log_info "Running migration dry-run..."

    cd "$PROJECT_ROOT"

    # Set database URL
    export DATABASE_URL=$(get_database_url)

    # Show what would be migrated
    log_info "Migrations that would be applied:"
    npx prisma migrate status

    log_success "Dry-run completed - no changes were made"
}

apply_migrations() {
    log_info "Applying database migrations to $ENVIRONMENT..."

    cd "$PROJECT_ROOT"

    # Set database URL
    export DATABASE_URL=$(get_database_url)

    # Apply migrations
    if npx prisma migrate deploy; then
        log_success "Database migrations applied successfully"
        return 0
    else
        log_error "Database migration failed"
        return 1
    fi
}

validate_schema() {
    log_info "Validating database schema..."

    cd "$PROJECT_ROOT"

    # Set database URL
    export DATABASE_URL=$(get_database_url)

    # Validate schema
    if npx prisma db pull --print > /dev/null 2>&1; then
        log_success "Database schema validation passed"
        return 0
    else
        log_error "Database schema validation failed"
        return 1
    fi
}

run_integrity_checks() {
    log_info "Running data integrity checks..."

    cd "$PROJECT_ROOT"

    # Set database URL
    export DATABASE_URL=$(get_database_url)

    # Run custom integrity checks if available
    if [[ -f "$PROJECT_ROOT/scripts/validate-data-integrity.js" ]]; then
        if node "$PROJECT_ROOT/scripts/validate-data-integrity.js"; then
            log_success "Data integrity checks passed"
            return 0
        else
            log_error "Data integrity checks failed"
            return 1
        fi
    else
        log_info "No custom integrity checks found, skipping"
        return 0
    fi
}

rollback_migration() {
    log_warning "Initiating migration rollback..."

    if [[ ! -f "$PROJECT_ROOT/.last-backup" ]]; then
        log_error "No backup found for rollback"
        return 1
    fi

    local backup_file=$(cat "$PROJECT_ROOT/.last-backup")

    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    log_info "Restoring database from backup: $backup_file"

    local db_url=$(get_database_url)

    # Extract backup if compressed
    if [[ "$backup_file" == *.gz ]]; then
        local uncompressed_file="${backup_file%.gz}"
        gunzip -c "$backup_file" > "$uncompressed_file"
        backup_file="$uncompressed_file"
    fi

    # Restore database
    if command -v psql &> /dev/null; then
        # Drop and recreate database (be very careful!)
        local db_name=$(echo "$db_url" | sed 's/.*\///')

        log_warning "This will completely replace the database. Are you sure?"
        read -p "Type 'ROLLBACK' to confirm: " -r

        if [[ "$REPLY" == "ROLLBACK" ]]; then
            psql "$db_url" < "$backup_file"
            log_success "Database rollback completed"

            # Clean up temporary file
            if [[ "$backup_file" != *.gz ]]; then
                rm -f "$backup_file"
            fi

            return 0
        else
            log_info "Rollback cancelled"
            return 1
        fi
    else
        log_error "psql not available for rollback"
        return 1
    fi
}

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f "$PROJECT_ROOT/.last-backup"
}

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            development|staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --auto-rollback)
                AUTO_ROLLBACK=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Validate environment
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment is required"
        show_usage
        exit 1
    fi

    # Set up error handling
    trap cleanup EXIT

    echo
    log_info "🗄️ Starting safe database migration for $ENVIRONMENT"
    echo

    # Run migration steps
    check_prerequisites
    validate_migrations

    if [[ "$DRY_RUN" == true ]]; then
        run_dry_run
        exit 0
    fi

    # Confirm for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo
        log_warning "⚠️  PRODUCTION DATABASE MIGRATION ⚠️"
        echo
        read -p "Are you sure you want to migrate the production database? (y/N): " -n 1 -r
        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Migration cancelled by user"
            exit 0
        fi
    fi

    # Create backup
    create_backup

    # Apply migrations with error handling
    if apply_migrations; then
        # Validate results
        if validate_schema && run_integrity_checks; then
            echo
            log_success "🎉 Database migration completed successfully!"
            echo
        else
            log_error "Post-migration validation failed"

            if [[ "$AUTO_ROLLBACK" == true ]]; then
                rollback_migration
            else
                log_warning "Consider running rollback manually if needed"
            fi

            exit 1
        fi
    else
        log_error "Migration failed"

        if [[ "$AUTO_ROLLBACK" == true ]]; then
            rollback_migration
        else
            log_warning "Consider running rollback manually if needed"
        fi

        exit 1
    fi
}

# Run main function
main "$@"
