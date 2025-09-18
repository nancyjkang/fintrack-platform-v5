# Staging Deployment Template

Use this template to update `staging.md` after each deployment:

## Update Current Deployment Section
```markdown
## Current Deployment
- **Version**: v5.1.0-rc.1
- **Deployed**: [DATE] [TIME] UTC
- **Platform**: Vercel
- **Database**: Staging database
- **Branch**: release/v5.1
- **Commit**: [GIT_COMMIT_HASH]
- **Deployed By**: [YOUR_NAME]
- **Status**: ✅ Active
- **URL**: [VERCEL_STAGING_URL]
```

## Add to Recent Deployments Table
```markdown
| v5.1.0-rc.1 | [DATE] | ✅ Active | New features: CSV Import, Enhanced Transactions |
```

## Update QA Status
- [ ] Mark features as ready for testing
- [ ] Add any known issues discovered during deployment
- [ ] Update testing checklist with new features

## Notify QA Team
- Send deployment notification with:
  - New version deployed
  - Features to test
  - Any known issues or limitations
  - Testing priorities
