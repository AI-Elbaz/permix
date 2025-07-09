import type { Permix, PermixDefinition, PermixStateJSON } from './create-permix'
import { validatePermix } from './create-permix'

export type DehydratedState<Permissions extends PermixDefinition> = PermixStateJSON<Permissions>

export function dehydrate<Permissions extends PermixDefinition>(permix: Permix<Permissions>) {
  validatePermix(permix)

  if (!permix._.isSetupCalled()) {
    throw new Error('[Permix]: To dehydrate Permix, `setup` must be called first.')
  }

  return permix._.getSerializableState()
}

export function hydrate<Permissions extends PermixDefinition>(permix: Permix<Permissions>, state: DehydratedState<Permissions>) {
  validatePermix(permix)

  permix._.setRules(permix._.parseSerializableState(state))
  permix._.hooks.callHook('hydrate')

  const timeout = setTimeout(() => {
    console.error('[Permix]: You should call `setup` immediately after hydration to fully restore Permix state. https://permix.letstri.dev/docs/guide/hydration')
  }, 1000)

  permix.hook('setup', () => {
    clearTimeout(timeout)
  })
}
