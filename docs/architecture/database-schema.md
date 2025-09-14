# Multi-Tenant Database Schema Design

## 🎯 **Design Principles**

- **Multi-Tenancy**: Complete data isolation using tenant-based architecture
- **Scalability**: Designed to handle millions of users and transactions across thousands of tenants
- **Security**: Tenant-scoped data access with encrypted sensitive information
- **Performance**: Optimized indexes for tenant-aware query patterns
- **Flexibility**: Extensible schema supporting personal, family, and business use cases
- **Compliance**: GDPR-ready with comprehensive audit trails

## 🏢 **Multi-Tenant Architecture Overview**

### **Core Concept**
- **Users** authenticate and have basic profile information
- **Tenants** contain all financial data (accounts, transactions, categories)
- **Memberships** connect users to tenants with role-based access
- **Sessions** track which tenant a user is currently working with

### **Benefits**
- **Complete Data Isolation**: Each tenant's data is completely separate
- **Flexible Access Control**: Users can belong to multiple tenants (family, business)
- **Scalable Architecture**: Easy to partition data by tenant for performance
- **Enterprise Ready**: Supports complex organizational structures

## 📊 **Core Tables**

### **Authentication & User Management**

```sql
-- Minimal user authentication data
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_picture VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Tenant data containers
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL, -- "John's Finances", "Smith Family", "Acme Corp"
  type VARCHAR(20) DEFAULT 'PERSONAL', -- PERSONAL, FAMILY, BUSINESS
  timezone VARCHAR(50) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en-US',
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User-tenant relationships with roles
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'OWNER', -- OWNER, ADMIN, MEMBER, VIEWER
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, tenant_id)
);

-- User sessions with tenant context
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  current_tenant_id UUID, -- Active tenant for this session
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_accessed TIMESTAMP DEFAULT NOW(),
  refresh_token_hash VARCHAR(255)
);
```

### **Financial Core Data (Tenant-Scoped)**

```sql
-- Financial accounts (all tenant-scoped)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- checking, savings, credit, investment, loan
  subtype VARCHAR(50), -- high_yield_savings, rewards_credit, etc.

  -- Balance tracking
  current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  available_balance DECIMAL(12,2), -- For credit accounts
  credit_limit DECIMAL(12,2), -- For credit accounts

  -- Account details
  currency VARCHAR(3) DEFAULT 'USD',
  account_number_last4 VARCHAR(4), -- Last 4 digits for identification
  institution_name VARCHAR(100),

  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  color VARCHAR(7), -- Hex color for UI
  icon VARCHAR(50), -- Icon identifier

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transaction categories (tenant-scoped)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id), -- For subcategories

  -- Display properties
  color VARCHAR(7), -- Hex color
  icon VARCHAR(50), -- Icon identifier
  display_order INTEGER DEFAULT 0,

  -- Category metadata
  is_system BOOLEAN DEFAULT false, -- System categories (Transfer, etc.)
  is_active BOOLEAN DEFAULT true,
  transaction_count INTEGER DEFAULT 0, -- Denormalized for performance

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tenant_id, name, parent_id)
);

-- Core transactions table (tenant-scoped)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),

  -- Transaction details
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  notes TEXT, -- User-added notes
  date DATE NOT NULL,

  -- Transaction metadata
  type VARCHAR(20) NOT NULL, -- income, expense, transfer
  status VARCHAR(20) DEFAULT 'cleared', -- pending, cleared, reconciled

  -- Transfer handling
  transfer_account_id UUID REFERENCES accounts(id), -- For transfers
  transfer_transaction_id UUID REFERENCES transactions(id), -- Linked transfer

  -- Import and deduplication
  import_id VARCHAR(100), -- For CSV import deduplication
  external_id VARCHAR(100), -- Bank API transaction ID

  -- Flexible metadata
  tags TEXT[], -- User-defined tags
  metadata JSONB, -- Flexible key-value storage

  -- Audit trail
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(20) DEFAULT 'user', -- user, import, api, system

  -- Constraints
  CONSTRAINT valid_transfer CHECK (
    (type = 'transfer' AND transfer_account_id IS NOT NULL) OR
    (type != 'transfer' AND transfer_account_id IS NULL)
  )
);
```

### **Balance History & Anchors (Tenant-Scoped)**

```sql
-- Account balance history for tracking over time
CREATE TABLE account_balance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  balance DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,

  -- Balance calculation metadata
  transaction_count INTEGER NOT NULL DEFAULT 0,
  last_transaction_id UUID REFERENCES transactions(id),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(account_id, date)
);

-- Balance anchors for accurate historical tracking
CREATE TABLE account_balance_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  balance DECIMAL(12,2) NOT NULL,
  anchor_date DATE NOT NULL,
  description TEXT,

  -- Anchor metadata
  is_initial_balance BOOLEAN DEFAULT false,
  confidence_level VARCHAR(20) DEFAULT 'high', -- high, medium, low

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(account_id, anchor_date)
);
```

## 🧠 **Benchmarking & Analytics (Tenant-Scoped)**

### **Anonymous Benchmarking Data**

```sql
-- Anonymized spending aggregates for benchmarking (global)
CREATE TABLE spending_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time period
  period VARCHAR(7) NOT NULL, -- "2024-01" (YYYY-MM)
  period_type VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, yearly

  -- Category breakdown
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),

  -- Demographics (optional, user-controlled)
  age_range VARCHAR(10),
  income_range VARCHAR(15),
  location VARCHAR(10),
  occupation_category VARCHAR(50),

  -- Statistical data
  avg_amount DECIMAL(12,2) NOT NULL,
  median_amount DECIMAL(12,2) NOT NULL,
  p25_amount DECIMAL(12,2) NOT NULL,
  p75_amount DECIMAL(12,2) NOT NULL,
  p90_amount DECIMAL(12,2) NOT NULL,
  p95_amount DECIMAL(12,2) NOT NULL,

  -- Sample metadata
  sample_size INTEGER NOT NULL,
  std_deviation DECIMAL(12,2),

  -- Data quality
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  last_updated TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),

  -- Ensure uniqueness per demographic slice
  UNIQUE(period, category, subcategory, age_range, income_range, location, occupation_category)
);

-- Tenant contribution tracking (for benchmark generation)
CREATE TABLE benchmark_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  period VARCHAR(7) NOT NULL,
  contributed_at TIMESTAMP DEFAULT NOW(),

  -- Track what was contributed (for audit)
  categories_contributed TEXT[],
  total_transactions INTEGER,

  -- Privacy hash (for deduplication without exposing tenant_id)
  contribution_hash VARCHAR(64) UNIQUE NOT NULL,

  UNIQUE(tenant_id, period)
);
```

### **Analytics & Insights (Tenant-Scoped)**

```sql
-- Tenant spending patterns and insights
CREATE TABLE user_spending_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  period VARCHAR(7) NOT NULL, -- "2024-01"
  insight_type VARCHAR(50) NOT NULL, -- trend, anomaly, benchmark, prediction

  -- Insight data
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00

  -- Associated data
  category VARCHAR(100),
  amount DECIMAL(12,2),
  percentage_change DECIMAL(5,2),

  -- Metadata
  metadata JSONB, -- Flexible insight-specific data
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Some insights may expire

  UNIQUE(tenant_id, period, insight_type, category)
);

-- Spending goals and budgets (tenant-scoped)
CREATE TABLE spending_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),

  -- Goal details
  name VARCHAR(100) NOT NULL,
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
  alert_threshold DECIMAL(3,2) DEFAULT 0.80, -- Alert at 80%

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 **Security & Audit**

```sql
-- Comprehensive audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), -- Who performed the action
  tenant_id UUID, -- Which tenant's data was affected

  -- Action details
  action VARCHAR(50) NOT NULL, -- create, read, update, delete
  resource_type VARCHAR(50) NOT NULL, -- transaction, account, user, etc.
  resource_id UUID,

  -- Request context
  ip_address INET,
  user_agent TEXT,
  session_id UUID REFERENCES user_sessions(id),

  -- Change tracking
  old_values JSONB,
  new_values JSONB,

  -- Metadata
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Data encryption keys (tenant-scoped)
CREATE TABLE encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_name VARCHAR(100) NOT NULL,
  encrypted_key TEXT NOT NULL, -- Encrypted with master key
  algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
  created_at TIMESTAMP DEFAULT NOW(),
  rotated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  UNIQUE(tenant_id, key_name)
);
```

## 📈 **Performance Indexes (Multi-Tenant Optimized)**

```sql
-- Multi-tenant relationship indexes
CREATE INDEX idx_memberships_user ON memberships(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_memberships_tenant ON memberships(tenant_id, is_active) WHERE is_active = true;

-- Tenant-scoped financial data indexes
CREATE INDEX idx_transactions_tenant_date ON transactions(tenant_id, date DESC);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id, date DESC);
CREATE INDEX idx_transactions_amount ON transactions(tenant_id, amount) WHERE amount < 0;
CREATE INDEX idx_transactions_type_date ON transactions(tenant_id, type, date DESC);

-- Account indexes (tenant-scoped)
CREATE INDEX idx_accounts_tenant_active ON accounts(tenant_id) WHERE is_active = true;
CREATE INDEX idx_accounts_type ON accounts(tenant_id, type);

-- Category indexes (tenant-scoped)
CREATE INDEX idx_categories_tenant ON categories(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_categories_parent ON categories(parent_id) WHERE parent_id IS NOT NULL;

-- Balance history indexes (tenant-scoped)
CREATE INDEX idx_balance_history_account_date ON account_balance_history(account_id, date DESC);
CREATE INDEX idx_balance_history_tenant ON account_balance_history(tenant_id, date DESC);
CREATE INDEX idx_balance_anchors_account_date ON account_balance_anchors(account_id, anchor_date DESC);
CREATE INDEX idx_balance_anchors_tenant ON account_balance_anchors(tenant_id, anchor_date DESC);

-- Analytics indexes (tenant-scoped)
CREATE INDEX idx_insights_tenant_period ON user_spending_insights(tenant_id, period, is_read);
CREATE INDEX idx_goals_tenant_active ON spending_goals(tenant_id, is_active) WHERE is_active = true;

-- Audit log indexes
CREATE INDEX idx_audit_user_time ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id, created_at DESC);

-- Session indexes
CREATE INDEX idx_sessions_user ON user_sessions(user_id, expires_at);
CREATE INDEX idx_sessions_token ON user_sessions(session_token) WHERE expires_at > NOW();
CREATE INDEX idx_sessions_tenant ON user_sessions(current_tenant_id) WHERE current_tenant_id IS NOT NULL;
```

## 🔄 **Multi-Tenant Data Access Patterns**

### **Typical Query Patterns**

```sql
-- Get user's tenants
SELECT t.*, m.role
FROM tenants t
JOIN memberships m ON t.id = m.tenant_id
WHERE m.user_id = $1 AND m.is_active = true;

-- Get tenant's accounts
SELECT * FROM accounts
WHERE tenant_id = $1 AND is_active = true
ORDER BY display_order, name;

-- Get tenant's transactions
SELECT t.*, a.name as account_name, c.name as category_name
FROM transactions t
LEFT JOIN accounts a ON t.account_id = a.id
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.tenant_id = $1
ORDER BY t.date DESC, t.created_at DESC;

-- Benchmarking query (anonymous)
SELECT avg_amount, median_amount, p75_amount, p90_amount
FROM spending_benchmarks
WHERE period = $1
  AND category = $2
  AND age_range = $3
  AND income_range = $4;
```

### **Row-Level Security (RLS)**

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for accounts
CREATE POLICY tenant_accounts_policy ON accounts
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships
    WHERE user_id = current_user_id()
    AND is_active = true
  ));
```

## 🏗️ **Migration Strategy**

### **From User-Scoped to Tenant-Scoped**

1. **Create new multi-tenant tables**
2. **Create default tenant for each user**
3. **Migrate data with tenant_id = user's default tenant**
4. **Update application code to be tenant-aware**
5. **Drop old user_id columns**

### **Tenant Types & Use Cases**

- **PERSONAL**: Individual user's finances
- **FAMILY**: Shared family finances with multiple members
- **BUSINESS**: Company finances with role-based access

## 📋 **Data Lifecycle & Compliance**

### **Automated Cleanup**
```sql
-- Clean up expired sessions
DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '7 days';

-- Archive old audit logs (keep 2 years)
INSERT INTO audit_logs_archive SELECT * FROM audit_logs WHERE created_at < NOW() - INTERVAL '2 years';
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '2 years';

-- Clean up old benchmark data (keep 5 years)
DELETE FROM spending_benchmarks WHERE created_at < NOW() - INTERVAL '5 years';
```

### **GDPR Compliance**
- **Right to be Forgotten**: Delete user and all associated tenant data
- **Data Portability**: Export all tenant data in JSON format
- **Consent Management**: Track user consent for benchmarking participation
- **Audit Trail**: Complete audit log of all data access and modifications

---

This **multi-tenant architecture** provides **complete data isolation**, **flexible access control**, and **enterprise-ready scalability** while maintaining **privacy-first principles** and supporting **patent-pending benchmarking algorithms**.
