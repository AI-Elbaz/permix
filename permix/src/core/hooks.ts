import type { PermixDefinition, PermixState } from './createPermix'
import type { DehydratedState } from './hydration'
import { createHooks as hooks } from 'hookable'

export function createHooks<Permissions extends PermixDefinition>() {
  return hooks<{
    setup: (state: PermixState<any>) => void
    ready: () => void
    hydrate: (state: DehydratedState<Permissions>) => void
  }>()
}
