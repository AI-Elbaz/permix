import type { InjectionKey, Plugin, Ref } from 'vue'
import type { Permix, PermixDefinition, PermixInternal, PermixSetup } from '../core/createPermix'
import { computed, inject, ref } from 'vue'

const PERMIX_CONTEXT_KEY: InjectionKey<Ref<{ permissions: PermixSetup<any> | null, isReady: boolean }>> = Symbol('permix-setup')

export const permixPlugin: Plugin<{ permix: Permix<any> }> = (app, { permix }) => {
  if (!permix) {
    throw new Error('[Permix]: Looks like you forgot to provide the permix instance to the plugin')
  }

  const _permix = permix as PermixInternal<any>

  const context = ref({ permissions: _permix._.getPermissions(), isReady: _permix._.isReady })

  app.provide(PERMIX_CONTEXT_KEY, context)

  _permix.on('setup', async () => {
    context.value = { permissions: _permix._.getPermissions(), isReady: true }
  })
}

export function usePermix<T extends PermixDefinition>(
  permix: Permix<T>,
) {
  const _permix = permix as PermixInternal<any>
  const context = inject(PERMIX_CONTEXT_KEY)

  if (!context) {
    throw new Error('[Permix]: Looks like you forgot to install the plugin')
  }

  const check: typeof permix.check = (entity, action, data) => {
    return _permix._.checkWithPermissions(context.value.permissions!, entity, action, data)
  }

  return { check, isReady: computed(() => context.value.isReady) }
}
