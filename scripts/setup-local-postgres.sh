#!/bin/bash

# FinTrack v5 Local PostgreSQL Setup (Alternative to Docker)
# For users who prefer native PostgreSQL installation

set -e

echo "🚀 Setting up FinTrack v5 with Local PostgreSQL..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo ""
    echo "📥 Please install PostgreSQL:"
    echo "   macOS: brew install postgresql@15"
    echo "   Ubuntu: sudo apt-get install postgresql-15"
    echo "   Windows: Download from https://www.postgresql.org/download/"
    echo ""
    echo "After installation, restart this script."
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "❌ PostgreSQL is installed but not running."
    echo "🚀 Starting PostgreSQL..."

    # Try to start PostgreSQL (macOS with Homebrew)
    if command -v brew &> /dev/null; then
        # Try different PostgreSQL versions
        if brew services list | grep -q "postgresql@15"; then
            brew services start postgresql@15
        elif brew services list | grep -q "postgresql@14"; then
            brew services start postgresql@14
        elif brew services list | grep -q "postgresql"; then
            brew services start postgresql
        else
            echo "Please start PostgreSQL manually and run this script again."
            exit 1
        fi
    else
        echo "Please start PostgreSQL manually and run this script again."
        exit 1
    fi

    # Wait a moment for startup
    sleep 3
fi

# Create database and user
echo "📊 Creating database and user..."

# Create user with CREATEDB permission (if not exists)
psql postgres -c "CREATE USER fintrack_dev WITH PASSWORD 'dev_password_123' CREATEDB;" 2>/dev/null || echo "User already exists"

# Grant CREATEDB permission to existing user (in case user already existed)
psql postgres -c "ALTER USER fintrack_dev CREATEDB;" 2>/dev/null || true

# Create database (if not exists)
psql postgres -c "CREATE DATABASE fintrack_v5_dev OWNER fintrack_dev;" 2>/dev/null || echo "Database already exists"

# Grant privileges
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE fintrack_v5_dev TO fintrack_dev;"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# FinTrack v5 Development Environment (Local PostgreSQL)

# Database - Local PostgreSQL
DATABASE_URL="postgresql://fintrack_dev:dev_password_123@localhost:5432/fintrack_v5_dev?schema=public"

# Redis - Optional (comment out if not using)
# REDIS_URL="redis://localhost:6379"

# JWT Secrets (development only)
JWT_ACCESS_SECRET="dev-jwt-access-secret-change-in-production"
JWT_REFRESH_SECRET="dev-jwt-refresh-secret-change-in-production"

# Encryption Keys (development only)
ENCRYPTION_KEY="dev-encryption-key-change-in-production-32-chars"

# Application
NODE_ENV="development"
PORT="3000"
APP_URL="http://localhost:3000"

# Development Settings
ENABLE_PLAYGROUND="true"
LOG_LEVEL="debug"
EOF
    echo "✅ Created .env file"
fi

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed the database
echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo ""
echo "🎉 Local PostgreSQL setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start your development server: npm run dev"
echo "   2. Open Prisma Studio: npm run db:studio"
echo ""
echo "📊 Database Info:"
echo "   Host: localhost:5432"
echo "   Database: fintrack_v5_dev"
echo "   User: fintrack_dev"
echo "   Password: dev_password_123"
echo ""
echo "💡 To use pgAdmin or another GUI:"
echo "   Connection: localhost:5432"
echo "   Database: fintrack_v5_dev"
echo "   Username: fintrack_dev"
echo "   Password: dev_password_123"
echo ""
