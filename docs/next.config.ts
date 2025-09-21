import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['twoslash', 'typescript'],
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: 'https://raw.githubusercontent.com/letstri/permix/refs/heads/main/docs/content/docs/:path*.mdx',
      },
    ]
  },
}

export default withMDX(config)
