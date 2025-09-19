/**
 * Database Configuration Utility
 * Provides environment-specific database URLs for safe multi-environment deployment
 */

export const getDatabaseUrl = (): string => {
  // Get environment information
  const vercelEnv = process.env.VERCEL_ENV // 'production' | 'preview' | 'development'
  const nodeEnv = process.env.NODE_ENV // 'production' | 'development' | 'test'

  // Environment-specific database URLs
  const productionUrl = process.env.DATABASE_URL_PRODUCTION
  const stagingUrl = process.env.DATABASE_URL_STAGING
  const developmentUrl = process.env.DATABASE_URL_DEVELOPMENT
  const fallbackUrl = process.env.DATABASE_URL // Current shared URL as fallback

  // Determine which database URL to use based on environment
  if (vercelEnv === 'production') {
    // Production uses staging database for now (shared environment)
    const dbUrl = productionUrl || stagingUrl
    if (dbUrl) {
      console.log('🔗 Using production database (shared with staging)')
      return dbUrl
    }
  }

  if (vercelEnv === 'preview' && stagingUrl) {
    console.log('🔗 Using staging database')
    return stagingUrl
  }

  if ((vercelEnv === 'development' || nodeEnv === 'development') && developmentUrl) {
    console.log('🔗 Using development database')
    return developmentUrl
  }

  // Fallback to shared database URL (current behavior)
  if (fallbackUrl) {
    console.log(`🔗 Using fallback database (env: ${vercelEnv || nodeEnv})`)
    return fallbackUrl
  }

  // Final fallback: use local PostgreSQL for development
  if (nodeEnv === 'development') {
    console.log('🔗 Using local PostgreSQL database (final fallback)')
    return 'postgresql://fintrack_dev:dev_password_123@localhost:5432/fintrack_v5_dev?schema=public'
  }

  throw new Error('No database URL configured for current environment')
}

/**
 * Get database configuration with additional metadata
 */
export const getDatabaseConfig = () => {
  const url = getDatabaseUrl()
  const vercelEnv = process.env.VERCEL_ENV
  const nodeEnv = process.env.NODE_ENV

  return {
    url,
    environment: vercelEnv || nodeEnv || 'unknown',
    isProduction: vercelEnv === 'production',
    isStaging: vercelEnv === 'preview',
    isDevelopment: vercelEnv === 'development' || nodeEnv === 'development'
  }
}

/**
 * Validate database configuration on startup
 */
export const validateDatabaseConfig = () => {
  try {
    const config = getDatabaseConfig()
    console.log(`✅ Database configured for ${config.environment} environment`)
    return config
  } catch (error) {
    console.error('❌ Database configuration error:', error)
    throw error
  }
}
