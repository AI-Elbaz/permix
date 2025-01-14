import type { GetRules } from './createPermix'
import { createHooks } from 'hookable'

export const hooks = createHooks<{
  setup: (rules: GetRules) => void
}>()
