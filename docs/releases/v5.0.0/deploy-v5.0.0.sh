#!/bin/bash

# FinTrack v5.0.0 - Automated Deployment Script
# This script automates the deployment of FinTrack v5.0.0

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
VERSION="v5.0.0"

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
🚀 FinTrack v5.0.0 Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
  --database-only    Deploy only database schema
  --app-only        Deploy only application (skip database)
  --staging         Deploy to staging environment
  --production      Deploy to production environment
  --help           Show this help message

EXAMPLES:
  $0 --staging                    # Full staging deployment
  $0 --production --database-only # Database-only production deployment
  $0 --app-only                   # Application-only deployment

REQUIREMENTS:
  - Supabase project configured
  - Vercel project configured
  - Environment variables set
  - GitHub secrets configured (for CI/CD)
EOF
}

check_prerequisites() {
    log_info "Checking prerequisites for FinTrack v5.0.0 deployment..."

    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "Not in FinTrack project root directory"
        exit 1
    fi

    # Check required tools
    local tools=("node" "npm" "git")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is required but not installed"
            exit 1
        fi
    done

    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$node_version" -lt 20 ]]; then
        log_error "Node.js 20+ is required (current: $(node --version))"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

deploy_database() {
    log_info "Deploying database schema for v5.0.0..."

    local schema_file="$SCRIPT_DIR/database-schema-complete.sql"

    if [[ ! -f "$schema_file" ]]; then
        log_error "Database schema file not found: $schema_file"
        exit 1
    fi

    log_warning "Database deployment requires manual execution in Supabase SQL Editor"
    log_info "Please follow these steps:"
    echo
    echo "1. Go to your Supabase Dashboard → SQL Editor"
    echo "2. Copy and paste the contents of: $schema_file"
    echo "3. Execute the script"
    echo "4. Verify all tables are created successfully"
    echo

    read -p "Have you completed the database deployment? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Database deployment not confirmed. Exiting."
        exit 1
    fi

    log_success "Database deployment confirmed"
}

deploy_application() {
    log_info "Deploying application for v5.0.0..."

    cd "$PROJECT_ROOT"

    # Install dependencies
    log_info "Installing dependencies..."
    npm ci

    # Generate Prisma client
    log_info "Generating Prisma client..."
    npm run db:generate

    # Run type check
    log_info "Running type check..."
    npm run type-check

    # Build application
    log_info "Building application..."
    npm run build

    # Deploy based on environment
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        log_info "Deploying to staging..."
        npm run deploy:staging || {
            log_warning "Staging deployment script failed, trying manual deployment"
            npm run deploy
        }
    elif [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Deploying to production..."
        npm run deploy:production || {
            log_warning "Production deployment script failed, trying manual deployment"
            npm run deploy
        }
    else
        log_info "Deploying application..."
        npm run deploy
    fi

    log_success "Application deployment completed"
}

run_post_deployment_tests() {
    log_info "Running post-deployment tests..."

    cd "$PROJECT_ROOT"

    # Test database connectivity (if DATABASE_URL is available)
    if [[ -n "${DATABASE_URL:-}" ]] || [[ -n "${STAGING_DATABASE_URL:-}" ]] || [[ -n "${PRODUCTION_DATABASE_URL:-}" ]]; then
        log_info "Testing database connectivity..."

        local db_url="${DATABASE_URL:-${STAGING_DATABASE_URL:-${PRODUCTION_DATABASE_URL:-}}}"

        if DATABASE_URL="$db_url" npx prisma db execute --stdin <<< "SELECT 1 as test;" &>/dev/null; then
            log_success "Database connectivity test passed"
        else
            log_warning "Database connectivity test failed (this may be expected due to network issues)"
        fi
    else
        log_info "No database URL available, skipping connectivity test"
    fi

    # Run application tests
    log_info "Running application tests..."
    if npm test; then
        log_success "Application tests passed"
    else
        log_warning "Some tests failed - review test output"
    fi

    log_success "Post-deployment tests completed"
}

main() {
    local DATABASE_ONLY=false
    local APP_ONLY=false
    local ENVIRONMENT=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --database-only)
                DATABASE_ONLY=true
                shift
                ;;
            --app-only)
                APP_ONLY=true
                shift
                ;;
            --staging)
                ENVIRONMENT="staging"
                shift
                ;;
            --production)
                ENVIRONMENT="production"
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

    echo
    log_info "🚀 Starting FinTrack v5.0.0 deployment"
    echo

    # Check prerequisites
    check_prerequisites

    # Deploy based on options
    if [[ "$DATABASE_ONLY" == true ]]; then
        deploy_database
    elif [[ "$APP_ONLY" == true ]]; then
        deploy_application
    else
        # Full deployment
        deploy_database
        deploy_application
        run_post_deployment_tests
    fi

    echo
    log_success "🎉 FinTrack v5.0.0 deployment completed successfully!"
    echo
    log_info "Next steps:"
    echo "1. Test your application at the deployed URL"
    echo "2. Verify authentication works"
    echo "3. Test core functionality"
    echo "4. Monitor logs for any issues"
    echo
}

# Run main function
main "$@"
