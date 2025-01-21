import type { InjectionKey, Plugin, Ref } from 'vue'
import type { Permix, PermixDefinition, PermixState } from '../core/createPermix'
import { computed, inject, ref } from 'vue'
import { validatePermix } from '../core/createPermix'

const PERMIX_CONTEXT_KEY: InjectionKey<Ref<{ state: PermixState<any> | null, isReady: boolean }>> = Symbol('permix-setup')

/**
 * Vue plugin that provides the Permix context to your application.
 *
 * @link https://permix.letstri.dev/docs/integrations/vue
 */
export const permixPlugin: Plugin<{ permix: Permix<any> }> = (app, { permix }) => {
  if (!permix) {
    throw new Error('[Permix]: Looks like you forgot to provide the permix instance to the plugin')
  }

  validatePermix(permix)

  const context = ref({ state: permix._.getState(), isReady: permix.isReady() })

  app.provide(PERMIX_CONTEXT_KEY, context)

  permix.hook('setup', () => {
    context.value = { state: permix._.getState(), isReady: true }
  })
}

/**
 * Composable that provides the Permix context to your Vue components.
 *
 * @link https://permix.letstri.dev/docs/integrations/vue
 */
export function usePermix<T extends PermixDefinition>(
  permix: Permix<T>,
) {
  const context = inject(PERMIX_CONTEXT_KEY)

  if (!context) {
    throw new Error('[Permix]: Looks like you forgot to install the plugin')
  }

  validatePermix(permix)

  const check: typeof permix.check = (entity, action, data) => {
    return permix._.checkWithState(context.value.state!, entity, action, data)
  }

  return { check, isReady: computed(() => context.value.isReady) }
}
