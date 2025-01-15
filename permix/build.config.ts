import { defineBuildConfig } from 'unbuild'
import { optionalDependencies } from './package.json'

export default defineBuildConfig({
  entries: [
    './src/core/index.ts',
    './src/react/index.ts',
    './src/vue/index.ts',
    './src/nuxt/index.ts',
    './src/trpc/index.ts',
    './src/express/index.ts',
    './src/hono/index.ts',
  ],
  declaration: true,
  externals: [...Object.keys(optionalDependencies), 'nuxt/app'],
})
