import type { Permix, PermixDefinition, PermixStateJSON } from './createPermix'
import { validatePermix } from './createPermix'

export type DehydratedState<Permissions extends PermixDefinition> = PermixStateJSON<Permissions>

export function dehydrate<Permissions extends PermixDefinition>(permix: Permix<Permissions>) {
  validatePermix(permix)

  if (!permix.isReady()) {
    throw new Error('[Permix]: To dehydrate a Permix, `setup` must be called first.')
  }

  return permix._.getStateJSON()
}

export function hydrate<Permissions extends PermixDefinition>(permix: Permix<Permissions>, state: DehydratedState<Permissions>) {
  validatePermix(permix)

  permix._.setState(state)

  permix._.hooks.callHook('hydrate', state)
}
