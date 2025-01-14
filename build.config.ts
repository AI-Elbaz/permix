import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['./src/core/index.ts', './src/react/index.ts', './src/vue/index.ts'],
  declaration: true,
  externals: ['vue', 'react'],
})
