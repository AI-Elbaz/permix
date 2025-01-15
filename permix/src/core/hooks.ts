import type { PermixRules } from './createPermix'
import { createHooks } from 'hookable'

export const hooks = createHooks<{
  setup: (rules: PermixRules) => void
}>()
