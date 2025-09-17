# FinTrack Platform v5 - Technical Specification

## Table of Contents

- [Executive Summary](#executive-summary)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [Core Systems](#core-systems)
- [API Specification](#api-specification)
- [User Interface Requirements](#user-interface-requirements)
- [Advanced Features](#advanced-features)
- [Security & Compliance](#security--compliance)
- [Performance Requirements](#performance-requirements)
- [Deployment Architecture](#deployment-architecture)

---

## Executive Summary

### **Project Vision**
FinTrack v5 is a **scalable, multi-tenant, enterprise-ready personal finance platform** designed for secure financial data management. Built with modern cloud-native architecture supporting multiple users and organizations with complete data isolation.

### **Core Principles**
- **Multi-Tenant Architecture**: Complete data isolation between tenants
- **API-First Design**: All functionality exposed via RESTful APIs
- **Security-First**: JWT authentication, audit logging, data encryption
- **Performance Optimized**: Sub-200ms response times, efficient queries
- **Scalable**: Designed to handle thousands of concurrent users

### **Key Features**
- **Multi-Tenant Authentication**: Secure user management with tenant isolation
- **Financial Account Management**: Multiple account types with balance tracking
- **Transaction Engine**: Comprehensive transaction recording and categorization
- **Spending Goals**: Goal-based budgeting and progress tracking
- **Audit & Compliance**: Complete audit trails for all operations
- **CSV Import/Export**: Bulk data import and export capabilities
- **Real-time Analytics**: Financial insights and reporting dashboard

---

## Architecture Overview

### **Technology Stack**
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: Next.js API Routes with comprehensive middleware
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for sessions and performance optimization
- **Authentication**: JWT with refresh tokens, secure session management
- **Styling**: CSS Modules (no Tailwind for maintainability)
- **Deployment**: Vercel with automated CI/CD pipeline
- **Monitoring**: Built-in audit logging and error tracking

### **Core Architecture Principles**
- **Multi-Tenant Security**: Complete data isolation between users
- **API-First Design**: All functionality exposed via RESTful APIs
- **Performance Optimization**: Efficient queries, caching, pagination
- **Data Integrity**: Comprehensive validation and consistency checks
- **Audit Compliance**: Complete audit trails for all financial operations
- **Scalability**: Designed to handle thousands of concurrent users

### **Data Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI   │────│  API Routes     │────│   PostgreSQL    │
│   Components    │    │  + Middleware   │    │   + Prisma      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │  Audit Logging  │
                       │   + Sessions    │    │  + Compliance   │
                       └─────────────────┘    └─────────────────┘
```

### **Security Architecture**
- **Authentication**: JWT access tokens (15min) + refresh tokens (7 days)
- **Authorization**: Role-based access control with user/admin roles
- **Data Encryption**: Sensitive data encrypted at rest and in transit
- **Audit Logging**: Complete audit trails for compliance and debugging
- **Rate Limiting**: API rate limiting to prevent abuse
- **CSRF Protection**: Cross-site request forgery protection

---

## Technology Stack

### **Frontend Technologies**
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: CSS Modules for component-scoped styles
- **Icons**: Lucide React for consistent iconography
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context + useState/useReducer
- **HTTP Client**: Native fetch with custom API wrapper

### **Backend Technologies**
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Caching**: Redis for session storage and performance
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod for runtime type validation
- **File Upload**: Native Next.js file handling
- **Email**: Nodemailer for transactional emails

### **Development & Deployment**
- **Language**: TypeScript for type safety
- **Testing**: Jest for unit tests, Playwright for E2E
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for code consistency
- **Git Hooks**: Husky for pre-commit validation
- **CI/CD**: Vercel deployment with automated testing
- **Monitoring**: Built-in error tracking and audit logs

---

## Database Schema

### **Core Tables**

#### **Users & Authentication**
```sql
-- Users table (minimal user data for authentication)
CREATE TABLE users (
  id VARCHAR(30) PRIMARY KEY, -- CUID format
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Multi-tenant architecture
CREATE TABLE tenants (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type tenant_type DEFAULT 'PERSONAL',
  timezone VARCHAR(50) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en-US',
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User-tenant relationships
CREATE TABLE memberships (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) REFERENCES users(id) ON DELETE CASCADE,
  tenant_id VARCHAR(30) REFERENCES tenants(id) ON DELETE CASCADE,
  role membership_role DEFAULT 'ADMIN',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Enhanced session management
CREATE TABLE user_sessions (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  current_tenant_id VARCHAR(30),
  device_info JSONB,
  ip_address VARCHAR(45),
  refresh_token_hash VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  last_accessed TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Financial Data**
```sql
-- Accounts with tenant-based isolation
CREATE TABLE accounts (
  id VARCHAR(30) PRIMARY KEY,
  tenant_id VARCHAR(30) REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- checking, savings, credit, investment, loan
  subtype VARCHAR(100), -- high_yield_savings, rewards_credit, etc.

  -- Balance tracking
  current_balance DECIMAL(12,2) DEFAULT 0,
  available_balance DECIMAL(12,2),
  credit_limit DECIMAL(12,2),

  -- Account details
  currency VARCHAR(3) DEFAULT 'USD',
  account_number_last4 VARCHAR(4),
  institution_name VARCHAR(255),

  -- Display and organization
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  color VARCHAR(7), -- Hex color code
  icon VARCHAR(50),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions with comprehensive tracking
CREATE TABLE transactions (
  id VARCHAR(30) PRIMARY KEY,
  account_id VARCHAR(30) REFERENCES accounts(id) ON DELETE CASCADE,
  category_id VARCHAR(30) REFERENCES categories(id),

  -- Transaction details
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  date DATE NOT NULL,

  -- Transaction metadata
  type VARCHAR(20) NOT NULL, -- income, expense, transfer
  status VARCHAR(20) DEFAULT 'cleared', -- pending, cleared, reconciled

  -- Transfer handling
  transfer_account_id VARCHAR(30) REFERENCES accounts(id),
  transfer_transaction_id VARCHAR(30) UNIQUE REFERENCES transactions(id),

  -- Import and deduplication
  import_id VARCHAR(30),
  external_id VARCHAR(255),

  -- Flexible metadata
  tags TEXT[],
  metadata JSONB,

  -- Audit trail
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(20) DEFAULT 'user'
);

-- Hierarchical category system with tenant isolation
CREATE TABLE categories (
  id VARCHAR(30) PRIMARY KEY,
  tenant_id VARCHAR(30) REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  parent_id VARCHAR(30) REFERENCES categories(id),

  -- Display properties
  color VARCHAR(7), -- Hex color code
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,

  -- Category metadata
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  transaction_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tenant_id, name, parent_id)
);
```

#### **Balance & Goals**
```sql
-- Account balance history for trend analysis
CREATE TABLE account_balance_history (
  id VARCHAR(30) PRIMARY KEY,
  account_id VARCHAR(30) REFERENCES accounts(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  transaction_count INTEGER DEFAULT 0,
  last_transaction_id VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, date)
);

-- Balance anchors for accuracy verification
CREATE TABLE account_balance_anchors (
  id VARCHAR(30) PRIMARY KEY,
  account_id VARCHAR(30) REFERENCES accounts(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL,
  anchor_date DATE NOT NULL,
  description TEXT,
  is_initial_balance BOOLEAN DEFAULT false,
  confidence_level VARCHAR(20) DEFAULT 'high',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, anchor_date)
);

-- Spending goals and budget tracking
CREATE TABLE spending_goals (
  id VARCHAR(30) PRIMARY KEY,
  tenant_id VARCHAR(30) REFERENCES tenants(id) ON DELETE CASCADE,
  category_id VARCHAR(30) REFERENCES categories(id),

  -- Goal details
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  period_type VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly

  -- Goal period
  start_date DATE NOT NULL,
  end_date DATE,

  -- Progress tracking
  current_amount DECIMAL(12,2) DEFAULT 0,
  last_calculated TIMESTAMP,

  -- Goal metadata
  is_active BOOLEAN DEFAULT true,
  alert_threshold DECIMAL(3,2) DEFAULT 0.80,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Audit & Security**
```sql
-- Comprehensive audit logging
CREATE TABLE audit_logs (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) REFERENCES users(id),
  tenant_id VARCHAR(30) REFERENCES tenants(id),

  -- Action details
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(30),

  -- Request context
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(30),

  -- Change tracking
  old_values JSONB,
  new_values JSONB,

  -- Metadata
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Encryption key management
CREATE TABLE encryption_keys (
  id VARCHAR(30) PRIMARY KEY,
  tenant_id VARCHAR(30) REFERENCES tenants(id) ON DELETE CASCADE,
  key_name VARCHAR(100) NOT NULL,
  encrypted_key TEXT NOT NULL,
  algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
  created_at TIMESTAMP DEFAULT NOW(),
  rotated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  UNIQUE(tenant_id, key_name)
);
```

---

## Core Systems

**Note**: Detailed feature documentation is available in the `docs/features/` directory. This section provides high-level system overview only.

### **System Architecture Overview**
- **Multi-Tenant Authentication**: JWT-based auth with tenant isolation → [Feature Docs](./authentication-system/)
- **Account Management**: Multi-type accounts with balance tracking → [Feature Docs](./account-management/)
- **Transaction Engine**: Comprehensive transaction CRUD with categorization → [Feature Docs](./transaction-crud/)
- **Category System**: Hierarchical categories with management → [Feature Docs](./category-management/)
- **Balance Calculation**: Real-time balance computation → [Feature Docs](./account-balance-history/)
- **Audit & Security**: Complete audit trails and compliance → [Feature Docs](./multi-tenant-support/)

---

## API Specification

### **Authentication & Authorization**
All API endpoints require JWT authentication except for registration and login. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### **Request/Response Format**
- **Content Type**: `application/json`
- **Date Format**: ISO 8601 (`YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:mm:ss.sssZ` for timestamps)
- **Currency**: Decimal values with 2 decimal places
- **Error Format**: Consistent error response structure

### **Standard Response Format**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### **Error Handling**
```typescript
interface ApiError {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: any;
}
```

---

## User Interface Requirements

### **Navigation Structure**
- **Dashboard**: Overview with account summaries and recent transactions
- **Transactions**: Transaction list, add/edit forms, search/filter
- **Accounts**: Account management, balance history, account settings
- **Reports**: Financial reports, spending analysis, category breakdown
- **Goals**: Spending goals, progress tracking, goal management
- **Settings**: Categories, preferences, account settings

### **Responsive Design**
- **Desktop**: Full navigation with hover dropdowns and detailed views
- **Tablet**: Condensed navigation with touch-friendly interactions
- **Mobile**: Hamburger menu with full-screen overlay and optimized forms

### **Key UI Components**
- **Navigation Bar**: Multi-level dropdown menus with active state indicators
- **Dashboard Cards**: Account summaries, recent transactions, goal progress
- **Transaction Forms**: Add/edit transactions with category selection
- **Data Tables**: Sortable, filterable tables with pagination
- **Charts & Graphs**: Balance history, spending trends, category breakdowns
- **Modal Dialogs**: Confirmation dialogs, form overlays, detail views

### **User Experience Principles**
- **Consistency**: Uniform design patterns and interactions
- **Accessibility**: WCAG 2.1 AA compliance with proper ARIA labels
- **Performance**: Fast loading times with optimistic updates
- **Feedback**: Clear success/error messages and loading states
- **Progressive Enhancement**: Core functionality works without JavaScript

---

## Advanced Features

**Note**: Advanced features have dedicated documentation in the `docs/features/` directory.

### **Implemented Advanced Features**
- **CSV Import & Export System** → [Feature Docs](./csv-import/)
- **Bulk Transaction Operations** → [Feature Docs](./bulk-transaction-operations/)
- **Financial Trends Analysis** → [Feature Docs](./financial-trends-analysis/)
- **Net Worth Reporting** → [Feature Docs](./net-worth-report/)

### **Planned Advanced Features**
- **AI-Powered Categorization**: Machine learning-based transaction categorization
- **Recurring Transaction Detection**: Pattern detection and automated scheduling
- **Investment Tracking**: Portfolio management and performance analysis
- **Budget Management**: Advanced budgeting with variance analysis

---

## Security & Compliance

### **Data Protection**
- **Encryption at Rest**: AES-256-GCM encryption for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Key Management**: Tenant-specific encryption keys with rotation
- **Data Isolation**: Complete tenant data separation

### **Authentication Security**
- **Password Policy**: Minimum 8 characters with complexity requirements
- **Rate Limiting**: Login attempt limiting and API rate limiting
- **Session Security**: Secure session tokens with automatic expiration
- **Two-Factor Authentication**: TOTP-based 2FA for enhanced security

### **Compliance Requirements**
- **Audit Trails**: Complete logging of all financial operations
- **Data Retention**: Configurable data retention policies
- **GDPR Compliance**: Data export, deletion, and privacy controls
- **SOC 2 Type II**: Security and availability controls

---

## Performance Requirements

### **Response Time Targets**
- **API Endpoints**: < 200ms for 95th percentile
- **Database Queries**: < 100ms for simple queries, < 500ms for complex
- **Page Load Times**: < 2 seconds for initial load, < 500ms for navigation
- **Real-time Updates**: < 100ms for balance calculations

### **Scalability Targets**
- **Concurrent Users**: Support 1,000+ concurrent users
- **Database Size**: Handle 10M+ transactions per tenant
- **API Throughput**: 1,000+ requests per second
- **Storage**: Scalable file storage for attachments

### **Optimization Strategies**
- **Database Indexing**: Optimized indexes for common query patterns
- **Caching**: Redis caching for frequently accessed data
- **Query Optimization**: Efficient SQL queries with proper joins
- **CDN**: Content delivery network for static assets

---

## Deployment Architecture

### **Production Environment**
- **Platform**: Vercel for Next.js application hosting
- **Database**: PostgreSQL on managed cloud service (Neon, Supabase, or AWS RDS)
- **Caching**: Redis on managed service (Upstash or AWS ElastiCache)
- **File Storage**: Cloud storage for attachments (AWS S3 or Vercel Blob)
- **Monitoring**: Built-in error tracking and performance monitoring

### **Development Workflow**
- **Version Control**: Git with feature branch workflow
- **CI/CD Pipeline**: Automated testing and deployment via Vercel
- **Environment Management**: Development, staging, and production environments
- **Database Migrations**: Prisma migrations with rollback capability

### **Security Infrastructure**
- **SSL/TLS**: Automatic HTTPS with certificate management
- **Environment Variables**: Secure configuration management
- **API Rate Limiting**: Built-in rate limiting and DDoS protection
- **Backup Strategy**: Automated database backups with point-in-time recovery

---

*This document serves as the complete technical specification for FinTrack v5. It contains all information necessary to rebuild the application from scratch.*

**Document Version**: 1.0
**Last Updated**: January 2025
**Next Review**: As needed for feature additions
