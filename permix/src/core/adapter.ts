import type { CheckFunctionParams, PermixDefinition } from './createPermix'

export interface PermixForbiddenContext<Definition extends PermixDefinition> {
  entity: keyof Definition
  actions: Definition[keyof Definition]['action'][]
}

export function createPermixForbiddenContext<Definition extends PermixDefinition>(...params: CheckFunctionParams<Definition, keyof Definition>) {
  const [entity, action] = params

  return {
    entity,
    actions: Array.isArray(action) ? action : [action],
  }
}
