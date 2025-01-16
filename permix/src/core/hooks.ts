import type { PermixSetup } from './createPermix'
import { createHooks } from 'hookable'

export const hooks = createHooks<{
  setup: (setup: PermixSetup) => void
}>()
