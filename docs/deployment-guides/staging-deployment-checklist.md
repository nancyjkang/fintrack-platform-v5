# 📋 Staging Deployment Checklist

## Pre-Deployment (5-10 minutes)

### Code Preparation
- [ ] **Branch Status**: Confirm you're on the correct branch (`release/v5.1` or feature branch)
- [ ] **Latest Changes**: `git pull origin [branch-name]` to get latest changes
- [ ] **Dependencies**: `npm install` to ensure all dependencies are current
- [ ] **Local Testing**: `npm run dev` - verify app starts locally without errors

### Quality Checks
- [ ] **TypeScript**: `npm run type-check` or `tsc --noEmit`
- [ ] **Linting**: `npm run lint` - fix any critical errors
- [ ] **Tests**: `npm run test` - ensure test suite passes
- [ ] **Build**: `npm run build` - verify production build succeeds

### Environment Verification
- [ ] **Environment Variables**: Verify staging-specific env vars are set
- [ ] **Database**: Confirm staging database is accessible
- [ ] **API Keys**: Ensure staging API keys are configured

## Deployment (2-5 minutes)

### Version Management
- [ ] **Update Version**: `npm version [new-version]` (e.g., `5.1.0-rc.1`)
- [ ] **Commit Version**: `git add . && git commit -m "chore: bump version to [version]"`
- [ ] **Push Changes**: `git push origin [branch-name]`

### Deploy to Vercel
- [ ] **Deploy Command**: `vercel --prod=false` (for staging)
- [ ] **Deployment URL**: Note the deployment URL provided by Vercel
- [ ] **Build Logs**: Monitor build process for any errors

## Post-Deployment (3-5 minutes)

### Health Checks
- [ ] **API Health**: `curl [staging-url]/api/health`
- [ ] **Database Connection**: Verify health check shows database connected
- [ ] **Authentication**: Test login/logout functionality
- [ ] **Core Features**: Quick smoke test of main features

### Documentation Updates
- [ ] **Update staging.md**: Use template to update deployment info
- [ ] **Update DEPLOYMENT_STATUS.md**: Update overview with new version
- [ ] **Commit Documentation**: `git add docs/ && git commit -m "docs: update staging deployment to [version]"`

### QA Notification
- [ ] **Notify QA Team**: Send deployment notification
- [ ] **Testing Instructions**: Provide list of features to test
- [ ] **Known Issues**: Document any issues discovered during deployment
- [ ] **Access Information**: Ensure QA has staging URL and test credentials

## Rollback Plan (If Needed)

### Quick Rollback
- [ ] **Previous Deployment**: Use Vercel dashboard to rollback to previous deployment
- [ ] **Alternative**: Deploy previous stable branch/commit
- [ ] **Verify Rollback**: Test that rollback was successful
- [ ] **Update Documentation**: Update staging.md with rollback information

### Investigation
- [ ] **Error Logs**: Check Vercel function logs for errors
- [ ] **Database Issues**: Verify database connectivity and data integrity
- [ ] **Environment Issues**: Check environment variables and configuration
- [ ] **Code Issues**: Review recent changes for potential bugs

## Common Issues & Solutions

### Build Failures
- **TypeScript Errors**: Fix type errors before deployment
- **Missing Dependencies**: Run `npm install` and commit package-lock.json
- **Environment Variables**: Ensure all required env vars are set in Vercel

### Runtime Errors
- **Database Connection**: Check database URL and credentials
- **API Errors**: Verify API endpoints and authentication
- **CORS Issues**: Check CORS configuration for staging domain

### Performance Issues
- **Slow Response**: Check database query performance
- **Memory Issues**: Monitor Vercel function memory usage
- **Timeout Issues**: Verify function timeout settings

## Success Criteria

### Deployment Successful When:
- [ ] Health check returns 200 OK
- [ ] Database connection confirmed
- [ ] Authentication flow works
- [ ] Core features accessible
- [ ] No critical errors in logs
- [ ] QA team can access and test

### Ready for QA When:
- [ ] All smoke tests pass
- [ ] Documentation updated
- [ ] QA team notified
- [ ] Test data available
- [ ] Known issues documented

---

**Estimated Total Time**: 10-20 minutes for complete staging deployment process
