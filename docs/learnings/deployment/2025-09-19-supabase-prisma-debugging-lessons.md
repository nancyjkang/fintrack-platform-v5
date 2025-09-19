---
tags: [deployment, database, debugging, supabase, prisma, authentication]
date: 2025-09-19
complexity: intermediate
impact: high
---

# Supabase + Prisma Debugging: Hard-Won Lessons

## Context
During staging deployment and database seeding, encountered a cascade of authentication failures that led to extensive debugging across database, authentication, and connection pooling issues.

## Key Themes & Insights

### 🎯 **Theme 1: "Assumption-Driven Debugging is Dangerous"**

**The Pattern**: Making assumptions about root causes without systematic investigation leads to:
- Unnecessary code changes that create new problems
- Time wasted on wrong solutions
- Compounding issues that mask the real problem

**Example**: Assumed auth failures were due to data relationships, spent hours modifying auth code, when the real issue was stale JWT tokens + my own code changes.

**Learning**: Always investigate systematically:
1. What changed recently?
2. What are the symptoms vs root cause?
3. Test one hypothesis at a time
4. Rollback is often faster than forward fixes

### 🎯 **Theme 2: "Supabase + Prisma Requires Specific Configuration"**

**The Pattern**: Standard Prisma patterns don't work with Supabase's connection pooling.

**Specific Issues**:
- `prepared statement "s0" already exists` errors
- `cached plan must not change result type` errors
- Prisma migrate commands hanging indefinitely

**Solutions**:
```bash
# Required connection string parameters
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true&connection_limit=1"

# Use db push instead of migrations
npx prisma db push

# Use direct SQL for complex operations
psql "connection_string" -f schema.sql
```

**Impact**: This configuration knowledge is critical for any Supabase + Prisma project.

### 🎯 **Theme 3: "Environment Consistency is Non-Negotiable"**

**The Pattern**: Environments drift apart silently, causing failures that are hard to diagnose.

**Example**: Staging database had different schema (missing `type` column in transactions table) than development, causing seed failures.

**Solution**:
- Use identical SQL scripts across environments
- Automate schema synchronization
- Validate environment consistency before deployments

### 🎯 **Theme 4: "Have Multiple Strategies for Critical Operations"**

**The Pattern**: When the "official" way fails, you need alternatives.

**Examples**:
- Prisma migrations fail → Use `prisma db push` + direct SQL
- Prisma seed fails → Use intelligent seed generator with proper connection strings
- Auth debugging gets complex → Rollback and start fresh

**Learning**: Always have Plan B for critical operations.

## Specific Technical Solutions

### Connection String Configuration
```bash
# Development & Staging
DATABASE_URL="postgresql://user:pass@pooler:6543/db?pgbouncer=true&connection_limit=1"

# For seeding operations (bypass pooling issues)
DATABASE_URL="direct_connection_string" npm run seed:generate
```

### Database Schema Management
```bash
# Generate schema SQL from Prisma
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql

# Apply to any environment
psql "connection_string" -f schema.sql
```

### Authentication Debugging Checklist
1. Check for stale tokens in localStorage
2. Verify JWT secrets match across environments
3. Confirm user/tenant/membership relationships exist
4. Test with fresh browser session
5. **Consider rollback before making more changes**

## Process Improvements

### 🔍 **Debugging Protocol**
1. **Document current state** before making changes
2. **Change one thing at a time**
3. **Test each change immediately**
4. **Rollback quickly** if changes don't help
5. **Don't assume** - investigate systematically

### 📋 **File Management Protocol**
1. **Read files completely** before suggesting deletions
2. **Understand purpose** vs just looking at names/sizes
3. **Test functionality** before calling something "obsolete"
4. **Ask clarifying questions** when unsure

## Impact & Future Application

**High Impact Learnings**:
- Supabase connection string requirements (saves hours of debugging)
- Rollback-first debugging strategy (prevents compounding issues)
- Environment consistency validation (prevents deployment failures)

**Applicable To**:
- Any Supabase + Prisma project
- Database deployment strategies
- Authentication debugging
- File/documentation cleanup processes

## Related
- Connection pooling documentation: [Supabase Prisma Guide](https://supabase.com/docs/guides/integrations/prisma)
- Environment consistency: `docs/deployment-guides/DATABASE_DEPLOYMENT_GUIDE.md`
- Authentication architecture: `src/lib/auth.ts`

---

**Key Takeaway**: The "mess" taught us that systematic investigation beats assumption-driven debugging every time. These hard-won lessons will save significant time on future projects.
