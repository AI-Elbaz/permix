import type { InjectionKey, Plugin, Ref } from 'vue'
import type { Permix, PermixInternal, PermixPermissions, PermixSetup } from '../core/createPermix'
import { inject, ref } from 'vue'

const PERMIX_SETUP_KEY: InjectionKey<Ref<PermixSetup<any> | null>> = Symbol('permix-setup')

export const permixPlugin: Plugin<{ permix: Permix<any> }> = (app, { permix }) => {
  if (!permix) {
    throw new Error('[Permix]: Looks like you forgot to provide the permix instance to the plugin')
  }

  const _permix = permix as PermixInternal<any>

  const setup = ref(_permix._.getPermissions())

  app.provide(PERMIX_SETUP_KEY, setup)

  _permix.on('setup', async () => {
    setup.value = _permix._.getPermissions()
  })
}

export function usePermix<T extends PermixPermissions>(
  permix: Permix<T>,
) {
  const _permix = permix as PermixInternal<any>
  const setup = inject(PERMIX_SETUP_KEY)

  if (!setup) {
    throw new Error('[Permix]: Looks like you forgot to install the plugin')
  }

  const check: typeof permix.check = (entity, action, data) => {
    return _permix._.checkWithPermissions(setup.value!, entity, action, data)
  }

  return { check }
}
