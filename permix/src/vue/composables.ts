import type { Ref } from 'vue'
import type { Permix, PermixDefinition, PermixState } from '../core/createPermix'
import { computed, inject } from 'vue'
import { validatePermix } from '../core/createPermix'
import { PERMIX_CONTEXT_KEY } from './plugin'

function usePermixContext() {
  const context = inject(PERMIX_CONTEXT_KEY)

  if (!context) {
    throw new Error('[Permix]: Looks like you forgot to install the plugin')
  }

  return context as Ref<{
    permix: Permix<any>
    isReady: boolean
    state: PermixState<any>
  }>
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
