import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['twoslash', 'typescript'],
}

export default withMDX(config)
