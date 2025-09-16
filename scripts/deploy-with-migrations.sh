#!/bin/bash

# FinTrack v5 - Enhanced Deployment Script with Database Migrations
# Usage: ./scripts/deploy-with-migrations.sh [staging|production] [--force]

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
FORCE_DEPLOY=false
SKIP_BACKUP=false
SKIP_TESTS=false

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
🚀 FinTrack v5 Deployment Script

Usage: $0 [ENVIRONMENT] [OPTIONS]

ENVIRONMENTS:
  staging     Deploy to staging environment
  production  Deploy to production environment

OPTIONS:
  --force           Force deployment (skip confirmations)
  --skip-backup     Skip database backup (not recommended for production)
  --skip-tests      Skip pre-deployment tests (not recommended)
  --help           Show this help message

EXAMPLES:
  $0 staging                    # Deploy to staging
  $0 production                 # Deploy to production (with confirmations)
  $0 production --force         # Deploy to production (skip confirmations)
  $0 staging --skip-tests       # Deploy to staging without running tests

ENVIRONMENT VARIABLES REQUIRED:
  For staging:
    - STAGING_DATABASE_URL
    - VERCEL_TOKEN
    - VERCEL_ORG_ID
    - VERCEL_PROJECT_ID

  For production:
    - PRODUCTION_DATABASE_URL
    - VERCEL_TOKEN
    - VERCEL_ORG_ID
    - VERCEL_PROJECT_ID
EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "Not in FinTrack project root directory"
        exit 1
    fi

    # Check required tools
    local tools=("node" "npm" "npx" "git" "curl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is required but not installed"
            exit 1
        fi
    done

    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    local required_version="20.0.0"
    if ! npx semver -r ">=$required_version" "$node_version" &> /dev/null; then
        log_error "Node.js version $required_version or higher is required (found: $node_version)"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

check_environment_variables() {
    log_info "Checking environment variables for $ENVIRONMENT..."

    local required_vars=("VERCEL_TOKEN" "VERCEL_ORG_ID" "VERCEL_PROJECT_ID")

    if [[ "$ENVIRONMENT" == "staging" ]]; then
        required_vars+=("STAGING_DATABASE_URL")
    elif [[ "$ENVIRONMENT" == "production" ]]; then
        required_vars+=("PRODUCTION_DATABASE_URL")
    fi

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Environment variable $var is required but not set"
            exit 1
        fi
    done

    log_success "Environment variables check passed"
}

run_pre_deployment_checks() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log_warning "Skipping pre-deployment tests (--skip-tests flag used)"
        return
    fi

    log_info "Running pre-deployment checks..."

    cd "$PROJECT_ROOT"

    # Check git status
    if [[ -n $(git status --porcelain) ]]; then
        log_error "Working directory is not clean. Commit or stash changes first."
        exit 1
    fi

    # Install dependencies
    log_info "Installing dependencies..."
    npm ci

    # Run linting
    log_info "Running linter..."
    npm run lint

    # Run type checking
    log_info "Running type check..."
    npm run type-check

    # Run tests
    log_info "Running tests..."
    npm run test

    # Build application
    log_info "Building application..."
    npm run build

    log_success "Pre-deployment checks passed"
}

backup_database() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        log_warning "Skipping database backup (--skip-backup flag used)"
        return
    fi

    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Creating production database backup..."

        local backup_file="backup-production-$TIMESTAMP.sql"
        local database_url="${PRODUCTION_DATABASE_URL}"

        # Create backup directory if it doesn't exist
        mkdir -p "$PROJECT_ROOT/backups"

        # Create database backup
        if command -v pg_dump &> /dev/null; then
            pg_dump "$database_url" > "$PROJECT_ROOT/backups/$backup_file"
            log_success "Database backup created: backups/$backup_file"
        else
            log_warning "pg_dump not available, skipping database backup"
        fi
    else
        log_info "Skipping database backup for staging environment"
    fi
}

run_database_migrations() {
    log_info "Running database migrations for $ENVIRONMENT..."

    cd "$PROJECT_ROOT"

    local database_url
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        database_url="${STAGING_DATABASE_URL}"
    else
        database_url="${PRODUCTION_DATABASE_URL}"
    fi

    # Set the database URL for this migration
    export DATABASE_URL="$database_url"

    # Generate Prisma client
    log_info "Generating Prisma client..."
    npm run db:generate

    # Run migrations
    log_info "Applying database migrations..."
    npm run db:migrate:prod

    log_success "Database migrations completed"
}

deploy_to_vercel() {
    log_info "Deploying to Vercel ($ENVIRONMENT)..."

    cd "$PROJECT_ROOT"

    local vercel_args=""
    if [[ "$ENVIRONMENT" == "production" ]]; then
        vercel_args="--prod"
    fi

    # Deploy using Vercel CLI
    local deployment_url
    if command -v vercel &> /dev/null; then
        deployment_url=$(vercel deploy $vercel_args --token="$VERCEL_TOKEN" --yes)
        log_success "Deployment completed: $deployment_url"
    else
        log_error "Vercel CLI not installed. Install with: npm i -g vercel"
        exit 1
    fi

    echo "$deployment_url" > "$PROJECT_ROOT/.last-deployment-url"
}

run_health_check() {
    log_info "Running health check..."

    local deployment_url
    if [[ -f "$PROJECT_ROOT/.last-deployment-url" ]]; then
        deployment_url=$(cat "$PROJECT_ROOT/.last-deployment-url")
    else
        log_error "Deployment URL not found"
        exit 1
    fi

    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    sleep 30

    # Check health endpoint
    local health_url="$deployment_url/api/health"
    local max_attempts=5
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts..."

        if curl -f -s "$health_url" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi

        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Health check failed after $max_attempts attempts"
            return 1
        fi

        sleep 10
        ((attempt++))
    done
}

confirm_deployment() {
    if [[ "$FORCE_DEPLOY" == true ]]; then
        return 0
    fi

    echo
    log_warning "⚠️  DEPLOYMENT CONFIRMATION ⚠️"
    echo
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $TIMESTAMP"
    echo "Git commit: $(git rev-parse --short HEAD)"
    echo "Git branch: $(git branch --show-current)"
    echo

    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo -e "${RED}🚨 THIS IS A PRODUCTION DEPLOYMENT 🚨${NC}"
        echo
    fi

    read -p "Do you want to proceed? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
}

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f "$PROJECT_ROOT/.last-deployment-url"
}

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            --force)
                FORCE_DEPLOY=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
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
    log_info "🚀 Starting FinTrack v5 deployment to $ENVIRONMENT"
    echo

    # Run deployment steps
    check_prerequisites
    check_environment_variables
    confirm_deployment
    run_pre_deployment_checks
    backup_database
    run_database_migrations
    deploy_to_vercel
    run_health_check

    echo
    log_success "🎉 Deployment to $ENVIRONMENT completed successfully!"

    if [[ -f "$PROJECT_ROOT/.last-deployment-url" ]]; then
        local deployment_url=$(cat "$PROJECT_ROOT/.last-deployment-url")
        echo
        log_info "🌐 Deployment URL: $deployment_url"
    fi

    echo
}

# Run main function
main "$@"
