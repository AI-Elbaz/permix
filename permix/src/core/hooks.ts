import type { PermixState } from './createPermix'
import { createHooks } from 'hookable'

export const hooks = createHooks<{
  setup: (state: PermixState<any>) => void
  ready: () => void
}>()
