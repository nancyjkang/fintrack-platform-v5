---
tags: [deployment, database, supabase, prisma, quick-reference]
date: 2025-09-19
complexity: beginner
impact: high
---

# Supabase + Prisma Quick Reference

## 🚨 **Critical Connection String**
```bash
# REQUIRED for Supabase + Prisma
DATABASE_URL="postgresql://user:pass@pooler:6543/db?pgbouncer=true&connection_limit=1"
```

## 🔧 **Working Commands**

### Schema Management
```bash
# ✅ Use this (works)
npx prisma db push

# ❌ Avoid this (hangs)
npx prisma migrate dev
```

### Database Seeding
```bash
# ✅ Use this (works)
DATABASE_URL="connection_string" npm run seed:generate

# ❌ Avoid this (connection pooling issues)
npx prisma db seed
```

### Schema Sync Across Environments
```bash
# Generate SQL from schema
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql

# Apply to any environment
psql "connection_string" -f schema.sql
```

## 🐛 **Common Errors & Fixes**

| Error | Fix |
|-------|-----|
| `prepared statement "s0" already exists` | Add `?pgbouncer=true&connection_limit=1` |
| `cached plan must not change result type` | Add `?pgbouncer=true&connection_limit=1` |
| Prisma migrate hangs | Use `npx prisma db push` instead |
| Auth fails after DB wipe | Clear localStorage, check for stale tokens |

## 🎯 **Debugging Checklist**

### Authentication Issues
1. Clear browser localStorage
2. Check JWT secrets in environment
3. Verify user/tenant/membership exist in DB
4. Test with fresh browser session
5. **Consider rollback before making code changes**

### Database Issues
1. Verify connection string has pgBouncer parameters
2. Test connection with direct psql
3. Check schema consistency across environments
4. Use direct SQL when Prisma tools fail

---

**Remember**: When in doubt, rollback and investigate systematically. Don't assume!
