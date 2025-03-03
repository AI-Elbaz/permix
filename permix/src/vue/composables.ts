import type { Ref } from 'vue'
import type { Permix, PermixDefinition, PermixRules } from '../core/create-permix'
import { computed, inject } from 'vue'
import { checkWithRules, validatePermix } from '../core/create-permix'
import { PERMIX_CONTEXT_KEY } from './plugin'

function usePermixContext() {
  const context = inject(PERMIX_CONTEXT_KEY)

  if (!context) {
    throw new Error('[Permix]: Looks like you forgot to install the plugin')
  }

  return context as Ref<{
    permix: Permix<any>
    isReady: boolean
    state: PermixRules<any>
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

  const check: typeof permix.check = (entity, action, data) => {
    validatePermix(context.value.permix)
    return checkWithRules(context.value.state!, entity, action, data)
  }

  return { check, isReady: computed(() => context.value.isReady) }
}
