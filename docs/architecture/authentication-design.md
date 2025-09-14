# Authentication & Authorization Design

## 🎯 **Authentication Strategy**

FinTrack v5 uses a **modern, secure authentication system** built on industry best practices with JWT tokens, secure session management, and comprehensive audit trails.

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │───▶│   Auth API      │───▶│   Database      │
│  (Next.js 15)   │    │  (JWT + RBAC)   │    │ (Users/Sessions)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Local Storage  │    │  Session Store  │    │   Audit Logs    │
│ (Access Token)  │    │    (Redis)      │    │  (Security)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 **Core Components**

### **1. User Registration & Login**

```typescript
// src/lib/auth/auth-service.ts
export class AuthService {

  // User registration with email verification
  async register(userData: RegisterData): Promise<AuthResult> {
    // 1. Validate input
    const validation = await this.validateRegistration(userData);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }

    // 2. Check if user exists
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    // 3. Hash password with bcrypt
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // 4. Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 5. Create user record
    const user = await db.user.create({
      data: {
        email: userData.email.toLowerCase(),
        passwordHash,
        emailVerificationToken: verificationToken,
        profile: {
          create: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            timezone: userData.timezone || 'UTC',
            currency: userData.currency || 'USD'
          }
        }
      },
      include: { profile: true }
    });

    // 6. Send verification email
    await this.sendVerificationEmail(user.email, verificationToken);

    // 7. Log registration
    await this.auditLog('user_registered', user.id, { email: user.email });

    return {
      user: this.sanitizeUser(user),
      requiresVerification: true
    };
  }

  // User login with security checks
  async login(credentials: LoginCredentials, context: RequestContext): Promise<AuthResult> {
    // 1. Rate limiting check
    await this.checkRateLimit(credentials.email, context.ipAddress);

    // 2. Find user
    const user = await this.findUserByEmail(credentials.email);
    if (!user) {
      await this.auditLog('login_failed', null, {
        email: credentials.email,
        reason: 'user_not_found',
        ipAddress: context.ipAddress
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    // 3. Check if account is active
    if (!user.isActive) {
      throw new ForbiddenError('Account is disabled');
    }

    // 4. Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      await this.auditLog('login_failed', user.id, {
        reason: 'invalid_password',
        ipAddress: context.ipAddress
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    // 5. Check email verification
    if (!user.emailVerified) {
      throw new ForbiddenError('Email not verified');
    }

    // 6. Generate JWT tokens
    const tokens = await this.generateTokens(user);

    // 7. Create session record
    const session = await this.createSession(user.id, context);

    // 8. Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // 9. Log successful login
    await this.auditLog('login_success', user.id, {
      sessionId: session.id,
      ipAddress: context.ipAddress
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
      session: session.id
    };
  }
}
```

### **2. JWT Token Management**

```typescript
// src/lib/auth/token-service.ts
export class TokenService {

  // Generate access and refresh tokens
  async generateTokens(user: User): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'user',
      permissions: await this.getUserPermissions(user.id)
    };

    // Short-lived access token (15 minutes)
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '15m',
      issuer: 'fintrack-v5',
      audience: 'fintrack-api'
    });

    // Long-lived refresh token (7 days)
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: '7d',
        issuer: 'fintrack-v5',
        audience: 'fintrack-api'
      }
    );

    // Store refresh token hash in database
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await db.userSession.update({
      where: { userId: user.id },
      data: {
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return { accessToken, refreshToken };
  }

  // Verify and decode JWT token
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      // Check if user is still active
      const user = await db.user.findUnique({
        where: { id: decoded.sub },
        select: { isActive: true, emailVerified: true }
      });

      if (!user?.isActive || !user?.emailVerified) {
        throw new UnauthorizedError('User account is inactive');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }
  }

  // Refresh access token using refresh token
  async refreshTokens(refreshToken: string, context: RequestContext): Promise<TokenPair> {
    // 1. Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JWTPayload;

    // 2. Check refresh token in database
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await db.userSession.findFirst({
      where: {
        userId: decoded.sub,
        refreshTokenHash,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // 3. Generate new token pair
    const newTokens = await this.generateTokens(session.user);

    // 4. Update session
    await db.userSession.update({
      where: { id: session.id },
      data: { lastAccessed: new Date() }
    });

    return newTokens;
  }
}
```

### **3. Session Management**

```typescript
// src/lib/auth/session-service.ts
export class SessionService {

  // Create new user session
  async createSession(userId: string, context: RequestContext): Promise<UserSession> {
    // Generate unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Detect device info
    const deviceInfo = this.parseUserAgent(context.userAgent);

    // Create session record
    const session = await db.userSession.create({
      data: {
        userId,
        sessionToken,
        deviceInfo,
        ipAddress: context.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        lastAccessed: new Date()
      }
    });

    // Clean up old sessions (keep only 5 most recent)
    await this.cleanupOldSessions(userId);

    return session;
  }

  // Validate session and update last accessed
  async validateSession(sessionToken: string): Promise<UserSession | null> {
    const session = await db.userSession.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Update last accessed (throttled to once per minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (session.lastAccessed < oneMinuteAgo) {
      await db.userSession.update({
        where: { id: session.id },
        data: { lastAccessed: new Date() }
      });
    }

    return session;
  }

  // Revoke session (logout)
  async revokeSession(sessionToken: string): Promise<void> {
    await db.userSession.delete({
      where: { sessionToken }
    });
  }

  // Revoke all user sessions (logout everywhere)
  async revokeAllUserSessions(userId: string): Promise<void> {
    await db.userSession.deleteMany({
      where: { userId }
    });
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<number> {
    const result = await db.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    return result.count;
  }
}
```

## 🛡️ **Authorization & Permissions**

### **Role-Based Access Control (RBAC)**

```typescript
// src/lib/auth/permissions.ts
export enum Permission {
  // Transaction permissions
  TRANSACTION_READ = 'transaction:read',
  TRANSACTION_CREATE = 'transaction:create',
  TRANSACTION_UPDATE = 'transaction:update',
  TRANSACTION_DELETE = 'transaction:delete',
  TRANSACTION_IMPORT = 'transaction:import',

  // Account permissions
  ACCOUNT_READ = 'account:read',
  ACCOUNT_CREATE = 'account:create',
  ACCOUNT_UPDATE = 'account:update',
  ACCOUNT_DELETE = 'account:delete',

  // Analytics permissions
  ANALYTICS_READ = 'analytics:read',
  BENCHMARKS_READ = 'benchmarks:read',
  BENCHMARKS_CONTRIBUTE = 'benchmarks:contribute',

  // Admin permissions
  USER_MANAGE = 'user:manage',
  SYSTEM_ADMIN = 'system:admin'
}

export enum Role {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin'
}

// Permission matrix
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_UPDATE,
    Permission.TRANSACTION_DELETE,
    Permission.ACCOUNT_READ,
    Permission.ACCOUNT_CREATE,
    Permission.ACCOUNT_UPDATE,
    Permission.ACCOUNT_DELETE,
    Permission.ANALYTICS_READ
  ],

  [Role.PREMIUM]: [
    ...ROLE_PERMISSIONS[Role.USER],
    Permission.TRANSACTION_IMPORT,
    Permission.BENCHMARKS_READ,
    Permission.BENCHMARKS_CONTRIBUTE
  ],

  [Role.ADMIN]: [
    ...ROLE_PERMISSIONS[Role.PREMIUM],
    Permission.USER_MANAGE,
    Permission.SYSTEM_ADMIN
  ]
};

// Authorization middleware
export function requirePermission(permission: Permission) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userPermissions = req.user.permissions;

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission
      });
    }

    next();
  };
}
```

## 🔒 **Security Features**

### **1. Rate Limiting**

```typescript
// src/lib/auth/rate-limiter.ts
export class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  // Check rate limit for login attempts
  async checkLoginRateLimit(email: string, ipAddress: string): Promise<void> {
    const emailKey = `login_attempts:email:${email}`;
    const ipKey = `login_attempts:ip:${ipAddress}`;

    // Check email-based rate limit (5 attempts per 15 minutes)
    const emailAttempts = await this.redis.incr(emailKey);
    if (emailAttempts === 1) {
      await this.redis.expire(emailKey, 15 * 60); // 15 minutes
    }

    if (emailAttempts > 5) {
      throw new TooManyRequestsError('Too many login attempts for this email');
    }

    // Check IP-based rate limit (20 attempts per 15 minutes)
    const ipAttempts = await this.redis.incr(ipKey);
    if (ipAttempts === 1) {
      await this.redis.expire(ipKey, 15 * 60); // 15 minutes
    }

    if (ipAttempts > 20) {
      throw new TooManyRequestsError('Too many login attempts from this IP');
    }
  }

  // Clear rate limit on successful login
  async clearLoginRateLimit(email: string, ipAddress: string): Promise<void> {
    await Promise.all([
      this.redis.del(`login_attempts:email:${email}`),
      this.redis.del(`login_attempts:ip:${ipAddress}`)
    ]);
  }
}
```

### **2. Security Headers & CSRF Protection**

```typescript
// src/lib/auth/security-middleware.ts
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS (HTTPS only)
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

// CSRF protection for state-changing operations
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] as string;
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!token || !sessionToken) {
      return res.status(403).json({ error: 'CSRF token required' });
    }

    // Verify CSRF token matches session
    const expectedToken = crypto
      .createHmac('sha256', process.env.CSRF_SECRET!)
      .update(sessionToken)
      .digest('hex');

    if (token !== expectedToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }

  next();
}
```

## 📊 **Audit & Monitoring**

### **Security Event Logging**

```typescript
// src/lib/auth/audit-service.ts
export class AuditService {

  async logSecurityEvent(
    event: SecurityEvent,
    userId?: string,
    context?: RequestContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    await db.auditLog.create({
      data: {
        userId,
        action: event,
        resourceType: 'security',
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          severity: this.getEventSeverity(event)
        },
        success: true
      }
    });

    // Alert on critical security events
    if (this.isCriticalEvent(event)) {
      await this.sendSecurityAlert(event, userId, context, metadata);
    }
  }

  private getEventSeverity(event: SecurityEvent): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<SecurityEvent, string> = {
      'login_success': 'low',
      'login_failed': 'medium',
      'password_changed': 'medium',
      'email_changed': 'medium',
      'account_locked': 'high',
      'suspicious_login': 'high',
      'data_breach_attempt': 'critical'
    };

    return severityMap[event] as any;
  }
}
```

## 🔄 **Password Security**

### **Password Requirements & Reset**

```typescript
// src/lib/auth/password-service.ts
export class PasswordService {

  // Validate password strength
  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check against common passwords
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common, please choose a stronger password');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Secure password reset flow
  async initiatePasswordReset(email: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Store hashed token with expiry
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });

    // Send reset email
    await this.sendPasswordResetEmail(user.email, resetToken);

    // Log password reset request
    await auditService.logSecurityEvent('password_reset_requested', user.id);
  }
}
```

---

This authentication system provides **enterprise-grade security** with comprehensive audit trails, rate limiting, and modern JWT-based authentication suitable for a scalable SaaS platform.
