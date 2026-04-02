import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  ...(isProd && {
    output: 'export',
    trailingSlash: true,
    basePath: '/Pasport-doma',
    assetPrefix: '/Pasport-doma/',
  }),
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
