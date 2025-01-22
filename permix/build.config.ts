import { readFile, writeFile } from 'node:fs/promises'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([
  {
    name: 'permix',
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
    hooks: {
      'build:done': async () => {
        const file = await readFile('./dist/react/index.mjs', 'utf-8')
        await writeFile('./dist/react/index.mjs', `'use client';\n\n${file}`)
      },
    },
  },
  {
    entries: ['./src/nuxt/index.ts'],
  },
])
