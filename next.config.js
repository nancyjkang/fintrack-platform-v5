/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable Server Components
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']
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
