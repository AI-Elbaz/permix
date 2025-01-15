import type { BasePermissions, Permix } from '../core/createPermix'
import { useState } from 'nuxt/app'

export function usePermix<T extends BasePermissions>(
  permix: Permix<T>,
) {
  const rules = useState('permix-rules', () => permix.getRules())

  permix.on('setup', async () => {
    rules.value = permix.getRules()
  })

  const check = <K extends keyof T>(entity: K, action: T[K]['action']) => {
    return permix.checkWithRules(rules.value, entity, action)
  }

  return { check }
}
