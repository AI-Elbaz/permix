import type { InjectionKey, Plugin, Ref } from 'vue'
import type { Permix, PermixPermissions, PermixRules } from '../core/createPermix'
import { inject, ref } from 'vue'

const PERMIX_RULES_KEY: InjectionKey<Ref<PermixRules<any>>> = Symbol('permix-rules')

export const permixPlugin: Plugin<{ permix: Permix<any> }> = (app, { permix }) => {
  const rules = ref(permix.getRules())

  app.provide(PERMIX_RULES_KEY, rules)

  permix.on('setup', async () => {
    rules.value = permix.getRules()
  })
}

export function usePermix<T extends PermixPermissions>(
  permix: Permix<T>,
) {
  const rules = inject(PERMIX_RULES_KEY)

  if (!rules) {
    throw new Error('[Permix]: Looks like you forgot to install the plugin')
  }

  const check = <K extends keyof T>(entity: K, action: T[K]['action']) => {
    return permix.checkWithRules(rules.value, entity, action)
  }

  return { check }
}
