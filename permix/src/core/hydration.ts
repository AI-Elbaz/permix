import type { Permix, PermixDefinition, PermixStateJSON } from './create-permix'
import { validatePermix } from './create-permix'

export type DehydratedState<Permissions extends PermixDefinition> = PermixStateJSON<Permissions>

/**
 * @deprecated Use `permix.dehydrate()` and `permix.hydrate(state)` directly instead.
 */
export function dehydrate<Permissions extends PermixDefinition>(permix: Permix<Permissions>) {
  validatePermix(permix)

  return permix.dehydrate()
}

/**
 * @deprecated Use `permix.dehydrate()` and `permix.hydrate(state)` directly instead.
 */
export function hydrate<Permissions extends PermixDefinition>(permix: Permix<Permissions>, state: DehydratedState<Permissions>) {
  validatePermix(permix)

  permix.hydrate(state)
}
