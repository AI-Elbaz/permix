import type { BasePermissions, Permix } from '../core/createPermix'
import { ref } from 'vue'

export function usePermix<T extends BasePermissions>(
  permix: Permix<T>,
) {
  const rules = ref(permix.getRules())

  permix.on('setup', async () => {
    rules.value = permix.getRules()
  })

  const check = <K extends keyof T>(entity: K, action: T[K]['action']) => {
    return permix.checkWithRules(rules.value, entity, action)
  }

  return { check }
}
