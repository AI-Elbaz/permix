import type { InjectionKey, Plugin, Ref } from 'vue'
import type { Permix, PermixDefinition, PermixState } from '../core/createPermix'
import { computed, inject, ref } from 'vue'
import { validatePermix } from '../core/createPermix'

const PERMIX_CONTEXT_KEY: InjectionKey<Ref<{
  permix: Permix<any>
  isReady: boolean
  state: PermixState<any>
}>> = Symbol('permix-setup')

function usePermixContext() {
  const context = inject(PERMIX_CONTEXT_KEY)

  if (!context) {
    throw new Error('[Permix]: Looks like you forgot to install the plugin')
  }

  return context
}

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

  const context = ref({
    permix,
    state: permix._.getState(),
    isReady: false,
  })

  app.provide(PERMIX_CONTEXT_KEY, context)

  permix.hook('setup', () => {
    context.value.state = permix._.getState()
  })

  permix.hook('ready', () => {
    context.value.isReady = true
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
  validatePermix(permix)

  const context = usePermixContext()

  const check: typeof context.value.permix.check = (entity, action, data) => {
    validatePermix(context.value.permix)
    return context.value.permix._.checkWithState(context.value.state!, entity, action, data)
  }

  return { check, isReady: computed(() => context.value.isReady) }
}
