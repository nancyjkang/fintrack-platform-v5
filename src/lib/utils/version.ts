/**
 * Version and deployment information utilities
 */

import { getCurrentUTCDate } from './date-utils'

export interface VersionInfo {
  version: string
  environment: string
  buildTime: string
  gitCommit: string
  gitBranch: string
  fullVersion: string
  isProduction: boolean
  isStaging: boolean
  isDevelopment: boolean
}

/**
 * Get comprehensive version information for the application
 */
export const getVersionInfo = (): VersionInfo => {
  // Get version from package.json
  const version = process.env.npm_package_version || '5.1.0'

  // Determine environment
  const nodeEnv = process.env.NODE_ENV || 'development'
  const environment = process.env.DEPLOYMENT_ENV || nodeEnv

  // Build and git information (typically set by CI/CD)
  const buildTime = process.env.BUILD_TIME || getCurrentUTCDate().toISOString()
  const gitCommit = process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
  const gitBranch = process.env.GIT_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'unknown'

  // Environment flags
  const isProduction = environment === 'production'
  const isStaging = environment === 'staging' || gitBranch.startsWith('release/')
  const isDevelopment = environment === 'development'

  // Create full version string
  const shortCommit = gitCommit.slice(0, 7)
  const fullVersion = `${version}-${environment}.${shortCommit}`

  return {
    version,
    environment,
    buildTime,
    gitCommit,
    gitBranch,
    fullVersion,
    isProduction,
    isStaging,
    isDevelopment
  }
}

/**
 * Get a simple version string for display
 */
export const getDisplayVersion = (): string => {
  const { version, environment, gitCommit } = getVersionInfo()
  const shortCommit = gitCommit.slice(0, 7)

  if (environment === 'production') {
    return `v${version}`
  }

  return `v${version}-${environment}.${shortCommit}`
}

/**
 * Check if the application is running in a specific environment
 */
export const isEnvironment = (env: 'production' | 'staging' | 'development'): boolean => {
  const { environment, gitBranch } = getVersionInfo()

  switch (env) {
    case 'production':
      return environment === 'production'
    case 'staging':
      return environment === 'staging' || gitBranch.startsWith('release/')
    case 'development':
      return environment === 'development'
    default:
      return false
  }
}

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  const versionInfo = getVersionInfo()

  return {
    ...versionInfo,
    logLevel: versionInfo.isProduction ? 'info' : 'debug',
    enableDebugTools: !versionInfo.isProduction,
    enableAnalytics: versionInfo.isProduction,
    enableErrorReporting: versionInfo.isProduction || versionInfo.isStaging,
    apiTimeout: versionInfo.isProduction ? 30000 : 60000,
    maxRetries: versionInfo.isProduction ? 3 : 5
  }
}

/**
 * Format version info for logging
 */
export const formatVersionForLog = (): string => {
  const info = getVersionInfo()
  return `FinTrack v${info.version} (${info.environment}) [${info.gitCommit.slice(0, 7)}] built at ${info.buildTime}`
}

/**
 * Version comparison utilities
 */
export const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0

    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }

  return 0
}

/**
 * Check if current version is newer than a given version
 */
export const isNewerVersion = (compareVersion: string): boolean => {
  const currentVersion = getVersionInfo().version
  return compareVersions(currentVersion, compareVersion) > 0
}

/**
 * Get release notes URL for current version
 */
export const getReleaseNotesUrl = (): string => {
  const { version } = getVersionInfo()
  return `https://github.com/nancyjkang/fintrack-platform-v5/releases/tag/v${version}`
}
