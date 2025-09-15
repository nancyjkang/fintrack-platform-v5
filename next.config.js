/** @type {import('next').NextConfig} */
const nextConfig = {
  // Move serverComponentsExternalPackages to root level (Next.js 15 change)
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],

  // Configure ESLint for Vercel deployment
  eslint: {
    // Only run ESLint on these directories during build
    dirs: ['src'],
    // Don't fail build on ESLint errors in production
    ignoreDuringBuilds: true
  },


  // Ensure path mapping works
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src'
    }
    return config
  }
}

module.exports = nextConfig
