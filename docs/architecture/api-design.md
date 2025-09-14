# API Design & Architecture

## 🎯 **API Design Principles**

- **RESTful**: Clear, predictable endpoints following REST conventions
- **Consistent**: Uniform response formats and error handling
- **Secure**: Authentication, authorization, and input validation on all endpoints
- **Performant**: Optimized queries with pagination and caching
- **Documented**: Comprehensive OpenAPI/Swagger documentation

## 🏗️ **API Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │───▶│   API Gateway   │───▶│   Route Handler │
│  (Next.js 15)   │    │ (Middleware)    │    │  (Business Logic)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Cache   │    │   Redis Cache   │    │   PostgreSQL    │
│ (React Query)   │    │  (Session/Data) │    │  (Primary DB)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔌 **Core API Endpoints**

### **Authentication Endpoints**

```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  timezone?: string;
  currency?: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
  requiresVerification: boolean;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: UserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  session: string;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// POST /api/auth/logout
interface LogoutRequest {
  sessionId?: string; // Optional: logout specific session
  allSessions?: boolean; // Optional: logout all sessions
}
```

### **User Management Endpoints**

```typescript
// GET /api/user/profile
interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  createdAt: string;
  lastLogin: string;

  // Privacy settings
  benchmarkingSettings: {
    enabled: boolean;
    shareAgeRange: boolean;
    shareIncomeRange: boolean;
    shareLocation: boolean;
  };
}

// PUT /api/user/profile
interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
}

// PUT /api/user/demographics
interface UpdateDemographicsRequest {
  ageRange?: string;
  incomeRange?: string;
  location?: string;
  occupationCategory?: string;
  shareForBenchmarking?: boolean;
  shareAgeRange?: boolean;
  shareIncomeRange?: boolean;
  shareLocation?: boolean;
}

// POST /api/user/change-password
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// GET /api/user/sessions
interface UserSessionsResponse {
  sessions: Array<{
    id: string;
    deviceInfo: {
      browser: string;
      os: string;
      device: string;
    };
    ipAddress: string;
    lastAccessed: string;
    isCurrent: boolean;
  }>;
}

// DELETE /api/user/sessions/:sessionId
// Revoke specific session
```

### **Account Management Endpoints**

```typescript
// GET /api/accounts
interface GetAccountsResponse {
  accounts: Array<{
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
    subtype?: string;
    currentBalance: number;
    availableBalance?: number;
    creditLimit?: number;
    currency: string;
    institutionName?: string;
    accountNumberLast4?: string;
    isActive: boolean;
    color: string;
    icon: string;
    createdAt: string;
    updatedAt: string;
  }>;
  totalBalance: number;
  totalAssets: number;
  totalLiabilities: number;
}

// POST /api/accounts
interface CreateAccountRequest {
  name: string;
  type: string;
  subtype?: string;
  currentBalance: number;
  creditLimit?: number;
  currency?: string;
  institutionName?: string;
  accountNumberLast4?: string;
  color?: string;
  icon?: string;
}

interface CreateAccountResponse {
  account: Account;
  balanceAnchor: {
    id: string;
    balance: number;
    anchorDate: string;
    isInitialBalance: boolean;
  };
}

// PUT /api/accounts/:accountId
interface UpdateAccountRequest {
  name?: string;
  institutionName?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

// DELETE /api/accounts/:accountId
// Soft delete account (mark as inactive)

// GET /api/accounts/:accountId/balance-history
interface BalanceHistoryResponse {
  history: Array<{
    date: string;
    balance: number;
    transactionCount: number;
  }>;
  period: string; // 'month', 'quarter', 'year'
}

// POST /api/accounts/:accountId/balance-anchors
interface CreateBalanceAnchorRequest {
  balance: number;
  anchorDate: string;
  description?: string;
  confidenceLevel?: 'high' | 'medium' | 'low';
}
```

### **Transaction Management Endpoints**

```typescript
// GET /api/transactions
interface GetTransactionsRequest {
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense' | 'transfer';
  minAmount?: number;
  maxAmount?: number;
  search?: string; // Search in description
  tags?: string[]; // Filter by tags
  page?: number;
  limit?: number; // Max 100
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
}

interface GetTransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    transactionCount: number;
  };
}

// POST /api/transactions
interface CreateTransactionRequest {
  accountId: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  transferAccountId?: string; // Required for transfers
  notes?: string;
  tags?: string[];
}

interface CreateTransactionResponse {
  transaction: Transaction;
  balanceUpdate: {
    accountId: string;
    oldBalance: number;
    newBalance: number;
  };
  transferTransaction?: Transaction; // For transfers
}

// PUT /api/transactions/:transactionId
interface UpdateTransactionRequest {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string;
  notes?: string;
  tags?: string[];
}

// DELETE /api/transactions/:transactionId
// Soft delete with balance recalculation

// POST /api/transactions/bulk-delete
interface BulkDeleteRequest {
  transactionIds: string[];
  reason?: string;
}

interface BulkDeleteResponse {
  deletedCount: number;
  affectedAccounts: Array<{
    accountId: string;
    balanceChange: number;
  }>;
}

// POST /api/transactions/import
interface ImportTransactionsRequest {
  accountId: string;
  csvData: string;
  mapping: {
    dateColumn: string;
    amountColumn: string;
    descriptionColumn: string;
    categoryColumn?: string;
  };
  skipFirstRow: boolean;
}

interface ImportTransactionsResponse {
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  preview: Transaction[]; // First 5 imported transactions
}
```

### **Category Management Endpoints**

```typescript
// GET /api/categories
interface GetCategoriesResponse {
  categories: Array<{
    id: string;
    name: string;
    parentId?: string;
    color: string;
    icon: string;
    isSystem: boolean;
    isActive: boolean;
    transactionCount: number;
    children?: Category[]; // Subcategories
  }>;
}

// POST /api/categories
interface CreateCategoryRequest {
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

// PUT /api/categories/:categoryId
interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

// DELETE /api/categories/:categoryId
// Soft delete with transaction reassignment

// POST /api/categories/merge
interface MergeCategoriesRequest {
  sourceIds: string[];
  targetId: string;
}

interface MergeCategoriesResponse {
  mergedCount: number;
  updatedTransactions: number;
}
```

### **Analytics & Insights Endpoints**

```typescript
// GET /api/analytics/spending-summary
interface SpendingSummaryRequest {
  period: 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
  groupBy?: 'category' | 'account' | 'month';
}

interface SpendingSummaryResponse {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    savingsRate: number;
  };
  breakdown: Array<{
    name: string;
    amount: number;
    percentage: number;
    transactionCount: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  }>;
  trends: Array<{
    period: string;
    income: number;
    expenses: number;
    net: number;
  }>;
}

// GET /api/analytics/spending-trends
interface SpendingTrendsRequest {
  categoryId?: string;
  period: 'daily' | 'weekly' | 'monthly';
  months: number; // Number of months to analyze
}

interface SpendingTrendsResponse {
  trends: Array<{
    period: string;
    amount: number;
    transactionCount: number;
    averageTransaction: number;
  }>;
  insights: Array<{
    type: 'trend' | 'anomaly' | 'seasonal';
    title: string;
    description: string;
    confidence: number;
  }>;
}

// GET /api/analytics/insights
interface GetInsightsResponse {
  insights: Array<{
    id: string;
    type: 'trend' | 'anomaly' | 'benchmark' | 'prediction';
    title: string;
    description: string;
    confidence: number;
    category?: string;
    amount?: number;
    percentageChange?: number;
    isRead: boolean;
    createdAt: string;
    expiresAt?: string;
  }>;
}

// PUT /api/analytics/insights/:insightId/read
// Mark insight as read

// DELETE /api/analytics/insights/:insightId
// Dismiss insight
```

### **Benchmarking Endpoints**

```typescript
// GET /api/benchmarks/compare
interface BenchmarkCompareRequest {
  category: string;
  period: string; // "2024-01"
  amount: number;
}

interface BenchmarkCompareResponse {
  userAmount: number;
  benchmarks: {
    average: number;
    median: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
  };
  percentile: number; // Where user ranks (0-100)
  comparison: 'below' | 'average' | 'above';
  insights: Array<{
    type: 'positive' | 'neutral' | 'negative';
    message: string;
    suggestion?: string;
  }>;
  sampleSize: number;
  demographics: {
    ageRange?: string;
    incomeRange?: string;
    location?: string;
  };
}

// GET /api/benchmarks/categories
interface BenchmarkCategoriesResponse {
  categories: Array<{
    name: string;
    sampleSize: number;
    lastUpdated: string;
    hasData: boolean;
  }>;
}

// POST /api/benchmarks/contribute
interface ContributeBenchmarkRequest {
  period: string;
  categories: Array<{
    name: string;
    amount: number;
    transactionCount: number;
  }>;
}

interface ContributeBenchmarkResponse {
  contributed: boolean;
  categoriesContributed: string[];
  nextContributionDate: string;
}
```

## 🛡️ **API Security & Middleware**

### **Authentication Middleware**

```typescript
// src/lib/api/auth-middleware.ts
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    const decoded = tokenService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'AUTH_INVALID'
    });
  }
}

// Permission-based authorization
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: permission
      });
    }
    next();
  };
}
```

### **Input Validation Middleware**

```typescript
// src/lib/api/validation-middleware.ts
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (req.body) {
        req.body = schema.parse(req.body);
      }

      // Validate query parameters
      if (req.query) {
        req.query = schema.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }

      next(error);
    }
  };
}

// Example validation schemas
export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().min(-999999.99).max(999999.99),
  description: z.string().min(1).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['income', 'expense', 'transfer']),
  categoryId: z.string().uuid().optional(),
  transferAccountId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional()
});
```

### **Rate Limiting Middleware**

```typescript
// src/lib/api/rate-limit-middleware.ts
export function rateLimit(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate_limit:${options.keyGenerator(req)}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, options.windowMs / 1000);
    }

    if (current > options.max) {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: options.windowMs / 1000
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - current));
    res.setHeader('X-RateLimit-Reset', Date.now() + options.windowMs);

    next();
  };
}

// Rate limit configurations
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || 'unknown'}`
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => `api:${req.user?.id || req.ip}`
});
```

## 📊 **Response Formats**

### **Standard Response Format**

```typescript
// Success response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

// Error response
interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Pagination metadata
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### **Error Codes**

```typescript
export enum ApiErrorCode {
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',

  // Authorization errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_GONE = 'RESOURCE_GONE',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR'
}
```

## 🚀 **Performance Optimizations**

### **Caching Strategy**

```typescript
// src/lib/api/cache-middleware.ts
export function cacheResponse(options: CacheOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = `api_cache:${options.keyGenerator(req)}`;

    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Cache the response
    const originalSend = res.json;
    res.json = function(data) {
      redis.setex(cacheKey, options.ttl, JSON.stringify(data));
      res.setHeader('X-Cache', 'MISS');
      return originalSend.call(this, data);
    };

    next();
  };
}

// Cache configurations
export const shortCache = cacheResponse({
  ttl: 60, // 1 minute
  keyGenerator: (req) => `${req.method}:${req.path}:${req.user?.id}`
});

export const longCache = cacheResponse({
  ttl: 3600, // 1 hour
  keyGenerator: (req) => `${req.method}:${req.path}:${req.user?.id}`
});
```

### **Database Query Optimization**

```typescript
// Optimized transaction queries with includes
export async function getTransactions(userId: string, filters: TransactionFilters) {
  return await db.transaction.findMany({
    where: {
      userId,
      ...buildWhereClause(filters)
    },
    include: {
      account: {
        select: { id: true, name: true, type: true }
      },
      category: {
        select: { id: true, name: true, color: true, icon: true }
      }
    },
    orderBy: { date: 'desc' },
    take: filters.limit || 50,
    skip: ((filters.page || 1) - 1) * (filters.limit || 50)
  });
}

// Batch operations for better performance
export async function bulkUpdateTransactions(
  userId: string,
  updates: Array<{ id: string; data: Partial<Transaction> }>
) {
  const operations = updates.map(update =>
    db.transaction.update({
      where: { id: update.id, userId },
      data: update.data
    })
  );

  return await db.$transaction(operations);
}
```

---

This API design provides a **comprehensive, secure, and performant** foundation for FinTrack v5, with clear endpoints for all core functionality and advanced features like benchmarking and analytics.
