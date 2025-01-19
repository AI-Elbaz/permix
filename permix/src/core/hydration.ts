import { type Permix, type PermixDefinition, type PermixStateJSON, validatePermix } from './createPermix'

export function dehydrate<Permissions extends PermixDefinition>(permix: Permix<Permissions>) {
  validatePermix(permix)

  if (!permix._.isReady()) {
    throw new Error('[Permix]: To dehydrate a Permix, `setup` must be called first.')
  }

  return permix._.getStateJSON()
}

export function hydrate<Permissions extends PermixDefinition>(permix: Permix<Permissions>, state: PermixStateJSON<Permissions>) {
  validatePermix(permix)
  return permix._.setState(state)
}
