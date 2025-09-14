-- FinTrack v5 Database Initialization Script
-- This script sets up the initial database configuration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application user (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fintrack_app') THEN
        CREATE ROLE fintrack_app WITH LOGIN PASSWORD 'app_password_secure_123';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE fintrack_v5_dev TO fintrack_app;
GRANT USAGE ON SCHEMA public TO fintrack_app;
GRANT CREATE ON SCHEMA public TO fintrack_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO fintrack_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO fintrack_app;

-- Performance settings for development
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second

-- Reload configuration
SELECT pg_reload_conf();
