import { readFile, writeFile } from 'node:fs/promises'
import { defineBuildConfig } from 'unbuild'
import { optionalDependencies } from './package.json'

export default defineBuildConfig({
  entries: [
    './src/core/index.ts',
    './src/react/index.ts',
    './src/vue/index.ts',
    './src/trpc/index.ts',
    './src/express/index.ts',
    './src/hono/index.ts',
  ],
  declaration: true,
  externals: [...Object.keys(optionalDependencies)],
  hooks: {
    'build:done': async () => {
      // add to file `dist/react/index.mjs` directive on the top of the file: 'use client'
      const file = await readFile('./dist/react/index.mjs', 'utf-8')
      await writeFile('./dist/react/index.mjs', `'use client';\n\n${file}`)
    },
  },
})
