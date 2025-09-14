#!/bin/bash

# FinTrack v5 Development Database Setup Script

set -e

echo "🚀 Setting up FinTrack v5 Development Database..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo ""
    echo "📥 Please install Docker Desktop:"
    echo "   macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "   Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo "   Linux: https://docs.docker.com/desktop/install/linux-install/"
    echo ""
    echo "After installation, restart this script."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is installed but not running."
    echo "🚀 Please start Docker Desktop and try again."
    exit 1
fi

# Start PostgreSQL and Redis containers
echo "📦 Starting database containers..."
docker compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout 60 bash -c 'until docker compose exec -T postgres pg_isready -U fintrack_dev -d fintrack_v5_dev; do sleep 2; done'

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL is ready!"
else
    echo "❌ PostgreSQL failed to start within 60 seconds"
    exit 1
fi

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from development template..."
    cp .env.development .env
    echo "✅ Created .env file - please review and update as needed"
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
echo "🎉 Development database setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Review your .env file"
echo "   2. Start your development server: npm run dev"
echo "   3. Access pgAdmin at http://localhost:5050 (admin@fintrack.local / admin123)"
echo ""
echo "📊 Database Info:"
echo "   Host: localhost:5432"
echo "   Database: fintrack_v5_dev"
echo "   User: fintrack_dev"
echo "   Password: dev_password_123"
echo ""
